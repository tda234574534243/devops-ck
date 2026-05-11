import React from 'react';
import { Search, HelpCircle, Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';

export const Topbar = ({ title }: { title: string }) => {
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-neutral-100 bg-white px-8">
      <h1 className="font-headline text-xl font-semibold tracking-tight text-neutral-800">
        {title}
      </h1>

      <div className="flex items-center gap-6">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Tìm kiếm nhanh..."
            className="w-64 rounded-lg border-transparent bg-neutral-100/70 py-2 pl-11 pr-4 text-[13px] transition-all focus:border-neutral-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>

        <div className="flex items-center gap-4 text-neutral-500">
          <button
            aria-label="Trợ giúp"
            title="Trợ giúp"
            type="button"
            className="transition-colors hover:text-primary"
          >
            <HelpCircle size={20} />
          </button>
          <button
            aria-label="Thông báo"
            title="Thông báo"
            type="button"
            className="relative transition-colors hover:text-primary"
          >
            <Bell size={20} />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary"></span>
          </button>
          <button
            title="Đăng xuất"
            aria-label="Đăng xuất"
            onClick={() => logout()}
            className="ml-2 transition-colors hover:text-red-500"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
