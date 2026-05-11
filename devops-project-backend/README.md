# CueMasters API

Hệ thống Backend mạnh mẽ hỗ trợ quản lý đặt bàn bida, xử lý thanh toán và cập nhật trạng thái thời gian thực.

## Công nghệ sử dụng
- **Framework:** .NET 8.0 Web API
- **Database:** SQL Server
- **ORM:** Entity Framework Core
- **Auth:** JWT (JSON Web Token)
- **Real-time:** SignalR Hubs
- **Validation:** FluentValidation patterns

## Hướng dẫn cài đặt

1. **Clone repository:**
   ```bash
   git clone https://github.com/khanhtq/devops-project-backend.git
   cd BE_Cuemasters
   ```

2. **Khôi phục các gói NuGet:**
   ```bash
   dotnet restore
   ```

3. **Cấu hình Database:**
   - Tạo file `appsettings.json` trong thư mục gốc của dự án.
   - Sao chép nội dung từ `appsettings.Development.json` và cập nhật:
     - `DefaultConnection`: Chuỗi kết nối đến SQL Server của bạn.
     - `JwtSettings:SecretKey`: Mã bí mật dài ít nhất 32 ký tự.
     - `MailSetting`: Tài khoản SMTP Brevo.

4. **Cập nhật Database (Migration):**
   ```bash
   dotnet ef database update
   ```

5. **Chạy ứng dụng:**
   ```bash
   dotnet run
   ```

## API Endpoints chính
- `POST /api/auth/login`: Đăng nhập & cấp token.
- `GET /api/tables`: Lấy danh sách bàn & trạng thái thời gian thực.
- `POST /api/bookings`: Đặt bàn mới.
- `PUT /api/admin/bookings/{id}/checkout`: Thanh toán và kết thúc phiên chơi.
