import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Flag, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScreenProps } from '../types';
import { authService } from '../services/authService';

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.response?.data?.Message || fallback;

export default function Register({ onNavigate }: ScreenProps) {
  const googleSsoMessage = 'Đăng ký bằng Google sẽ sớm được hỗ trợ.';
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.register(email, password, fullName);
      navigate('/verify-email', { state: { email, purpose: 'activate' } });
    } catch (err: any) {
      setError(getErrorMessage(err, 'Đăng ký thất bại. Vui lòng thử lại sau.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    onNavigate('login');
  };

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden text-on-surface antialiased md:flex-row">
      <section className="relative hidden items-center justify-center overflow-hidden bg-on-surface md:flex md:w-1/2 lg:w-3/5">
        <div className="absolute inset-0 z-0">
          <img
            alt="Cơ thủ chuyên nghiệp trong không gian thi đấu cao cấp"
            className="h-full w-full scale-105 object-cover opacity-60 grayscale transition-all duration-1000 hover:grayscale-0"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtc1d5yiY6ZBu9lUUP2zeII5Eujit_2SaSZ9LHgsCWuoTIPJiL6IWM94vJnv5qJAYKiPwbFzp0uioFJrx5CVpHLR2SupW5eT4V9wBIq59eDPtfZmVksws1lXB_Ip0cvnEJp2kLRFFD7uuH-4FWEOGSgw-fl3V-1pKypdo0w5aL-RyS0GvB1KjsEbYpueVwhCQ0c6P624_A9UfHzGfJ8tIvkfPsFC9LtYj2rMA1C1VSNeo3gIhjzbxqD1gja-Kzthd7EfOJEXWVXm1I"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-on-surface via-on-surface/40 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-2xl p-16">
          <div className="mb-12">
            <span className="brand-font text-3xl font-extrabold uppercase tracking-[-0.08em] text-primary">
              CueMasters
            </span>
          </div>
          <h1 className="font-headline mb-6 text-5xl font-extrabold leading-tight tracking-[-0.08em] text-white lg:text-7xl">
            ĐỈNH CAO CỦA
            <br />
            <span className="italic text-primary">SỰ CHÍNH XÁC.</span>
          </h1>
          <p className="mb-10 max-w-md text-lg leading-relaxed text-surface-variant/80">
            Gia nhập cộng đồng cơ thủ hiện đại. Theo dõi tiến trình luyện tập, đặt bàn nhanh và
            quản lý lịch chơi của bạn trong một giao diện thống nhất bằng tiếng Việt.
          </p>

          <div className="flex items-center gap-6">
            <div className="flex -space-x-3">
              <img
                alt="Thành viên CueMasters 1"
                className="h-10 w-10 rounded-full border-2 border-on-surface"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8UKFCj53NqUrGT8BvMcYt2OB0Kus6419SHB-96e6OXozfa9aepPQgLAoZks_xoUs4Axz60OuKSwD8_v2TSq_P2U7hDrqJodrg74kZo5BJwY0PowFkqfwZf-Xrr794VwdwldXCTlMZpV6MCfMNUlRtjOQ1mHzCfhFkLQkdwZUykKCdXG0ACctrptUuaR6YimqBYULFDb0OruBsy8STp6PlfZoBe4vgwX6wpAF2bDIuGzWdyzdpGUU0G1b9yceBXogqlyk2qFzefhFO"
                referrerPolicy="no-referrer"
              />
              <img
                alt="Thành viên CueMasters 2"
                className="h-10 w-10 rounded-full border-2 border-on-surface"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCI4vP7Y7xrAmRDbp9lC1_fJgjJmwksoSghUXoVwHXvf_Tj_6ChUDTSFxTISqF0TsZB9QPaUBfKFvjBh2OJ8O0WAK_52M_IQZQyyeIHmNSbeIhuWtnnils7oINDfq1sAn95EGjOM_ThVdzkiq4y6q7qXVBEHli_92FSwz2aXRNQvx_P_htRCA12mSSbSvakJGgil2oryZpWrzWajhLYL5gOtnqlGBScE84QYpJ-vk25MY5VRuItiNt5wJd8nlvflF1WtRnr92sF58Ld"
                referrerPolicy="no-referrer"
              />
              <img
                alt="Thành viên CueMasters 3"
                className="h-10 w-10 rounded-full border-2 border-on-surface"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCiGFuFGppEr6Z2TwVCaLEWZuq0GtOx4SmsyfKzxuzHvrvajTSFhSU7PAiyjAUnmeOnu5vPAawC7guDeImtzb4ue2VOXmwyOAhCdUZ3xG_HqUNamEbm_qbCmvjLPO83JWMzUcFcXcWzDQmqh-kuHvZpRrmG0vmELlGnl9FfcYWsOXHWdGWuYww0ajDBKQvN3jIHJReRTiolAsR2S8Ap85q4dRpaKJbwbrOgATe7UqJr1jkoH0LW7Avaxicse7el4fYRfMe3DgSZdMh"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-sm font-medium text-surface-variant">Hơn 2.400 cơ thủ đã tham gia</p>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-12 right-12 select-none text-white/10">
          <Flag className="h-48 w-48" strokeWidth={1} />
        </div>
      </section>

      <section className="flex min-h-screen w-full flex-col justify-center bg-surface px-8 py-12 lg:w-2/5 lg:px-20 md:w-1/2">
        <div className="mb-8">
          <button
            type="button"
            onClick={handleBackToLogin}
            className="inline-flex items-center gap-2 text-sm font-semibold text-secondary transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Về đăng nhập</span>
          </button>
        </div>

        <div className="mb-10 text-left">
          <div className="mb-8 md:hidden">
            <span className="brand-font text-2xl font-extrabold tracking-[-0.08em] text-primary">
              CueMasters
            </span>
          </div>
          <h2 className="font-headline mb-3 text-3xl font-extrabold tracking-[-0.05em] text-on-surface">
            Tạo tài khoản mới
          </h2>
          <p className="font-body text-sm text-secondary">
            Bắt đầu hành trình chinh phục những đường cơ đẹp và lịch chơi được sắp xếp rõ ràng.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && <div className="text-sm font-semibold text-red-500">{error}</div>}

          <div className="space-y-1.5">
            <label className="ml-1 font-label text-xs font-bold uppercase tracking-[0.18em] text-secondary" htmlFor="name">
              Họ và tên
            </label>
            <input
              className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-4 font-body text-on-surface outline-none transition-all placeholder:text-outline/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
              id="name"
              name="name"
              placeholder="Nguyễn Văn A"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 font-label text-xs font-bold uppercase tracking-[0.18em] text-secondary" htmlFor="email">
              Email
            </label>
            <input
              className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-4 font-body text-on-surface outline-none transition-all placeholder:text-outline/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
              id="email"
              name="email"
              placeholder="tenban@cuemasters.vn"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="ml-1 font-label text-xs font-bold uppercase tracking-[0.18em] text-secondary" htmlFor="reg-password">
                Mật khẩu
              </label>
              <input
                className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-4 font-body text-on-surface outline-none transition-all placeholder:text-outline/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
                id="reg-password"
                name="password"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="ml-1 font-label text-xs font-bold uppercase tracking-[0.18em] text-secondary" htmlFor="confirm-password">
                Xác nhận
              </label>
              <input
                className="w-full rounded-2xl border border-transparent bg-surface-container-low px-4 py-4 font-body text-on-surface outline-none transition-all placeholder:text-outline/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
                id="confirm-password"
                name="confirm-password"
                placeholder="••••••••"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-start gap-3 py-2">
            <div className="flex h-5 items-center">
              <input
                className="h-4 w-4 rounded-sm border-outline-variant bg-surface-container text-primary focus:ring-primary/20"
                id="terms"
                type="checkbox"
                required
              />
            </div>
            <label className="font-body text-xs leading-relaxed text-secondary" htmlFor="terms">
              Tôi đồng ý với <a className="font-semibold text-primary hover:underline" href="#terms">Điều khoản dịch vụ</a> và{' '}
              <a className="font-semibold text-primary hover:underline" href="#privacy">Chính sách bảo mật</a> của CueMasters.
            </label>
          </div>

          <button
            className="billiard-gradient mt-4 flex w-full items-center justify-center gap-2 rounded-full py-4 font-headline font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? 'Đang đăng ký...' : 'Đăng ký ngay'}</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>

          <div className="relative flex items-center py-6">
            <div className="flex-grow border-t border-outline-variant/30"></div>
            <span className="mx-4 flex-shrink text-xs font-bold uppercase tracking-[0.18em] text-outline/40">
              Hoặc
            </span>
            <div className="flex-grow border-t border-outline-variant/30"></div>
          </div>

          <button
            className="flex w-full items-center justify-center gap-3 rounded-full border border-outline-variant/50 bg-white py-4 font-body font-semibold text-on-surface transition-all disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled
            title={googleSsoMessage}
            aria-label={googleSsoMessage}
          >
            <Globe className="h-5 w-5 text-secondary" />
            <span>Đăng ký với Google</span>
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="font-body text-sm text-secondary">
            Đã có tài khoản?
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="ml-1 font-bold text-primary hover:underline"
            >
              Đăng nhập ngay
            </button>
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-10 text-[10px] font-bold uppercase tracking-[0.2em] text-outline/40">
          <span>CueMasters © 2024</span>
          <div className="flex gap-4">
            <a className="transition-colors hover:text-primary" href="#privacy">Bảo mật</a>
            <a className="transition-colors hover:text-primary" href="#support">Hỗ trợ</a>
          </div>
        </div>
      </section>

      <div className="pointer-events-none fixed inset-0 z-[-1] opacity-[0.02]">
        <div className="absolute top-1/4 -right-20 rotate-45 transform">
          <div className="h-[1000px] w-2 bg-on-surface"></div>
        </div>
        <div className="absolute bottom-1/4 -left-20 -rotate-12 transform">
          <div className="h-[800px] w-4 bg-on-surface"></div>
        </div>
      </div>
    </main>
  );
}
