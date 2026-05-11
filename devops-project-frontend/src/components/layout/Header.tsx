import React from 'react';
import { Screen, ScreenProps } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/authService';

interface HeaderProps extends ScreenProps {
  activeScreen: Screen;
}

const navItems: { screen: Screen; label: string; requiresAuth?: boolean }[] = [
  { screen: 'floorPlan', label: 'Trang chủ' },
  { screen: 'coaches', label: 'Huấn luyện viên' },
  { screen: 'membershipTiers', label: 'Thành viên' },
  { screen: 'bookingHistory', label: 'Lịch sử đặt chỗ', requiresAuth: true },
  { screen: 'settings', label: 'Tài khoản', requiresAuth: true },
];

export default function Header({ onNavigate, activeScreen }: HeaderProps) {
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const visibleNavItems = navItems.filter((item) => !item.requiresAuth || isAuthenticated);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore network errors; still clear client state
    }
    logout();
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/60 bg-white/78 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-4">
        <button
          onClick={() => onNavigate('floorPlan')}
          className="font-headline text-2xl font-extrabold uppercase tracking-[-0.08em] text-primary"
        >
          CueMasters
        </button>

        <div className="hidden items-center gap-8 md:flex">
          {visibleNavItems.map(({ screen, label }) => {
            const isActive = activeScreen === screen;
            return (
              <button
                key={screen}
                onClick={() => onNavigate(screen)}
                className={`font-body text-sm font-semibold tracking-[-0.01em] transition-all duration-300 ${
                  isActive
                    ? 'border-b-2 border-primary pb-1 text-primary'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <button
                title="Đăng xuất"
                onClick={handleLogout}
                className="mr-1 transition-all duration-300 hover:text-red-500"
              >
                <span className="material-symbols-outlined text-[28px]">logout</span>
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className="transition-all duration-300 hover:opacity-80 active:scale-95"
              >
                <span className="material-symbols-outlined text-[28px] text-secondary hover:text-on-surface">
                  account_circle
                </span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate('login')}
                className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold tracking-[-0.01em] text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-primary-600"
              >
                Đăng ký
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
