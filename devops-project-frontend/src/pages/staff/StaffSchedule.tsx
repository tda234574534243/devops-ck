import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Clock, Plus, Trash2, CheckCircle2, UserX, Loader2, AlertCircle, RefreshCw, Info, CalendarIcon, Zap } from 'lucide-react';
import StaffPageShell from './StaffPageShell';
import { staffService } from '../../services/staffService';

interface StaffScheduleItem {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
  specificDate?: string | null;
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

const getWeekDays = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);
    days.push({
      date: nextDate,
      dateString: nextDate.toLocaleDateString('en-CA'),
      dayName: i === 0 ? 'Hôm nay' : `Thứ ${nextDate.getDay() === 0 ? 'CN' : nextDate.getDay() + 1}`,
      dayIndex: i,
      originalDayOfWeek: nextDate.getDay(),
    });
  }
  return days;
};

const DEFAULT_FORM = {
  startTime: '09:00',
  endTime: '10:00',
  isBlocked: false,
};

const QUICK_PRESETS = [
  { label: 'Sáng', start: '08:00', end: '12:00' },
  { label: 'Chiều', start: '13:00', end: '17:00' },
  { label: 'Tối', start: '18:00', end: '22:00' }
];

const StaffSchedule = () => {
  const [schedule, setSchedule] = useState<StaffScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const weekDays = useMemo(() => getWeekDays(), []);
  
  const [selectedDayIndices, setSelectedDayIndices] = useState<number[]>([0]);
  const [formState, setFormState] = useState({ ...DEFAULT_FORM, specificDate: '' });

  const formRef = useRef<HTMLDivElement>(null);

  const loadSchedule = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await staffService.getAvailability();
      setSchedule(Array.isArray(response) ? response : []);
    } catch (error) {
      setSchedule([]);
      setError(getErrorMessage(error, 'Không thể tải lịch rảnh lúc này.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSchedule();
  }, []);

  const toggleDay = (index: number) => {
    setSelectedDayIndices(prev => {
      if (prev.includes(index) && prev.length > 1) {
        return prev.filter(i => i !== index);
      } else if (!prev.includes(index)) {
        return [...prev, index];
      }
      return prev;
    });
  };

  const handleCreateSlot = async () => {
    if (selectedDayIndices.length === 0) {
      setError('Vui lòng chọn ít nhất một ngày làm việc.');
      return;
    }

    if (!formState.startTime || !formState.endTime) {
      setError('Vui lòng chọn đầy đủ thời gian bắt đầu và kết thúc.');
      return;
    }

    if (formState.startTime >= formState.endTime) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const promises = selectedDayIndices.map(index => {
        const targetDay = weekDays.find(d => d.dayIndex === index);
        if (!targetDay) return Promise.resolve();
        return staffService.createAvailability({
          dayOfWeek: targetDay.originalDayOfWeek,
          startTime: formState.startTime,
          endTime: formState.endTime,
          isBlocked: formState.isBlocked,
          specificDate: formState.specificDate || null,
        });
      });

      await Promise.all(promises);

      // Auto clear only the date specifics, keep the times for rapid creation if needed
      setFormState(prev => ({ ...prev, specificDate: '' }));
      await loadSchedule();
    } catch (error) {
      setError(getErrorMessage(error, 'Không thể tạo một hoặc nhiều khung giờ.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (item: StaffScheduleItem) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khung giờ này?')) {
      return;
    }

    setSavingKey(`delete-${item.id}`);
    setError(null);

    try {
      await staffService.deleteAvailability(item.id);
      await loadSchedule();
    } catch (error) {
      setError(getErrorMessage(error, 'Không thể xóa khung giờ đã chọn.'));
    } finally {
      setSavingKey(null);
    }
  };

  const getDaySchedule = (dayOfWeek: number) => {
    return schedule
      .filter((slot) => slot.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const scrollToFormForDay = (index: number) => {
    setSelectedDayIndices([index]);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <StaffPageShell>
      {/* Page Header Section */}
      <header className="relative bg-[#1c1b1b] px-8 pb-16 pt-16 text-white md:px-12 lg:px-24">
        <div className="pointer-events-none absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1b] to-transparent"></div>
        
        <div className="relative z-10 mx-auto max-w-6xl">
          <span className="mb-4 inline-block rounded-sm bg-primary px-3 py-1 font-body text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/20">
            Khu vực nhân viên
          </span>
          <h1 className="mb-4 font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
            Lịch rảnh của tôi
          </h1>
          <p className="max-w-xl font-body text-lg leading-relaxed text-secondary-fixed-dim">
            Cập nhật lịch làm việc theo tuần của bạn để khách hàng có thể đặt lịch học hoặc đặt bàn cùng huấn luyện viên. Hỗ trợ thiết lập lịch nhanh nhiều ngày cùng lúc.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 mx-auto -mt-8 max-w-6xl px-8 pb-20">
        
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <div className="flex flex-col gap-1.5 flex-1">
              <span className="font-medium">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-700 font-bold hover:underline"
            >
              Ẩn
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Panel: Schedule List */}
          <div className="lg:col-span-8">
            <div className="rounded-xl bg-surface-container-lowest p-8 shadow-xl shadow-[#1c1b1b]/5">
              <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-headline text-2xl font-bold text-on-surface">Quản lý lịch rảnh theo tuần</h2>
                  <p className="mt-1 font-body text-sm text-secondary">Hiển thị lịch trình trong 7 ngày tới</p>
                </div>
                <button
                  onClick={() => void loadSchedule()}
                  className="flex w-fit items-center gap-2 rounded-full border border-outline-variant/15 px-4 py-2 font-body text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
                >
                  <RefreshCw size={16} />
                  Tải Lại
                </button>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                  <Loader2 className="mb-4 h-10 w-10 animate-spin text-secondary" />
                  <p className="font-body text-lg font-medium">Đang tải lịch trình của bạn...</p>
                </div>
              ) : (
                <div className="space-y-12">
                  {weekDays.map((day) => {
                    const daySlots = getDaySchedule(day.originalDayOfWeek);
                    
                    return (
                      <div key={day.dayIndex} className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
                        <div className="mb-4 flex items-center gap-4">
                          <h3 className="font-headline text-xl font-bold text-on-surface">
                            {day.dayName}
                          </h3>
                          <span className="font-body text-sm font-medium text-secondary">
                            {day.date.toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </span>
                          <div className="h-px flex-1 bg-outline-variant/20"></div>
                          <button
                            onClick={() => scrollToFormForDay(day.dayIndex)}
                            className="flex items-center gap-1 font-body text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:text-primary-container"
                          >
                            <Plus size={14} /> Thêm ca
                          </button>
                        </div>

                        {daySlots.length === 0 ? (
                          <div className="flex items-center justify-center rounded-lg border border-dashed border-outline-variant/20 bg-surface-container-lowest py-8 opacity-60">
                            <p className="font-body text-sm text-secondary">Chưa có xếp lịch cho ngày này.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {daySlots.map((slot) => (
                              <div
                                key={slot.id}
                                className="group flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-low p-5 transition-colors hover:bg-surface-container sm:flex-row sm:items-center"
                              >
                                <div className="flex items-center gap-6">
                                  <div className="flex flex-col">
                                    <p className="font-headline text-lg font-bold text-on-surface">
                                      {slot.startTime} - {slot.endTime}
                                    </p>
                                    <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`h-2 w-2 rounded-full shadow-[0_0_8px_currentColor] ${
                                            slot.isBlocked ? 'text-primary bg-primary' : 'text-tertiary bg-tertiary'
                                          }`}
                                        ></span>
                                        <span
                                          className={`font-body text-xs font-bold uppercase tracking-wider ${
                                            slot.isBlocked ? 'text-primary' : 'text-tertiary'
                                          }`}
                                        >
                                          {slot.isBlocked ? 'Đang bận' : 'Có thể nhận khách'}
                                        </span>
                                      </div>
                                      {slot.specificDate && (
                                        <span className="inline-block rounded bg-surface-container-high px-2 py-0.5 font-body text-[10px] font-bold text-secondary">
                                          Áp dụng: {slot.specificDate}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 flex items-center justify-end sm:mt-0">
                                  <button
                                    aria-label="Xoá khung giờ"
                                    onClick={() => handleDeleteSlot(slot)}
                                    disabled={savingKey === `delete-${slot.id}`}
                                    className="rounded-full bg-surface-container-highest/20 p-2 text-secondary opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-600 group-hover:opacity-100 disabled:opacity-0"
                                  >
                                    {savingKey === `delete-${slot.id}` ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Sticky Form Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              {/* Add New Slot Form */}
              <div ref={formRef} className="relative overflow-hidden rounded-xl bg-[#1c1b1b] p-8 text-white shadow-xl scroll-mt-24">
                <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl"></div>
                
                <h3 className="relative z-10 mb-6 flex items-center justify-between font-headline text-xl font-bold">
                  <span>Thêm khung giờ mới</span>
                  <Zap size={20} className="text-secondary" />
                </h3>
                
                <div className="relative z-10 space-y-6">
                  <div>
                    <label className="mb-3 block font-body text-[10px] font-bold uppercase tracking-widest text-[#a0a0a0]">
                      Áp dụng cho ngày
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {weekDays.map(day => (
                        <button
                          key={day.dayIndex}
                          type="button"
                          onClick={() => toggleDay(day.dayIndex)}
                          className={`rounded-full border px-3 py-1.5 font-body text-xs font-bold transition-all ${
                            selectedDayIndices.includes(day.dayIndex)
                              ? 'border-primary bg-primary text-white shadow-[0_0_12px_rgba(183,16,42,0.4)]'
                              : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {day.dayName}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block font-body text-[10px] font-bold uppercase tracking-widest text-[#a0a0a0]">
                      Chọn nhanh ca mẫu
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {QUICK_PRESETS.map(preset => (
                        <button
                          key={preset.label}
                          onClick={() => setFormState(prev => ({ ...prev, startTime: preset.start, endTime: preset.end }))}
                          type="button"
                          className="rounded-lg border border-white/20 bg-[#1c1b1b] px-2 py-2 font-body text-xs font-bold text-white/80 transition-colors hover:border-primary hover:text-primary active:scale-95"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="staffSlotStartTime" className="mb-2 block font-body text-[10px] font-bold uppercase tracking-widest text-[#a0a0a0]">
                        Bắt đầu
                      </label>
                      <input
                        id="staffSlotStartTime"
                        type="time"
                        value={formState.startTime}
                        onChange={(e) => setFormState(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full border-b border-white/20 bg-white/5 p-3 font-body text-white transition-colors focus:border-primary focus:outline-none [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label htmlFor="staffSlotEndTime" className="mb-2 block font-body text-[10px] font-bold uppercase tracking-widest text-[#a0a0a0]">
                        Kết thúc
                      </label>
                      <input
                        id="staffSlotEndTime"
                        type="time"
                        value={formState.endTime}
                        onChange={(e) => setFormState(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full border-b border-white/20 bg-white/5 p-3 font-body text-white transition-colors focus:border-primary focus:outline-none [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="staffSlotStatus" className="mb-2 block font-body text-[10px] font-bold uppercase tracking-widest text-[#a0a0a0]">
                      Trạng thái
                    </label>
                    <select
                      id="staffSlotStatus"
                      value={formState.isBlocked ? 'true' : 'false'}
                      onChange={(e) => setFormState(prev => ({ ...prev, isBlocked: e.target.value === 'true' }))}
                      className="w-full appearance-none border-b border-white/20 bg-white/5 p-3 font-body text-white transition-colors focus:border-primary focus:outline-none"
                    >
                      <option value="false" className="bg-[#1c1b1b] text-white">CÓ THỂ NHẬN KHÁCH</option>
                      <option value="true" className="bg-[#1c1b1b] text-white">ĐANG BẬN</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="staffSlotSpecificDate" className="mb-2 flex items-center gap-2 font-body text-[10px] font-bold uppercase tracking-widest text-[#a0a0a0]">
                      <CalendarIcon size={12}/> Ngày cụ thể (tùy chọn)
                    </label>
                    <input
                      id="staffSlotSpecificDate"
                      type="date"
                      value={formState.specificDate}
                      onChange={(e) => setFormState(prev => ({ ...prev, specificDate: e.target.value }))}
                      className="w-full border-b border-white/20 bg-white/5 p-3 font-body text-sm text-white transition-colors focus:border-primary focus:outline-none [color-scheme:dark]"
                    />
                  </div>

                  <button
                    onClick={handleCreateSlot}
                    disabled={isSubmitting}
                    className="mt-6 flex w-full transform items-center justify-center gap-2 rounded-full bg-primary py-4 font-body font-bold text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-primary/40 disabled:translate-y-0 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                    {isSubmitting ? 'Đang thêm...' : `Thêm khung giờ (${selectedDayIndices.length} ngày)`}
                  </button>
                </div>
              </div>
              
              {/* Tip Container */}
              <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tertiary/10 text-tertiary">
                    <Info size={24} />
                  </div>
                  <div>
                    <p className="mb-1 font-body text-xs font-bold uppercase tracking-widest text-on-surface">Mẹo tạo lịch nhanh</p>
                    <p className="text-balance font-body text-sm leading-relaxed text-secondary">
                      Bạn có thể chọn nhiều ngày như Thứ 2, Thứ 4, Thứ 6 và bấm "Chiều" để thêm lịch rảnh hàng loạt chỉ với một thao tác.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </StaffPageShell>
  );
};

export default StaffSchedule;
