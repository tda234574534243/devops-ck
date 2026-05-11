import React, { useEffect, useMemo, useState } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import CustomerLayout from '../components/layout/CustomerLayout';
import { useAuthStore } from '../stores/authStore';
import { useCoachStore } from '../stores/coachStore';
import { ScreenProps } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { getCoachSpecialtyLabel } from '../utils/labels';

type CoachSpecialtyFilter = 'All' | 'Pool' | 'Snooker' | 'Carom' | 'AllRound';

const specialtyFilters: Array<{ label: string; value: CoachSpecialtyFilter }> = [
  { label: 'Tất cả bộ môn', value: 'All' },
  { label: 'Bida lỗ', value: 'Pool' },
  { label: 'Snooker', value: 'Snooker' },
  { label: 'Carom', value: 'Carom' },
  { label: 'Toàn diện', value: 'AllRound' },
];

export default function Coaches({ onNavigate }: ScreenProps) {
  const {
    coaches,
    fetchCoaches,
    selectedCoach,
    setSelectedCoach,
    availability,
    fetchAvailability,
    selectedSlot,
    setSelectedSlot,
    bookCoach,
    isBooking,
  } = useCoachStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSpecialty, setSelectedSpecialty] =
    useState<CoachSpecialtyFilter>('All');
  const [bookingFeedback, setBookingFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const filteredCoaches = useMemo(() => {
    if (selectedSpecialty === 'All') {
      return coaches;
    }

    return coaches.filter(
      (coach) => coach.specialty?.toLowerCase() === selectedSpecialty.toLowerCase(),
    );
  }, [coaches, selectedSpecialty]);

  useEffect(() => {
    void fetchCoaches();
  }, [fetchCoaches]);

  useEffect(() => {
    if (selectedCoach && selectedDate) {
      void fetchAvailability(selectedCoach.id, format(selectedDate, 'yyyy-MM-dd'));
      setBookingFeedback(null);
    }
  }, [fetchAvailability, selectedCoach, selectedDate]);

  const handleConfirmBooking = async () => {
    if (!selectedCoach || !selectedSlot) return;

    if (!isAuthenticated) {
      setBookingFeedback({
        type: 'error',
        message: 'Bạn cần đăng nhập trước khi đặt lịch huấn luyện.',
      });
      onNavigate?.('login');
      return;
    }

    const result = await bookCoach({
      sessionDate: format(selectedDate, 'yyyy-MM-dd'),
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
    });

    setBookingFeedback({
      type: result.success ? 'success' : 'error',
      message: result.message,
    });
  };

  return (
    <CustomerLayout onNavigate={onNavigate} activeScreen="coaches">
      <div className="pb-24">
        <section className="mx-auto mb-24 max-w-[1440px] px-8">
          <div className="flex flex-col items-end gap-12 md:flex-row">
            <div className="flex-1 space-y-6">
              <span className="block font-label text-xs font-bold uppercase tracking-[0.24em] text-primary">
                Huấn luyện cá nhân hóa
              </span>
              <h1 className="font-headline text-6xl font-black leading-none tracking-tight text-on-surface md:text-7xl">
                Huấn luyện
                <br />
                <span className="text-primary">chuẩn xác.</span>
              </h1>
              <p className="max-w-xl text-lg leading-8 text-secondary">
                Từ kỹ thuật nền tảng đến chiến thuật thi đấu, đội ngũ huấn luyện viên của
                CueMasters thiết kế lộ trình rõ ràng để bạn tiến bộ đều và cảm nhận ngay trên
                từng cú đánh.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-8">
          <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                Chọn chuyên môn
              </p>
              <h2 className="font-headline text-4xl font-bold tracking-tight">
                Đội ngũ huấn luyện
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {specialtyFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedSpecialty(filter.value)}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                    selectedSpecialty === filter.value
                      ? 'bg-on-surface text-surface'
                      : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {filteredCoaches.map((coach) => (
              <div
                key={coach.id}
                className="group flex flex-col overflow-hidden rounded-[28px] bg-surface-container-low shadow-[0_12px_30px_-24px_rgba(0,0,0,0.2)]"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-stone-300">
                  <img
                    alt={coach.fullName}
                    className="h-full w-full object-cover grayscale transition-transform duration-700 group-hover:scale-110 group-hover:grayscale-0"
                    src={
                      coach.avatarUrl ||
                      'https://images.unsplash.com/photo-1542382103-ba9c0490b4d9?auto=format&fit=crop&q=80&w=400'
                    }
                  />
                  <div className="absolute left-6 top-6 flex flex-col gap-2">
                    <span className="rounded-full bg-white/92 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface shadow-sm backdrop-blur">
                      {getCoachSpecialtyLabel(coach.specialty)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-grow flex-col bg-surface-container-lowest p-8">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="mb-2 font-headline text-2xl font-black tracking-tight">
                        {coach.fullName}
                      </h3>
                      <div className="flex items-center gap-2 text-primary">
                        <span className="material-symbols-outlined text-sm [font-variation-settings:'FILL'_1]">
                          star
                        </span>
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface">
                          {typeof coach.rating === 'number'
                            ? coach.rating.toFixed(1)
                            : 'Chưa có'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                        Giá mỗi giờ
                      </span>
                      <span className="font-headline text-xl font-black text-primary">
                        {formatCurrency(coach.hourlyRate)}
                      </span>
                    </div>
                  </div>

                  <p className="mb-8 text-sm leading-7 text-secondary">
                    {coach.bio || 'Huấn luyện viên đang cập nhật phần giới thiệu chuyên môn.'}
                  </p>

                  <button
                    onClick={() => setSelectedCoach(coach)}
                    className={`mt-auto w-full rounded-full py-4 font-label text-[11px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${
                      selectedCoach?.id === coach.id
                        ? 'bg-primary text-white'
                        : 'bg-on-background text-white hover:bg-primary'
                    }`}
                  >
                    {selectedCoach?.id === coach.id ? 'Đang xem lịch' : 'Xem lịch trống'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {selectedCoach && (
          <section className="mx-auto mt-32 max-w-[1440px] px-8">
            <div className="relative flex flex-col items-center gap-16 overflow-hidden rounded-[32px] bg-[#1C1C1C] p-12 text-white shadow-2xl md:flex-row md:p-20">
              <div className="relative z-10 flex-1">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                  Chọn buổi học
                </p>
                <h2 className="mb-6 font-headline text-5xl font-black tracking-tight">
                  Lịch học
                  <span className="text-primary"> trực tuyến.</span>
                </h2>
                <p className="mb-12 max-w-sm text-sm leading-7 text-stone-400">
                  Chọn một khung giờ để giữ chỗ với huấn luyện viên. Các buổi học 1 kèm 1 hoặc
                  nhóm nhỏ sẽ được xác nhận theo lịch trống hiển thị dưới đây.
                </p>

                <div className="mb-8 grid max-w-sm grid-cols-7 gap-x-2 gap-y-4">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                    <div
                      key={day}
                      className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-stone-600"
                    >
                      {day}
                    </div>
                  ))}

                  {Array.from({ length: 7 }).map((_, index) => {
                    const date = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), index);
                    const isSelected =
                      format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className={`flex aspect-square items-center justify-center text-sm font-semibold transition-all duration-300 ${
                          isSelected
                            ? 'bg-primary font-bold text-white shadow-[0_4px_14px_rgba(224,36,36,0.3)]'
                            : 'text-stone-300 hover:text-primary'
                        }`}
                      >
                        {format(date, 'd')}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative z-10 w-full rounded-[24px] border border-white/5 bg-[#222222] p-8 shadow-xl md:w-[420px]">
                <div className="mb-6 flex items-center gap-4 border-b border-white/5 pb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-primary shadow-[0_4px_14px_rgba(224,36,36,0.2)]">
                    <span className="material-symbols-outlined text-xl text-white">flag</span>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
                      Huấn luyện viên đã chọn
                    </p>
                    <p className="font-headline text-base font-bold tracking-wide text-white">
                      {selectedCoach.fullName}
                    </p>
                  </div>
                </div>

                <div className="mb-6 max-h-[240px] space-y-1 overflow-y-auto pr-2">
                  {availability.length === 0 ? (
                    <p className="py-4 text-center text-sm text-stone-500">
                      Không có khung giờ trống trong ngày này.
                    </p>
                  ) : (
                    availability.map((slot, index) => {
                      let isAvailableLocally = slot.isAvailable;
                      let isPast = false;

                      const isToday =
                        format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      if (isToday) {
                        const [slotHour, slotMinute] = slot.startTime.split(':').map(Number);
                        const now = new Date();

                        if (
                          slotHour < now.getHours() ||
                          (slotHour === now.getHours() && slotMinute <= now.getMinutes())
                        ) {
                          isAvailableLocally = false;
                          isPast = true;
                        }
                      }

                      const isSelected =
                        selectedSlot?.startTime === slot.startTime &&
                        selectedSlot?.endTime === slot.endTime;

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => isAvailableLocally && setSelectedSlot(slot)}
                          className={`flex w-full items-center justify-between border-b border-white/5 px-3 py-4 text-left transition-colors last:border-0 ${
                            isAvailableLocally ? 'group cursor-pointer' : 'opacity-40'
                          } ${isSelected ? 'border-primary/40 bg-primary/20' : ''}`}
                        >
                          <span
                            className={`text-sm font-medium transition-colors ${
                              isAvailableLocally
                                ? 'text-stone-300 group-hover:text-white'
                                : 'text-stone-500'
                            } ${isSelected ? 'text-white' : ''}`}
                          >
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                              isAvailableLocally ? 'text-primary' : 'text-stone-500'
                            }`}
                          >
                            {isSelected
                              ? 'Đã chọn'
                              : isAvailableLocally
                                ? 'Sẵn sàng'
                                : isPast
                                  ? 'Đã qua'
                                  : 'Kín lịch'}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="mb-4 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-xs leading-6 text-sky-100">
                  Bàn phù hợp sẽ được nhân viên sắp xếp khi bạn đến làm thủ tục nhận bàn. Bạn không cần chọn
                  bàn trước trong bước đặt HLV.
                </div>

                {bookingFeedback && (
                  <div
                    className={`mb-4 rounded-2xl px-4 py-3 text-xs leading-6 ${
                      bookingFeedback.type === 'success'
                        ? 'border border-green-700/40 bg-green-900/40 text-green-300'
                        : 'border border-red-700/40 bg-red-900/40 text-red-300'
                    }`}
                  >
                    {bookingFeedback.message}
                  </div>
                )}

                <button
                  onClick={handleConfirmBooking}
                  disabled={!selectedSlot || isBooking}
                  className="w-full rounded-full bg-primary py-4 font-label text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_4px_14px_rgba(224,36,36,0.2)] transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isBooking ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </CustomerLayout>
  );
}
