/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { ViewType } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './views/DashboardView';
import { RevenueView } from './views/RevenueView';
import { MenuView } from './views/MenuView';
import { CoachesView } from './views/CoachesView';
import { TablesView } from './views/TablesView';
import { MembershipView } from './views/MembershipView';
import { BufferConfigView } from './views/BufferConfigView';

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'revenue':
        return <RevenueView />;
      case 'menu':
        return <MenuView />;
      case 'coaches':
        return <CoachesView />;
      case 'tables':
        return <TablesView />;
      case 'membership':
        return <MembershipView />;
      case 'buffers':
        return <BufferConfigView />;
      default:
        return (
          <div className="flex h-[80vh] items-center justify-center p-8">
            <div className="text-center">
              <AlertCircle size={48} className="mx-auto mb-4 text-neutral-300" />
              <h2 className="font-headline text-lg font-semibold text-neutral-800">
                Tính năng đang được phát triển
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Vui lòng chọn mục khác trong menu bên trái.
              </p>
            </div>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Bảng điều khiển';
      case 'revenue':
        return 'Phân tích doanh thu';
      case 'menu':
        return 'Thực đơn F&B';
      case 'coaches':
        return 'Quản lý huấn luyện viên';
      case 'tables':
        return 'Sơ đồ vận hành thời gian thực';
      case 'membership':
        return 'Gói thành viên';
      case 'buffers':
        return 'Thiết lập bàn dự phòng cho đặt online';
      default:
        return 'The Precision Atelier';
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        <Topbar title={getTitle()} />
        <main className="flex-1 overflow-auto">{renderView()}</main>
      </div>
    </div>
  );
}
