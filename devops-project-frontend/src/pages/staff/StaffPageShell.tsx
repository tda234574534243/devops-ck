import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface StaffPageShellProps {
  title?: string; // Kept for backward compatibility but unused in layout directly
  description?: string;
  children: React.ReactNode;
}

const navItems = [
  { to: '/staff', label: 'Tổng quan', icon: 'dashboard' },
  { to: '/staff/schedule', label: 'Lịch rảnh', icon: 'calendar_month' },
  { to: '/staff/sessions', label: 'Buổi dạy', icon: 'school' },
];

const StaffPageShell: React.FC<StaffPageShellProps> = ({ children }) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const handleBackToLogin = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface pb-20 md:pb-0">
      {/* Top Navigation Shell */}
      <header className="sticky top-0 z-[100] w-full bg-white shadow-sm dark:bg-[#1c1b1b]">
        <nav className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-6 py-4 md:px-8">
          <div className="flex items-center gap-8">
            <span className="font-headline text-xl font-bold tracking-tighter text-[#1c1b1b] dark:text-white md:text-2xl">
              CueMasters Precision
            </span>
            <div className="hidden items-center gap-6 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/staff'}
                  className={({ isActive }) =>
                    `font-bold transition-colors duration-200 ${
                      isActive
                        ? 'border-b-2 border-primary pb-1 text-primary'
                        : 'text-secondary hover:text-primary dark:text-[#a0a0a0]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-medium text-secondary md:block">
              {user?.fullName ?? 'Huấn luyện viên'}
            </span>
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-surface-container-high bg-surface-container-high">
              <span className="font-headline font-bold text-primary">
                {user?.fullName?.charAt(0)?.toUpperCase() ?? 'S'}
              </span>
            </div>
            <button
              onClick={handleBackToLogin}
              className="ml-2 hidden rounded-full bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-highest md:block"
            >
              Đăng xuất
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content Canvas */}
      {children}

      {/* Footer Details */}
      <footer className="border-t border-outline-variant/10 bg-surface-container-low px-8 py-12">
        <div className="mx-auto flex max-w-[1920px] flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-3">
            <span className="font-headline font-black text-[#1c1b1b] dark:text-white">
              CueMasters Precision Atelier
            </span>
            <span className="text-outline-variant opacity-30">|</span>
            <span className="text-sm text-secondary">Staff Portal v2.4.0</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-secondary">
            <a className="transition-colors hover:text-primary" href="#">
              Chính sách bảo mật
            </a>
            <a className="transition-colors hover:text-primary" href="#">
              Điều khoản dịch vụ
            </a>
            <a className="transition-colors hover:text-primary" href="#">
              Hỗ trợ kỹ thuật
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation Shell (Bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around border-t border-outline-variant/10 bg-white px-6 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden dark:bg-[#1c1b1b]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/staff'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 ${
                isActive ? 'text-primary' : 'text-secondary'
              }`
            }
          >
            {/* Make sure we map standard Lucide Icons or text if material icons aren't active, but we can use simple inline SVG or standard text since we rely on existing Lucide-react */}
            <span className="text-[10px] font-bold uppercase">{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={handleBackToLogin}
          className="flex flex-col items-center gap-1 text-secondary"
        >
          <span className="text-[10px] font-bold uppercase">Thoát</span>
        </button>
      </nav>
    </div>
  );
};

export default StaffPageShell;
