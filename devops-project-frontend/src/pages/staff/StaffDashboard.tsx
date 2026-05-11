import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Calendar, Users, CheckCircle, ArrowRight, CalendarPlus, Settings, LogOut, Loader2, AlertCircle } from 'lucide-react';
import StaffPageShell from './StaffPageShell';
import { staffService } from '../../services/staffService';

interface StaffScheduleItem {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
}

interface StaffSessionItem {
  id: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  studentName: string;
  isGroupSession: boolean;
  maxParticipants?: number | null;
  isCompleted: boolean;
}

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (typeof (error as any).response?.data?.message === 'string' ||
      typeof (error as any).response?.data?.Message === 'string')
  ) {
    return (
      (error as any).response?.data?.message ||
      (error as any).response?.data?.Message ||
      fallbackMessage
    );
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

const getTodayString = () => new Date().toISOString().split('T')[0];

const StaffDashboard = () => {
  const [schedule, setSchedule] = useState<StaffScheduleItem[]>([]);
  const [sessions, setSessions] = useState<StaffSessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useAuthStore((state) => state.logout);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [scheduleResponse, sessionsResponse] = await Promise.all([
        staffService.getSchedule(getTodayString()),
        staffService.getSessions(),
      ]);

      setSchedule(Array.isArray(scheduleResponse) ? scheduleResponse : []);
      setSessions(Array.isArray(sessionsResponse) ? sessionsResponse : []);
    } catch (error) {
      setSchedule([]);
      setSessions([]);
      setError(getErrorMessage(error, 'Không thể tải tổng quan lịch dạy lúc này.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const todaySessions = useMemo(
    () => sessions.filter((session) => session.sessionDate === getTodayString()),
    [sessions]
  );
  const completedToday = todaySessions.filter((session) => session.isCompleted).length;
  const upcomingToday = todaySessions.filter((session) => !session.isCompleted);
  const openScheduleSlots = schedule.filter((slot) => !slot.isBlocked).length;

  return (
    <StaffPageShell>
      <main className="mx-auto max-w-[1920px]">
        {/* Hero Header Section */}
        <section className="relative w-full overflow-hidden bg-[#1c1b1b] px-8 py-16 md:px-12 lg:px-24">
          {/* Background Texture Overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
          
          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="mb-4 font-body text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Khu vực nhân viên
              </p>
              <h1 className="mb-4 font-headline text-4xl font-extrabold leading-tight tracking-tighter text-white md:text-6xl">
                Tổng quan công việc
              </h1>
              <p className="max-w-lg font-body text-lg text-secondary-fixed-dim">
                Theo dõi nhanh số buổi dạy trong ngày và các hoạt động sắp tới của bạn tại Atelier.
              </p>
            </div>
            {error && (
              <div className="flex max-w-sm items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                <AlertCircle className="mt-0.5 shrink-0" size={16} />
                <div className="flex flex-col gap-1.5">
                  <span>{error}</span>
                  <button onClick={() => void loadData()} className="font-semibold underline hover:text-white text-left">Tải lại</button>
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <button 
                onClick={logout}
                className="group flex items-center gap-2 rounded-lg border border-white/10 px-6 py-3 font-body font-bold text-white transition-all duration-300 hover:border-primary/50"
              >
                <span className="text-sm tracking-widest text-white">ĐĂNG XUẤT</span>
                <LogOut size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </section>

        {/* Stats Bento Grid */}
        <section className="relative z-10 -mt-8 px-8 md:px-12 lg:px-24">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="group rounded-xl border-l-4 border-primary bg-surface-container-lowest p-8 shadow-xl shadow-[#1c1b1b]/5 transition-colors hover:bg-surface-container-low">
              <div className="mb-6 flex items-start justify-between">
                <span className="font-body text-sm font-medium text-secondary">
                  Buổi dạy hôm nay
                </span>
                <Calendar className="text-primary transition-transform group-hover:scale-110" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-5xl font-black text-on-surface">
                  {isLoading ? '--' : todaySessions.length}
                </span>
                <span className="font-body text-sm text-secondary">buổi</span>
              </div>
            </div>

            <div className="group rounded-xl border-l-4 border-tertiary bg-surface-container-lowest p-8 shadow-xl shadow-[#1c1b1b]/5 transition-colors hover:bg-surface-container-low">
              <div className="mb-6 flex items-start justify-between">
                <span className="font-body text-sm font-medium text-secondary">
                  Đã hoàn tất hôm nay
                </span>
                <CheckCircle className="text-tertiary transition-transform group-hover:scale-110" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-5xl font-black text-on-surface">
                  {isLoading ? '--' : completedToday}
                </span>
                <span className="font-body text-sm text-secondary">buổi</span>
              </div>
            </div>

            <div className="group rounded-xl border-l-4 border-[#5f5e5e] bg-surface-container-lowest p-8 shadow-xl shadow-[#1c1b1b]/5 transition-colors hover:bg-surface-container-low">
              <div className="mb-6 flex items-start justify-between">
                <span className="font-body text-sm font-medium text-secondary">
                  Khung giờ còn mở
                </span>
                <Users className="text-[#5f5e5e] transition-transform group-hover:scale-110" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-5xl font-black text-on-surface">
                  {isLoading ? '--' : openScheduleSlots}
                </span>
                <span className="font-body text-sm text-secondary">giờ</span>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming Sessions Section */}
        <section className="mt-16 px-8 md:px-12 lg:px-24">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-primary"></div>
              <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
                Các buổi sắp diễn ra
              </h2>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant/30 bg-surface-container-low py-24 text-center">
              <Loader2 className="mb-6 h-10 w-10 animate-spin text-secondary" />
              <h3 className="mb-2 font-headline text-xl font-bold text-on-surface">
                Đang tải dữ liệu...
              </h3>
            </div>
          ) : upcomingToday.length > 0 ? (
            <div className="space-y-4">
              {upcomingToday.map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/10">
                  <div className="flex items-center gap-6">
                    <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border border-outline-variant/10 bg-surface">
                      <span className="font-body text-[10px] font-bold uppercase text-secondary">Giờ</span>
                      <span className="font-headline text-xl font-bold text-on-surface">{session.startTime.split(':')[0]}</span>
                    </div>
                    <div>
                      <p className="font-headline text-lg font-bold text-on-surface">{session.startTime} - {session.endTime}</p>
                      <p className="text-secondary text-sm mt-1">
                        Học viên: <span className="font-semibold text-on-surface">{session.studentName}</span>
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-surface-container-high px-3 py-1 font-body text-xs font-medium text-secondary">
                    {session.isGroupSession
                      ? `Nhóm${session.maxParticipants ? ` / tối đa ${session.maxParticipants}` : ''}`
                      : '1 kèm 1'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant/30 bg-surface-container-low py-24 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-high">
                <CalendarPlus className="text-secondary" size={32} />
              </div>
              <h3 className="mb-2 font-headline text-xl font-bold text-on-surface">
                Chưa có lịch trình
              </h3>
              <p className="mx-auto max-w-md px-6 font-body text-secondary">
                Hiện chưa có buổi dạy nào được lên lịch cho hôm nay. Hãy kiểm tra lại "Lịch rảnh" để cập nhật trạng thái của bạn.
              </p>
            </div>
          )}
        </section>

        {/* Footer / Editorial Detail */}
        <section className="mb-12 mt-24 px-8 md:px-12 lg:px-24">
          <div className="relative grid grid-cols-1 items-center gap-12 overflow-hidden rounded-3xl bg-surface-container-lowest p-8 md:p-12 lg:grid-cols-2">
            <div className="-mr-32 -mt-32 absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/5"></div>
            <div>
              <h2 className="mb-6 font-headline text-3xl font-black leading-tight text-on-surface">
                Nâng cao kỹ năng <br />
                <span className="text-primary">Đào tạo chuẩn xác</span>
              </h2>
              <p className="mb-8 font-body text-lg text-secondary">
                Hệ thống The Precision Atelier cung cấp các công cụ phân tích đường đi của bóng thời gian thực, giúp bạn hỗ trợ học viên tốt hơn trong từng cú đánh.
              </p>
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="mb-1 font-body text-xs font-bold uppercase tracking-widest text-primary">
                    Mã nhân viên
                  </span>
                  <span className="font-mono text-lg font-bold">ATELIER-HV</span>
                </div>
              </div>
            </div>
            
            <div className="relative h-64 overflow-hidden rounded-2xl md:h-80">
              <img
                alt="Billiard training"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAd8NebvYCZ0B-Xn1QzK5IFv4qlAw00oSjMaIP3bcsHdx7xIEbh1KUNEbabYKAlfQtKokLf_6xI7r_RoAnwiNpdni8zlMqdlroPyr4xUQdaRuwH2fAwe3LEoXTQeyhSXBKsAWP4KALI1YAJGnv1XgmJG1YqjvHwzhPLw7bXsvdql4yAq3wVr2Ta7cwDOj2Ce5OCJIyXUKWCYg1GlzNW8uhSYFzsfSp-qFOWU0yBh815NRcbv4jRA9SmDbwIF0Yms3obdrMzZNI6QGf5"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1b] to-transparent opacity-60"></div>
              <div className="absolute bottom-6 left-6">
                <div className="mb-2 inline-block rounded bg-tertiary/90 px-3 py-1 font-body text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                  LIVE STATUS
                </div>
                <p className="font-body font-bold text-white">Chế độ đào tạo đang bật</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </StaffPageShell>
  );
};

export default StaffDashboard;
