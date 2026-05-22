# Vagrant Production Machine — Hướng dẫn nhanh

Tài liệu này mô tả cách hoạt động của máy ảo Vagrant trong thư mục `production-machine`, cách cài đặt, triển khai và khắc phục sự cố cơ bản cho kiến trúc Docker-based của dự án.

## Tổng quan

- VM được provision để chạy Docker và Docker Compose plugin. Thư mục `production-machine` được mount vào `/home/vagrant/app` trong VM.
- Một script deploy (`deploy.sh`) có nhiệm vụ pull image từ registry, chạy `docker compose up -d`, và dọn ảnh cũ.

## Kiến trúc (tóm tắt)

- Nginx (reverse proxy) — lắng nghe cổng 80 (và 5000 cho legacy nếu cần) và proxy `/api` tới backend.
- Frontend — build sẵn hoặc pull từ registry, phục vụ tệp tĩnh (không expose cổng ra ngoài container, Nginx proxy tới frontend).
- Backend (.NET) — chạy trên cổng 8080 trong container.
- DB — SQL Server container (cổng 1433).

Các dịch vụ được cấu hình trong `docker-compose.yml` trong cùng thư mục.

## Yêu cầu

- Host: VirtualBox (hoặc provider tương thích) + Vagrant.
- Quyền Internet để pull Docker images hoặc access registry nội bộ.

Trên máy dev (host), cần cài:

```bash
# macOS / Linux / Windows (WSL/PowerShell) – cài Vagrant và VirtualBox theo hướng dẫn chính thức
vagrant --version
virtualbox --help
```

## Cách khởi tạo VM và provision

1. Mở terminal trên host, chuyển tới thư mục Vagrant:

```bash
cd production-machine/Vagrant
vagrant up
```

2. Nếu VM đã tồn tại và muốn chạy lại provisioning:

```bash
vagrant provision
```

3. SSH vào VM:

```bash
vagrant ssh
cd /home/vagrant/app
```

## Cơ chế deploy

- File `/home/vagrant/app/deploy.sh` (được cung cấp trong repo) làm:
  - dùng file lock để tránh chạy trùng
  - pull 2 image backend/frontend (có retry)
  - chạy `docker compose up -d --remove-orphans`
  - `docker image prune -af` để dọn ảnh không dùng

- Cron job chạy `deploy.sh` một lần mỗi giờ (lúc phút 0) theo cấu hình trong `/etc/cron.d/devops-deploy`.
  - Vagrant provision hiện tạo file cron này và cron chỉ chạy `deploy.sh` nếu file đó có quyền thực thi.

## Các lệnh hữu ích trong VM

- Xem containers:

```bash
docker compose ps
docker ps -a
```

- Xem logs:

```bash
docker compose logs -f nginx
docker compose logs -f backend
docker compose logs -f frontend
tail -n 200 /home/vagrant/app/deploy-runtime.log
```

- Pull & redeploy thủ công:

```bash
cd /home/vagrant/app
docker compose pull
docker compose up -d --remove-orphans
```

## Thay đổi cấu hình frontend (API URL)

- Để tránh lỗi frontend gọi `http://localhost:5000` trên máy client, frontend nên sử dụng base path Dockerfile tương đối `/api`.
- Khi build image thủ công, bật `VITE_API_URL` như sau:

```bash
docker build -t my-frontend:latest --build-arg VITE_API_URL=/api .
```

-- Hoặc chỉnh `devops-project-frontend/.env` để mặc định là `/api` trước khi build.

## Docker Compose — quick reference

- File `docker-compose.yml` trong thư mục `production-machine` định nghĩa các service: `db`, `backend`, `frontend`, `nginx`.
- Nginx container lấy file cấu hình từ `nginx.conf` (đã có trong repo) và expose cổng 80 (và 5000 cho legacy).

## Tắt hoặc gỡ OTP (nếu cần)

- Hệ thống OTP có thể bật/tắt bằng cấu hình (ví dụ `Auth:RequireOtpVerification` trong `appsettings.json` hoặc biến môi trường tương ứng). Nếu bạn chỉ muốn tắt OTP trong production, set biến môi trường khi chạy backend container.

## Xử lý sự cố phổ biến

- Lỗi trên trình duyệt `ERR_CONNECTION_REFUSED` khi frontend cố gọi `localhost:5000`: do frontend dùng URL cố định `localhost` — build lại frontend với `VITE_API_URL=/api` hoặc cấu hình Nginx để proxy.
- Backend container unhealthy: kiểm tra `docker compose logs backend` và healthcheck; đảm bảo SQL Server sẵn sàng.
-- Nếu cron không chạy: kiểm tra `systemctl status cron` và quyền file `/etc/cron.d/devops-deploy`.
-- Tạo hoặc cập nhật cron nhanh trong VM (không cần reprovision):

```bash
sudo tee /etc/cron.d/devops-deploy > /dev/null <<'CRON'
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin

0 * * * * vagrant [ -x /home/vagrant/app/deploy.sh ] && /home/vagrant/app/deploy.sh >> /home/vagrant/app/deploy.log 2>&1
CRON

sudo chmod 644 /etc/cron.d/devops-deploy
sudo systemctl restart cron
sudo systemctl status cron --no-pager
```

Kiểm tra log cron chạy: `tail -n 200 /home/vagrant/app/deploy.log`.

## Thay đổi nâng cao

- Nếu muốn build frontend trực tiếp trên VM thay vì pull image: chỉnh `docker-compose.yml` để dùng `build: ../devops-project-frontend` và đảm bảo Node / build tools có sẵn, hoặc build image trên host và push lên registry.

## Liên hệ / Ghi chú

- File quan trọng: `/home/vagrant/app/deploy.sh`, `/home/vagrant/app/docker-compose.yml`, `/home/vagrant/app/nginx.conf`.
***Hết***
