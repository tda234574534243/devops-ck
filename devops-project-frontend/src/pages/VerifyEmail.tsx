import React, { useState, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getDefaultRouteForRole } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';

type VerifyEmailPurpose = 'activate' | 'reset';

interface VerifyEmailLocationState {
  email?: string;
  purpose?: VerifyEmailPurpose;
}

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.response?.data?.Message || fallback;

const VerifyEmail = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const locationState = (location.state || {}) as VerifyEmailLocationState;
  const email = locationState.email || '';
  const purpose = locationState.purpose || 'activate';

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = code.join('');

    if (!email) {
      setError('Missing email. Please start again.');
      return;
    }

    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    setError('');
    setFeedback('');

    if (purpose === 'reset') {
      navigate('/reset-password', { state: { email, otp } });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.verifyOtp(email, otp);
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
    } catch (error: any) {
      setError(getErrorMessage(error, 'OTP verification failed.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Missing email. Please start again.');
      return;
    }

    setError('');
    setFeedback('');
    setIsResending(true);

    try {
      await authService.sendOtp(email);
      setFeedback('OTP sent. Please check your email.');
    } catch (error: any) {
      setError(getErrorMessage(error, 'Could not resend OTP.'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-surface text-on-surface">
      {/* Left Side: Visual Anchor */}
      <section className="hidden md:flex md:w-1/2 relative bg-inverse-surface items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            alt="Dark cinematic billiard table" 
            className="w-full h-full object-cover opacity-40 grayscale" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6npFxJdP9kMb5nEkg9-RPnWEnPaI10gHeYn5vJAqt7lPlXlG9kBcrG2BYKXqykaCHds_u3XMOnxaLzklIxANuUOoki4c0wQSthdOryD_HeO--vgHsrEfdn04K5DmAZ2glIbsfO8mDowv9sxcJ_JsW8rzyun0udaG2HENW5mwogEau1_zpriaRSpmidHg8eDEuscSdIYkhfulk1AtzIqr-dVmxpsgs8sakmDFMX1La30nEOlkqmPnhS4PW4z7caMJJmCzqK39ttuii"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-lg">
          <div className="mb-6">
            <span className="text-primary font-headline font-black tracking-tighter text-4xl">CueMasters</span>
          </div>
          <h1 className="text-white text-5xl font-extrabold tracking-tight leading-tight mb-8 font-headline">
            CHÚNG TÔI ĐÃ GỬI MÃ XÁC THỰC
          </h1>
          <div className="h-1 w-24 bg-gradient-to-br from-primary to-primary-container rounded-full"></div>
          <p className="text-zinc-400 mt-8 text-lg font-body leading-relaxed">
            Hành trình trở thành cơ thủ chuyên nghiệp của bạn chỉ còn cách một bước chân. Kiểm tra hộp thư đến của bạn để lấy mã xác minh 6 chữ số.
          </p>
        </div>
      </section>

      {/* Right Side: Interaction Canvas */}
      <section className="flex-1 flex items-center justify-center p-8 md:p-24 bg-surface">
        <div className="w-full max-w-md space-y-12">
          <div className="md:hidden mb-8">
            <span className="text-primary font-headline font-black tracking-tighter text-2xl">CueMasters</span>
          </div>
          
          <header className="space-y-4">
            <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">Xác thực Email</h2>
            <p className="text-secondary font-body text-sm leading-relaxed">
              Vui lòng nhập mã bảo mật đã được gửi tới địa chỉ email đăng ký của bạn để tiếp tục.
            </p>
            {email && <p className="text-primary font-body text-sm font-semibold">{email}</p>}
          </header>

          <form onSubmit={handleSubmit} className="space-y-10">
            {error && <div className="text-sm font-semibold text-red-500">{error}</div>}
            {feedback && <div className="text-sm font-semibold text-emerald-600">{feedback}</div>}
            {/* 6-Digit Code Input Group */}
            <div className="flex justify-between gap-2 md:gap-4">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  value={digit}
                  onChange={(e) => handleInputChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  maxLength={1}
                  required
                  type="text"
                  aria-label={`Mã OTP số ${idx + 1}`}
                  title={`Mã OTP số ${idx + 1}`}
                  inputMode="numeric"
                  className="w-12 h-16 md:w-16 md:h-20 text-center text-2xl font-headline font-bold border-0 border-b-2 border-transparent border-b-surface-container-highest bg-surface-container-low focus:ring-0 focus:border-b-primary focus:bg-surface-container-lowest transition-all duration-300 outline-none"
                />
              ))}
            </div>

            <div className="space-y-6">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold rounded-full shadow-lg hover:opacity-90 active:scale-[0.98] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Xác thực tài khoản
              </button>
              
              <div className="flex flex-col items-center gap-4 pt-4">
                <p className="text-sm text-secondary font-body">Bạn không nhận được mã?</p>
                <button 
                  type="button" 
                  onClick={() => void handleResend()}
                  disabled={isResending}
                  className="text-primary font-headline font-bold text-sm tracking-wide uppercase hover:underline decoration-2 underline-offset-8 transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Gửi lại mã
                </button>
              </div>
            </div>
          </form>

          <footer className="pt-12">
            <Link to={purpose === 'reset' ? '/forgot-password' : '/register'} className="flex w-fit items-center gap-2 text-zinc-400 group cursor-pointer hover:text-on-surface transition-colors">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest font-body">Quay lại trang đăng ký</span>
            </Link>
          </footer>
        </div>
      </section>

      {/* Global Footer from JSON - Styled for split screen utility */}
      <footer className="fixed bottom-0 left-0 w-full md:w-1/2 p-8 z-20 pointer-events-none hidden md:block">
        <div className="flex justify-between items-center opacity-40">
          <span className="text-[10px] text-zinc-500 font-body uppercase tracking-[0.2em] font-bold">© 2024 CueMasters Precision Atelier</span>
          <div className="flex gap-4">
            <span className="text-[10px] text-zinc-500 font-body uppercase tracking-widest font-bold">VN</span>
            <span className="text-[10px] text-zinc-500 font-body uppercase tracking-widest font-bold">EN</span>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default VerifyEmail;
