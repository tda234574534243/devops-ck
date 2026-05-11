import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.response?.data?.Message || fallback;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authService.sendOtp(email);
      navigate('/verify-email', { state: { email, purpose: 'reset' } });
    } catch (error: any) {
      setError(getErrorMessage(error, 'Could not send OTP. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full bg-surface font-body text-on-surface antialiased overflow-hidden">
      {/* Left Side: Visual & Identity */}
      <section className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden bg-on-surface">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            alt="Cinematic close-up of a single red billiard ball on dark black felt with dramatic moody overhead lighting and deep shadows" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJGCeDlSL6pojvE44yPVPLEsuYEMG5BbMBup6ldSQj_And2L0pKUO_JVl3ap6Of2-m6F9FO0jXEkVqAqV_ey7apTRmSouITyRSOdXYDQkf9HeTDsawb8EdqCvjivHU4G90PNnmPGW-DjMglK9hHAgiGfmBNe6C5bTW3ErVgYVTlrdS1LE5w-UgY9j0P0EqM_gEkPyFU1sCh4jGQoFDSmRNPdCPdRono0sUmSHjet-BPAGOrONizKQemLO7Zs7RRhce7RrTwevIzVAS"
          />
          <div className="absolute inset-0 bg-black/60 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        </div>
        
        {/* Brand Logo */}
        <div className="relative z-10">
          <span className="text-3xl font-black tracking-tighter text-white font-headline">CueMasters</span>
        </div>
        
        {/* Content Anchor */}
        <div className="relative z-10 max-w-lg mb-12">
          <h1 className="text-white font-headline font-extrabold text-7xl tracking-tighter leading-none mb-12">
            QUÊN MẬT KHẨU?
          </h1>
          <div className="space-y-6">
            <p className="text-zinc-300 text-xl font-light italic leading-relaxed font-headline">
              "Độ chính xác không chỉ nằm ở đường cơ, mà còn ở cách bạn làm chủ sự tập trung."
            </p>
            <div className="h-1 w-20 bg-primary"></div>
          </div>
        </div>
        
        {/* Footer Quote Attribute */}
        <div className="relative z-10">
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Atelier de Précision • Est. 2024</p>
        </div>
      </section>

      {/* Right Side: Interaction Canvas */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-surface">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-4">Khôi phục truy cập</h2>
            <p className="text-secondary font-body leading-relaxed">
              Đừng lo lắng. Hãy nhập email của bạn bên dưới và chúng tôi sẽ gửi hướng dẫn để bạn có thể quay lại cuộc chơi ngay lập tức.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-10">
            {error && <div className="text-sm font-semibold text-red-500">{error}</div>}
            <div className="group relative">
              <label 
                className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2 group-focus-within:text-primary transition-colors" 
                htmlFor="email"
              >
                Địa chỉ Email
              </label>
              <div className="relative">
                <input 
                  className="w-full border-0 border-b-2 border-transparent border-b-outline-variant/50 focus:ring-0 focus:border-primary transition-all py-4 px-0 bg-transparent placeholder:text-zinc-400 text-lg outline-none" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ten@vidu.com" 
                  type="email"
                  required
                />
                <Mail className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              </div>
            </div>
            
            <div className="pt-4 flex flex-col gap-6">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold py-5 rounded-sm hover:-translate-y-0.5 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Gửi hướng dẫn
                <ArrowRight size={20} />
              </button>
              
              <Link to="/login" className="flex items-center justify-center gap-2 text-secondary hover:text-on-surface transition-colors font-bold text-sm tracking-wide group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
          
          <div className="mt-24 pt-12 border-t border-outline-variant/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
                <HelpCircle className="text-primary" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface mb-1">Cần hỗ trợ thêm?</p>
                <p className="text-xs text-secondary leading-normal">Nếu bạn không nhận được email, hãy kiểm tra hòm thư rác hoặc liên hệ với đội ngũ kỹ thuật của chúng tôi.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ForgotPassword;
