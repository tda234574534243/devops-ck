import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Check, XCircle, Filter, Plus, History, CheckCircle2, CalendarIcon, Headset, Loader2, AlertCircle } from 'lucide-react';
import StaffPageShell from './StaffPageShell';
import { staffService } from '../../services/staffService';

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

const ClockIcon = ({ size }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

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

const SessionManagement = () => {
  const [sessions, setSessions] = useState<StaffSessionItem[]>([]);
  const [selectedSession, setSelectedSession] = useState<StaffSessionItem | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const response = await staffService.getSessions();
      setSessions(Array.isArray(response) ? response : []);
    } catch (error) {
      setSessions([]);
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Không thể tải danh sách buổi dạy lúc này.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  const pendingSessions = useMemo(
    () => sessions.filter((session) => !session.isCompleted),
    [sessions],
  );

  const completionRate = useMemo(() => {
    if (sessions.length === 0) return 100;
    const completed = sessions.filter(s => s.isCompleted).length;
    return Math.round((completed / sessions.length) * 100);
  }, [sessions]);

  const handleComplete = async () => {
    if (!selectedSession) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await staffService.completeSession(selectedSession.id, notes.trim() || undefined);
      setSelectedSession(null);
      setNotes('');
      setFeedback({ type: 'success', message: 'Đã đánh dấu buổi dạy là hoàn tất.' });
      await loadSessions();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Không thể cập nhật trạng thái buổi dạy.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StaffPageShell>
      {/* Page Header Section */}
      <section className="relative overflow-hidden bg-[#1c1b1b] px-8 pb-24 pt-20 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1c1b1b] via-transparent to-primary"></div>
          <img
            alt="Billiards background"
            className="h-full w-full object-cover grayscale"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXtut9N9gIhJeoQHj3O0Ch802iY1i5o5oTDj7wZOTpXPtISSdMAM_fbcH2j-YnblohVV1zgWAsCDZM-5zmmbj62IT5IbffiCzczcxjl3X893Len3qm1XKDEvHEjSPyAhXJ8zcdjHSg74Y29byDMDuDrnGsIYe36Lelj37WwcYh9KAOuifHbtm7lKKtmLaiGLGgBrQK8EoKS_YSq6Rwqz4hWp_qwjVzl8h789eO8tkYy7qomC39jL2UNjx7xcbijeEA5IOHzcGmNicx"
          />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl">
          <span className="mb-4 inline-block rounded-sm bg-primary px-3 py-1 font-body text-[10px] font-bold uppercase tracking-[0.2em]">
            Khu vực nhân viên
          </span>
          <h1 className="mb-4 font-headline text-5xl font-extrabold tracking-tighter text-white md:text-6xl">
            Quản lý buổi dạy
          </h1>
          <p className="max-w-2xl font-body text-lg font-light leading-relaxed text-secondary-fixed-dim">
            Theo dõi các buổi học đang diễn ra, xem lịch sử huấn luyện và cập nhật trạng thái các buổi dạy của bạn trong thời gian thực.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="relative z-20 mx-auto -mt-12 max-w-6xl px-8 pb-20">
        
        {feedback && (
          <div className={`mb-6 flex items-start justify-between gap-4 rounded-xl border px-6 py-4 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-50 text-emerald-700'
              : 'border-rose-500/20 bg-rose-50 text-rose-700'
          }`}>
            <div className="flex items-start gap-2">
              {feedback.type === 'success' ? (
                <Check size={18} className="mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
              )}
              <span className="font-medium text-base">{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="shrink-0 font-bold hover:underline"
            >
              Ẩn
            </button>
          </div>
        )}

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 gap-8">
          {/* Table Card */}
          <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-xl shadow-[#1c1b1b]/5 dark:shadow-none">
            <div className="flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
                  Các buổi học đang chờ hoàn tất
                </h2>
                <p className="mt-1 font-body text-sm text-secondary">
                  Danh sách các buổi học cần xác nhận hoặc cập nhật kết quả. Còn {pendingSessions.length} buổi.
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => void loadSessions()}
                  className="flex items-center gap-2 rounded-full bg-surface-container-high px-4 py-2 font-body text-sm font-semibold text-on-surface transition-all hover:bg-surface-container-highest"
                >
                  <Filter size={16} />
                  Làm mới
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/10 bg-surface-container-low font-body text-[10px] font-bold uppercase tracking-widest text-secondary">
                    <th className="px-8 py-4">Ngày giờ</th>
                    <th className="px-8 py-4">Học viên</th>
                    <th className="px-8 py-4">Hình thức</th>
                    <th className="px-8 py-4">Trạng thái</th>
                    <th className="px-8 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="mb-4 h-10 w-10 animate-spin text-secondary opacity-40" />
                          <p className="font-body text-lg font-medium text-on-surface">Đang tải danh sách...</p>
                        </div>
                      </td>
                    </tr>
                  ) : sessions.length > 0 ? (
                    sessions.map((session) => (
                      <tr key={session.id} className="transition-colors hover:bg-surface-container-low/50">
                        <td className="px-8 py-4 font-body font-bold text-on-surface">
                          <div className="flex flex-col">
                            <span>{session.sessionDate}</span>
                            <span className="font-normal text-secondary">
                              {session.startTime} - {session.endTime}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-4 font-body font-medium text-on-surface">{session.studentName}</td>
                        <td className="px-8 py-4">
                          <span
                            className={`inline-flex items-center rounded bg-surface-container-highest px-2 py-1 font-body text-[10px] font-bold uppercase tracking-widest text-on-surface`}
                          >
                            {session.isGroupSession
                              ? `Nhóm${session.maxParticipants ? ` (tối đa ${session.maxParticipants})` : ''}`
                              : '1 kèm 1'}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          {session.isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 font-body font-bold text-tertiary">
                              <Check size={16} strokeWidth={3} /> Hoàn tất
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-body font-bold text-primary">
                              <ClockIcon size={16} /> Chờ xử lý
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-4 text-right">
                          {!session.isCompleted && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSession(session);
                                setNotes('');
                                setFeedback(null);
                              }}
                              className="inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant/30 px-6 py-2 font-body text-sm font-bold text-on-surface shadow-sm transition-all hover:border-primary hover:text-primary"
                            >
                              Hoàn tất
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center justify-center opacity-40">
                          <History className="mb-4 h-12 w-12 text-secondary" />
                          <p className="font-body text-lg font-medium text-on-surface">
                            Chưa có buổi học nào trong danh sách.
                          </p>
                          <p className="mt-2 text-sm text-secondary">
                            Mọi buổi học mới sẽ xuất hiện tại đây sau khi được lên lịch.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Tonal Transition */}
            <div className="flex items-center justify-between bg-surface-container-low p-6 font-body text-xs font-medium uppercase tracking-tighter text-secondary">
              <span>Tổng số: {sessions.length} buổi dạy</span>
              <div className="flex items-center gap-4">
                <button className="transition-colors hover:text-primary disabled:opacity-30" disabled>Trước</button>
                <span className="text-on-surface">Trang 1 / 1</span>
                <button className="transition-colors hover:text-primary disabled:opacity-30" disabled>Sau</button>
              </div>
            </div>
          </div>

          {/* Supporting Info Bento Section */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Status Stats */}
            <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-8">
              <div className="mb-8 flex items-center justify-between">
                <span className="font-body text-xs font-bold uppercase tracking-widest text-secondary">Tỉ lệ hoàn thành</span>
                <CheckCircle2 className="text-tertiary" size={24} />
              </div>
              <div>
                <div className="mb-2 font-headline text-4xl font-black text-on-surface">{isLoading ? '--' : `${completionRate}%`}</div>
                <p className="font-body text-sm text-secondary">
                  {completionRate === 100 ? 'Tuyệt vời! Bạn không có buổi dạy nào quá hạn.' : 'Tiếp tục duy trì tiến độ hoàn tất sau mỗi buổi dạy.'}
                </p>
              </div>
            </div>

            {/* Next session Placeholder */}
            <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-8">
              <div className="mb-8 flex items-center justify-between">
                <span className="font-body text-xs font-bold uppercase tracking-widest text-secondary">Hôm nay</span>
                <CalendarIcon className="text-primary" size={24} />
              </div>
              <div>
                <div className="mb-1 font-headline text-lg font-bold text-on-surface">Còn {pendingSessions.length} buổi</div>
                <p className="font-body text-sm text-secondary">Hãy kiểm tra và đánh dấu hoàn tất các buổi còn sót.</p>
              </div>
            </div>

            {/* Quick Action Card */}
            <div className="flex flex-col justify-between rounded-xl bg-primary p-8 text-on-primary">
              <div className="mb-8 flex items-center justify-between">
                <span className="font-body text-xs font-bold uppercase tracking-widest opacity-80">Hỗ trợ kỹ thuật</span>
                <Headset size={24} />
              </div>
              <div>
                <div className="mb-4 font-headline text-lg font-bold">Gặp sự cố với bảng điểm?</div>
                <button className="w-full rounded-full bg-white/20 py-3 font-body text-sm font-bold shadow-lg shadow-black/5 backdrop-blur-md transition-all hover:bg-white/30">
                  Liên hệ Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {selectedSession && (
        <div className="fixed inset-0 z-[200] flex animate-in fade-in duration-200 items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1c1b1b]/60 backdrop-blur-sm" onClick={() => setSelectedSession(null)}></div>
          <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden rounded-3xl bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/10 p-8">
              <h3 className="font-headline text-2xl font-bold text-on-surface">
                Hoàn tất buổi dạy
              </h3>
              <button
                aria-label="Đóng cửa sổ"
                onClick={() => setSelectedSession(null)}
                className="text-secondary transition-colors hover:text-primary"
              >
                <XCircle size={28} />
              </button>
            </div>
            
            <div className="space-y-6 p-8">
              <div className="space-y-2 rounded-xl border border-outline-variant/15 bg-surface-container-low p-5 font-body">
                <p>
                  <span className="font-bold text-secondary">Học viên:</span>{' '}
                  <span className="font-bold text-on-surface">{selectedSession.studentName}</span>
                </p>
                <p>
                  <span className="font-bold text-secondary">Thời gian:</span>{' '}
                  <span className="font-medium text-on-surface">
                    {selectedSession.sessionDate} • {selectedSession.startTime} - {selectedSession.endTime}
                  </span>
                </p>
              </div>
              
              <div>
                <label className="mb-3 flex items-center gap-2 font-body text-sm font-bold text-on-surface uppercase tracking-widest">
                  <MessageSquare size={16} className="text-secondary" /> Ghi chú huấn luyện
                </label>
                <textarea
                  className="w-full resize-none rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 font-body outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  rows={4}
                  placeholder="Thêm ghi chú về tiến độ của học viên, bài tập đã thực hiện hoặc lưu ý..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 border-t border-outline-variant/10 bg-surface-container-low p-8">
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                disabled={isSubmitting}
                className="rounded-full px-6 py-3 font-body font-bold text-secondary transition-colors hover:bg-surface-container-highest disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
                className="rounded-full bg-primary px-8 py-3 font-body font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:bg-primary-container disabled:opacity-50"
              >
                {isSubmitting ? 'Đang lưu...' : 'Xác nhận hoàn tất'}
              </button>
            </div>
          </div>
        </div>
      )}
    </StaffPageShell>
  );
};

export default SessionManagement;
