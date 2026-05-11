import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft, HelpCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface ResetPasswordLocationState {
  email?: string;
  otp?: string;
}

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.response?.data?.Message || fallback;

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state || {}) as ResetPasswordLocationState;
  const email = locationState.email || '';
  const otp = locationState.otp || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !otp) {
      setError('Missing reset verification. Please request a new OTP.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword(email, otp, password);
      navigate('/login', { state: { message: 'Password reset successfully. Please log in.' } });
    } catch (error: any) {
      setError(getErrorMessage(error, 'Could not reset password.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface font-body text-on-surface">
      {/* Top Navigation Anchor */}
      <header className="fixed top-0 w-full z-50 flex justify-between px-8 py-6 bg-transparent">
        <div className="text-2xl font-black text-on-surface dark:text-white tracking-tighter font-headline uppercase">
          CueMasters
        </div>
        <div className="flex gap-6 items-center">
          <HelpCircle className="text-secondary hover:opacity-80 transition-opacity cursor-pointer" size={24} />
        </div>
      </header>

      <main className="flex-grow flex min-h-screen">
        {/* Left Side: Dark Aesthetic & Brand Narrative */}
        <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-on-surface">
          <div className="absolute inset-0 z-0">
            <img 
              className="w-full h-full object-cover opacity-40" 
              alt="cinematic close-up of a professional billiard cue tip and blue chalk on a dark textured background with dramatic moody lighting" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuATv7ezDG1GkRcJYgnF1H8s_naCWnzKYlXv-sedBHd6Di2dOGS1tfUH1ymxFAZL40_1uK__spwUTdHPEmYQ7OEbLYMz7oVYrXpJUO5-Orz7hRZknAy7DQNzYUhrDz0oTX_uFYm4Dv-_3nkF36t0hXr18aPcOPxsx--U-qKhKJiBfxlHkhz9M1xL0uREhhgtf7S3vYBJHjocCC8PAIhrAwolEE0Ke8So5ahfDKU404uOxSzwbLcmH23dmmN6jfoxgOYgguG1EfFT0ud7"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-on-surface via-transparent to-transparent opacity-80"></div>
          </div>
          <div className="relative z-10 flex flex-col justify-end p-20 w-full">
            <div className="max-w-lg">
              <h1 className="text-5xl font-extrabold text-white leading-tight tracking-tighter mb-6 font-headline">
                MẬT MÃ MỚI,<br/>KHỞI ĐẦU MỚI.
              </h1>
              <p className="text-secondary-fixed text-lg font-body leading-relaxed max-w-sm">
                Hãy thiết lập một mật khẩu mạnh mẽ để bảo vệ tài khoản và thành tích của bạn.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Clean Form Canvas */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 bg-surface pt-24">
          <div className="w-full max-w-md">
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-on-surface mb-2 font-headline">Thiết lập mật khẩu mới</h2>
              <p className="text-secondary font-body text-sm">Nhập thông tin bên dưới để hoàn tất quá trình khôi phục.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && <div className="text-sm font-semibold text-red-500">{error}</div>}
              {/* Password Field */}
              <div className="group">
                <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-3 font-body">
                  Mật khẩu mới
                </label>
                <div className="relative border-b border-outline-variant/50 group-focus-within:border-primary transition-colors duration-300">
                  <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-secondary" size={20} />
                  <input 
                    className="w-full pl-8 pr-10 py-3 bg-transparent border-none focus:ring-0 outline-none text-on-surface placeholder:text-outline-variant font-body" 
                    placeholder="••••••••" 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="group">
                <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-3 font-body">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative border-b border-outline-variant/50 group-focus-within:border-primary transition-colors duration-300">
                  <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-secondary" size={20} />
                  <input 
                    className="w-full pl-8 pr-10 py-3 bg-transparent border-none focus:ring-0 outline-none text-on-surface placeholder:text-outline-variant font-body" 
                    placeholder="••••••••" 
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                  >
                     {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold py-4 rounded-lg shadow-sm hover:translate-y-[1px] active:scale-95 transition-all duration-200 uppercase tracking-wider font-headline disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cập nhật mật khẩu
                </button>
              </div>

              <div className="text-center pt-6">
                <Link to="/login" className="text-sm font-bold text-secondary hover:text-primary transition-colors flex items-center justify-center gap-2 font-body group">
                  <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer Anchor */}
      <footer className="bg-surface-container-low full-width py-12">
        <div className="max-w-7xl mx-auto px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-lg font-bold text-on-surface font-headline">
            The Precision Atelier
          </div>
          <div className="flex gap-8 text-secondary font-body text-xs tracking-wide uppercase">
            <a href="#" className="hover:text-primary transition-colors font-bold">Điều khoản</a>
            <a href="#" className="hover:text-primary transition-colors font-bold">Bảo mật</a>
            <a href="#" className="hover:text-primary transition-colors font-bold">Liên hệ</a>
          </div>
          <p className="text-secondary font-body text-xs tracking-wide uppercase">
            © 2024 The Precision Atelier. Bảo lưu mọi quyền.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ResetPassword;
