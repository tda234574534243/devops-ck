import React from 'react';
import {
  LayoutDashboard,
  MonitorPlay,
  Users,
  Coffee,
  CreditCard,
  PieChart,
  SlidersHorizontal,
} from 'lucide-react';
import { ViewType } from '../types';

export const Sidebar = ({
  activeView,
  setActiveView,
}: {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}) => {
  const navItems: { id: ViewType; icon: React.ComponentType<{ size?: number; className?: string }>; label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Bảng điều khiển' },
    { id: 'tables', icon: MonitorPlay, label: 'Quản lý bàn' },
    { id: 'coaches', icon: Users, label: 'Huấn luyện viên' },
    { id: 'menu', icon: Coffee, label: 'Thực đơn F&B' },
    { id: 'membership', icon: CreditCard, label: 'Gói thành viên' },
    { id: 'revenue', icon: PieChart, label: 'Báo cáo doanh thu' },
    { id: 'buffers', icon: SlidersHorizontal, label: 'Bàn dự phòng online' },
  ];

  return (
    <div className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-neutral-900 text-white">
      <div className="space-y-2 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-semibold">
            P
          </div>
          <span className="font-headline text-lg font-semibold tracking-wide">Precision</span>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-400">
          Bảng điều phối vận hành
        </p>
      </div>

      <nav className="mt-6 flex-1 pr-4">
        {navItems.map((item) => {
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`mb-2 flex w-full items-center gap-3 px-6 py-2.5 transition-colors ${
                isActive
                  ? 'bg-neutral-800/60 text-primary border-r-4 border-primary'
                  : 'text-neutral-400 hover:bg-neutral-800/40 hover:text-white border-r-4 border-transparent'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-primary' : ''} />
              <span className="text-[13px] font-medium tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-neutral-800 p-6">
        <div className="flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80"
            alt="Quản trị viên"
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="text-left">
            <p className="text-sm font-medium">Quản trị viên</p>
            <p className="text-xs text-neutral-400">Hệ thống vận hành</p>
          </div>
        </div>
      </div>
    </div>
  );
};
