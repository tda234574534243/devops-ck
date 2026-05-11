import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-outline-variant/20 bg-surface-container-low py-16">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-8 text-center">
        <div className="font-headline text-2xl font-extrabold uppercase tracking-[-0.08em] text-on-surface">
          CueMasters
        </div>
        <p className="max-w-2xl text-sm text-secondary">
          Không gian billiards hiện đại dành cho những buổi chơi chỉn chu, huấn luyện bài bản và trải nghiệm dịch vụ đồng nhất bằng tiếng Việt.
        </p>
        <div className="flex flex-wrap justify-center gap-10">
          <a
            className="font-body text-xs uppercase tracking-[0.22em] text-secondary transition-all duration-300 hover:text-primary hover:underline decoration-primary underline-offset-4"
            href="#"
          >
            Chính sách bảo mật
          </a>
          <a
            className="font-body text-xs uppercase tracking-[0.22em] text-secondary transition-all duration-300 hover:text-primary hover:underline decoration-primary underline-offset-4"
            href="#"
          >
            Điều khoản dịch vụ
          </a>
          <a
            className="font-body text-xs uppercase tracking-[0.22em] text-secondary transition-all duration-300 hover:text-primary hover:underline decoration-primary underline-offset-4"
            href="#"
          >
            Liên hệ
          </a>
        </div>
        <p className="font-body text-xs uppercase tracking-[0.22em] text-secondary/50">
          &copy; 2026 CueMasters Precision Atelier. Bảo lưu mọi quyền.
        </p>
      </div>
    </footer>
  );
}
