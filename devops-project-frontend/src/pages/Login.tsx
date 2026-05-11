import React, { useState } from 'react';
import { ArrowLeft, Quote, Globe, Loader2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getDefaultRouteForRole } from '../hooks/useAuth';
import { ScreenProps } from '../types';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { createGoogleAuthorizationUrl, getGoogleClientId } from '../utils/googleOAuth';

export default function Login({ onNavigate }: ScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { message?: string } | null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [successMessage] = useState(locationState?.message || '');
  const login = useAuthStore((state) => state.login);
  const googleConfigured = !!getGoogleClientId();
  const googleSsoMessage = googleConfigured
    ? 'Đăng nhập bằng tài khoản Google.'
    : 'Thiếu VITE_GOOGLE_CLIENT_ID trong cấu hình frontend.';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await authService.login(email, password);
      login(
        {
          id: response.id,
          email: response.email,
          fullName: response.fullName,
          role: response.role,
        },
        response.token,
        response.refreshToken ?? null,
      );
      navigate(getDefaultRouteForRole(response.role));
    } catch (err: any) {
      if (err.response?.status === 403) {
        navigate('/verify-email', { state: { email, purpose: 'activate' } });
        return;
      }

      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    if (!googleConfigured) {
      setError('Google login chưa được cấu hình. Thiếu VITE_GOOGLE_CLIENT_ID.');
      return;
    }

    try {
      setIsGoogleLoading(true);
      const authorizationUrl = await createGoogleAuthorizationUrl();
      window.location.assign(authorizationUrl);
    } catch {
      setIsGoogleLoading(false);
      setError('Không thể khởi tạo đăng nhập Google. Vui lòng thử lại.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-surface text-on-surface antialiased md:flex-row">
      <section className="no-scrollbar flex w-full flex-col justify-center overflow-y-auto bg-surface px-8 py-12 md:w-[45%] md:px-16 lg:w-[40%] lg:px-24">
        <div className="mb-8">
          <button
            type="button"
            onClick={handleBackToHome}
            className="inline-flex items-center gap-2 text-sm font-semibold text-secondary transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Về trang chủ</span>
          </button>
        </div>

        <div className="mb-12">
          <span className="brand-font text-2xl font-extrabold tracking-[-0.08em] text-on-surface">
            CueMasters
          </span>
        </div>

        <div className="mb-10 space-y-3">
          <h1 className="brand-font text-4xl font-extrabold leading-tight tracking-[-0.06em] text-on-surface">
            Chào mừng quay lại.
          </h1>
          <p className="font-body text-secondary">
            Đăng nhập để tiếp tục hành trình chinh phục những cú đánh chuẩn xác của bạn.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {successMessage && <div className="text-sm font-semibold text-emerald-600">{successMessage}</div>}
          {error && <div className="text-sm font-semibold text-red-500">{error}</div>}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-secondary" htmlFor="email">
              Email
            </label>
            <input
              className="w-full rounded-2xl border border-transparent bg-surface-container-high px-4 py-4 outline-none transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/10"
              id="email"
              name="email"
              placeholder="tenban@cuemasters.vn"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-secondary" htmlFor="password">
                Mật khẩu
              </label>
              <Link className="text-xs font-medium text-primary transition-opacity hover:opacity-80" to="/forgot-password">
                Quên mật khẩu?
              </Link>
            </div>
            <input
              className="w-full rounded-2xl border border-transparent bg-surface-container-high px-4 py-4 outline-none transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/10"
              id="password"
              name="password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center">
            <input
              className="h-4 w-4 rounded border-outline-variant bg-surface-container text-primary focus:ring-primary focus:ring-offset-0"
              id="remember"
              name="remember"
              type="checkbox"
            />
            <label className="ml-3 select-none text-sm text-secondary" htmlFor="remember">
              Ghi nhớ đăng nhập
            </label>
          </div>

          <button
            className="w-full rounded-full bg-primary py-4 font-bold tracking-[-0.01em] text-on-primary shadow-lg shadow-primary/10 transition-all duration-300 active:scale-95 hover:bg-primary-container"
            type="submit"
          >
            Đăng nhập
          </button>
        </form>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant/30"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-4 font-semibold tracking-[0.2em] text-secondary/60">
              Hoặc dùng
            </span>
          </div>
        </div>

        <button
          className="flex w-full items-center justify-center gap-3 rounded-full border border-outline-variant/20 bg-surface-container-low py-4 font-bold tracking-[-0.01em] text-on-surface transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={() => void handleGoogleSignIn()}
          disabled={isGoogleLoading || !googleConfigured}
          title={googleSsoMessage}
          aria-label={googleSsoMessage}
        >
          {isGoogleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-secondary" />
          ) : (
            <Globe className="h-5 w-5 text-secondary" />
          )}
          <span>{isGoogleLoading ? 'Đang chuyển hướng...' : 'Tiếp tục với Google'}</span>
        </button>

        <p className="mt-12 text-center text-sm text-secondary">
          Chưa có tài khoản?
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="ml-1 font-bold text-primary underline-offset-4 hover:underline"
          >
            Đăng ký ngay
          </button>
        </p>
      </section>

      <section className="relative hidden overflow-hidden bg-on-surface md:block md:w-[55%] lg:w-[60%]">
        <div className="absolute inset-0">
          <img
            className="h-full w-full scale-105 object-cover opacity-60 grayscale transition-all duration-[2000ms] ease-out hover:grayscale-0"
            alt="Cận cảnh bàn billiards với ánh sáng điện ảnh"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCG-E7wY4-7TiuxB7w3sT5T6W60Y5ubapAyQkHevtwnttykA7xFU8qNFiJkwceCRGSylrdsL1D6rdI6bllWra8XP5n3vmIyeJVJEEWNIZMsnrA0slUzfR67xXOxgnQ9DGDqQmZHRPVS0Imtx56eZbQKS6lqGdvQdLI3fXKD1Rk2YjMcccqP8QVQzjmnA7hese6vJP18YNsGkimFp-NKT7tgmcijEufeF4KDXUN3iOeogQzI_tdjvSj3YhGJuPzYR4RjgK02JxhpLZwS"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-tr from-on-surface via-transparent to-transparent opacity-80"></div>

        <div className="absolute bottom-24 left-24 right-24">
          <div className="max-w-xl">
            <Quote className="mb-6 h-12 w-12 fill-current text-primary" />
            <h2 className="brand-font mb-8 text-5xl font-extrabold leading-tight tracking-[-0.06em] text-surface">
              Billiards không chỉ là trò chơi, đó là nghệ thuật của
              <span className="italic text-primary"> sự chính xác</span> tuyệt đối.
            </h2>
            <div className="flex items-center gap-4">
              <div className="h-[1px] w-12 bg-primary"></div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-surface-variant">
                Triết lý CueMasters
              </p>
            </div>
          </div>
        </div>

        <div className="absolute right-12 top-12 rounded-2xl border border-surface/10 bg-surface/10 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-3 w-3 rounded-full bg-tertiary"></div>
              <div className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-tertiary opacity-40"></div>
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-surface">
              {/* Hệ thống đang trực tuyến */}
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
