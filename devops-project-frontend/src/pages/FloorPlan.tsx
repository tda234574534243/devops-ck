import React, { useEffect, useMemo, useState } from 'react';
import { addDays, addMinutes, format } from 'date-fns';
import CustomerLayout from '../components/layout/CustomerLayout';
import { useSignalR } from '../hooks/useSignalR';
import { CategoryAvailabilitySlot, PaymentMethod, ScreenProps, TableType } from '../types';
import { useBookingStore } from '../stores/bookingStore';
import { useAuthStore } from '../stores/authStore';
import { useMembershipStore } from '../stores/membershipStore';
import { tableService } from '../services/tableService';
import { paymentService } from '../services/paymentService';
import { formatCurrency } from '../utils/formatCurrency';
import { getTableTypeLabel } from '../utils/labels';

const THIRTY_MINUTES_IN_MS = 30 * 60 * 1000;
const DEPOSIT_AMOUNT = 50000;

const DEFAULT_CATEGORY_RATES: Record<TableType, number> = {
  Pool: 80000,
  Snooker: 100000,
  Carom: 120000,
};

const CATEGORIES: { type: TableType; desc: string }[] = [
  {
    type: 'Pool',
    desc: 'Bàn 9ft tiêu chuẩn cho các ca chơi linh hoạt, phù hợp cả giải trí lẫn tập luyện kỹ thuật.',
  },
  {
    type: 'Snooker',
    desc: 'Bàn full-size dành cho người chơi muốn trải nghiệm cảm giác thi đấu chuẩn chỉnh và kiểm soát bi tốt hơn.',
  },
  {
    type: 'Carom',
    desc: 'Bàn carom 3 băng cho những kèo kỹ thuật, cần độ chính xác cao và nhịp độ thi đấu ổn định.',
  },
];

const getSortedSlots = (slots: string[]) =>
  [...slots].sort(
    (left, right) =>
      new Date(`1970-01-01T${left}`).getTime() - new Date(`1970-01-01T${right}`).getTime(),
  );

const isContiguousSelection = (slots: string[]) =>
  getSortedSlots(slots).every((slot, index, orderedSlots) => {
    if (index === 0) return true;

    return (
      new Date(`1970-01-01T${slot}`).getTime() -
        new Date(`1970-01-01T${orderedSlots[index - 1]}`).getTime() ===
      THIRTY_MINUTES_IN_MS
    );
  });

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

export default function FloorPlan({ onNavigate }: ScreenProps) {
  const {
    selectedCategory,
    categoryAvailability,
    availabilityError,
    selectedDate,
    selectedSlots,
    isLoading: isBookingLoading,
    setSelectedCategory,
    setSelectedDate,
    toggleSlot,
    clearBooking,
    createBooking,
    fetchCategoryAvailability,
  } = useBookingStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { myMembership, fetchMyMembership } = useMembershipStore();

  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Extract<PaymentMethod, 'Cash'>>('Cash');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [categoryRates, setCategoryRates] = useState<Record<TableType, number>>(
    DEFAULT_CATEGORY_RATES,
  );

  useSignalR({
    floorPlanDate: selectedDate,
    onCategoryCapacityChanged: (tableType, bookingDate) => {
      const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
      if (
        selectedCategory &&
        selectedCategory === tableType &&
        bookingDate.slice(0, 10) === selectedDateString
      ) {
        void fetchCategoryAvailability(selectedCategory, selectedDate);
      }
    },
  });

  useEffect(() => {
    if (selectedCategory && selectedDate) {
      void fetchCategoryAvailability(selectedCategory, selectedDate);
    }
  }, [selectedCategory, selectedDate, fetchCategoryAvailability]);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchMyMembership();
    }
  }, [fetchMyMembership, isAuthenticated]);

  useEffect(() => {
    tableService.getTables().then((tables) => {
      const nextRates = { ...DEFAULT_CATEGORY_RATES };
      tables.forEach((table) => {
        nextRates[table.type] = table.hourlyRate;
      });
      setCategoryRates(nextRates);
    });
  }, []);

  const maxAdvanceDays = myMembership?.maxAdvanceBookingDays ?? 0;
  const availableDates = Array.from({ length: maxAdvanceDays + 1 }, (_, index) =>
    addDays(new Date(), index),
  );
  const orderedSelectedSlots = getSortedSlots(selectedSlots);
  const durationHours = orderedSelectedSlots.length * 0.5;
  const selectedCategoryRate = selectedCategory ? categoryRates[selectedCategory] : 0;
  const totalPrice = selectedCategoryRate * durationHours;
  const grandTotal = totalPrice + DEPOSIT_AMOUNT;

  const slotRangeLabel = useMemo(() => {
    if (orderedSelectedSlots.length === 0) {
      return 'Chưa chọn khung giờ';
    }

    return `${orderedSelectedSlots[0].slice(0, 5)} - ${format(
      addMinutes(
        new Date(`1970-01-01T${orderedSelectedSlots[orderedSelectedSlots.length - 1]}`),
        30,
      ),
      'HH:mm',
    )}`;
  }, [orderedSelectedSlots]);

  const handleSelectCategory = (type: TableType) => {
    setBookingError('');
    setBookingSuccess('');
    setSelectedCategory(type);
  };

  const handleSelectDate = (date: Date) => {
    setBookingError('');
    setBookingSuccess('');
    setSelectedDate(date);
  };

  const handleSlotToggle = (slot: CategoryAvailabilitySlot) => {
    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    let isPast = false;

    if (isToday) {
      const [slotHour, slotMinute] = slot.startTime.split(':').map(Number);
      const now = new Date();
      if (
        slotHour < now.getHours() ||
        (slotHour === now.getHours() && slotMinute <= now.getMinutes())
      ) {
        isPast = true;
      }
    }

    if (slot.available <= 0 || isPast) {
      return;
    }

    const nextSelectedSlots = selectedSlots.includes(slot.startTime)
      ? selectedSlots.filter((currentSlot) => currentSlot !== slot.startTime)
      : getSortedSlots([...selectedSlots, slot.startTime]);

    if (!isContiguousSelection(nextSelectedSlots)) {
      setBookingError('Vui lòng chọn các khung giờ liền kề nhau.');
      return;
    }

    setBookingError('');
    setBookingSuccess('');
    toggleSlot(slot.startTime);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      setBookingSuccess('');
      setBookingError('Vui lòng đăng nhập trước khi tạo lượt đặt bàn.');
      onNavigate('login');
      return;
    }

    if (!selectedCategory) {
      setBookingSuccess('');
      setBookingError('Hãy chọn loại bàn trước khi đặt lịch.');
      return;
    }

    if (orderedSelectedSlots.length === 0) {
      setBookingSuccess('');
      setBookingError('Hãy chọn ít nhất một khung giờ ở khung bên phải.');
      return;
    }

    if (!isContiguousSelection(orderedSelectedSlots)) {
      setBookingSuccess('');
      setBookingError('Khung giờ đặt bàn phải nối tiếp nhau.');
      return;
    }

    const startSlotStr = orderedSelectedSlots[0];
    const endSlotStr = orderedSelectedSlots[orderedSelectedSlots.length - 1];
    const endTimeObj = addMinutes(new Date(`1970-01-01T${endSlotStr}`), 30);

    setBookingError('');
    setBookingSuccess('');
    setIsSubmittingPayment(true);

    try {
      const response = await createBooking({
        requestedTableType: selectedCategory,
        bookingDate: format(selectedDate, 'yyyy-MM-dd'),
        startTime: startSlotStr.slice(0, 5),
        endTime: format(endTimeObj, 'HH:mm'),
        fnBOrders: [],
      });

      const reservationId = response.reservationId || response.bookingId;
      if (!reservationId) {
        throw new Error('Không tìm thấy mã lượt đặt bàn vừa tạo.');
      }

      const paymentResult = await paymentService.createPayment(reservationId, paymentMethod);


      setBookingSuccess(response.message || 'Đặt bàn thành công.');
      clearBooking();
      onNavigate('bookingHistory');
    } catch (error) {
      setBookingError(
        getErrorMessage(error, 'Không thể tạo lượt đặt lúc này. Vui lòng thử lại sau.'),
      );
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <CustomerLayout onNavigate={onNavigate} activeScreen="floorPlan">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-8 pb-20 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-8">
          <section className="space-y-5">
            <span className="block font-label text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Đặt bàn theo khu vực
            </span>
            <h1 className="font-headline text-5xl font-black tracking-tight text-on-background md:text-6xl">
              Sơ đồ sàn
              <br />
              <span className="text-primary">Precision.</span>
            </h1>
            <p className="max-w-3xl text-base leading-8 text-secondary md:text-lg">
              Chọn hạng bàn trước, sau đó chọn ngày và khung giờ còn trống. Hệ thống nhận lượt đặt
              theo loại bàn, còn bàn cụ thể sẽ được nhân viên phân bổ khi bạn đến làm thủ tục nhận bàn.
            </p>
          </section>

          <section className="space-y-4">
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.type;
              const rate = categoryRates[category.type];

              return (
                <button
                  key={category.type}
                  type="button"
                  onClick={() => handleSelectCategory(category.type)}
                  className={`w-full rounded-[28px] border px-6 py-6 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-surface-container-high shadow-[0_14px_36px_-26px_rgba(0,0,0,0.45)]'
                      : 'border-outline-variant/40 bg-surface-container-lowest hover:border-primary/30 hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                            isSelected
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-high text-primary'
                          }`}
                        >
                          {category.type.slice(0, 1)}
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-headline text-2xl font-bold tracking-tight">
                            {getTableTypeLabel(category.type)}
                          </h3>
                          <p className="max-w-2xl text-sm leading-7 text-secondary md:text-[15px]">
                            {category.desc}
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-secondary">
                        Bàn cụ thể sẽ được sắp xếp khi khách đến.
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 md:block md:min-w-[190px] md:text-right">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                          Đơn giá
                        </p>
                        <p className="mt-1 font-headline text-2xl font-black text-primary">
                          {formatCurrency(rate)}/giờ
                        </p>
                      </div>
                      <span
                        className={`mt-4 inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${
                          isSelected
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-high text-secondary'
                        }`}
                      >
                        {isSelected ? 'Đã chọn' : 'Chọn khu vực'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </section>
        </div>

        <aside className="space-y-8 lg:col-span-4">
          <div className="sticky top-24 max-h-[calc(100vh-6rem)] space-y-8 overflow-y-auto rounded-[28px] border border-outline-variant/20 bg-surface-container-low p-8 shadow-[0_12px_34px_-18px_rgba(0,0,0,0.08)]">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                Tạo lượt đặt nhanh
              </p>
              <h2 className="font-headline text-3xl font-black tracking-tight text-on-background">
                Lịch chơi của bạn
              </h2>
            </div>

            {bookingError && (
              <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm leading-6 text-error">
                {bookingError}
              </div>
            )}

            {bookingSuccess && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
                {bookingSuccess}
              </div>
            )}

            <div className="rounded-2xl border border-tertiary/20 bg-tertiary/5 px-4 py-3 text-sm leading-7 text-tertiary-dark">
              <strong>Đặt lịch theo hệ thống:</strong> bàn cụ thể sẽ được gán khi bạn nhận bàn. Khoản
              cọc giữ chỗ cố định là <strong>{formatCurrency(DEPOSIT_AMOUNT)}</strong>.
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                  Ngày chơi
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableDates.map((date, index) => {
                    const isSelectedDate =
                      format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

                    return (
                      <button
                        key={format(date, 'yyyy-MM-dd')}
                        type="button"
                        onClick={() => handleSelectDate(date)}
                        className={`rounded-xl py-3 text-xs font-bold uppercase tracking-wide transition-colors ${
                          isSelectedDate
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        {index === 0 ? 'Hôm nay' : format(date, 'dd MMM')}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs leading-6 text-secondary">
                  {isAuthenticated
                    ? `Gói hiện tại cho phép đặt trước tối đa ${maxAdvanceDays} ngày.`
                    : 'Khách chưa đăng nhập vẫn có thể xem lịch hôm nay. Đăng nhập để mở rộng thời gian đặt trước.'}
                </p>
              </div>

              {selectedCategory && categoryAvailability && (
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary">Công suất online</span>
                    <span className="font-bold text-neutral-900">
                      {categoryAvailability.onlineCapacity}/{categoryAvailability.totalTables} bàn
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-secondary">Bàn dự phòng cho khách đến trực tiếp</span>
                    <span className="font-medium text-neutral-900">
                      {categoryAvailability.bufferSize} bàn
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                  Khung giờ
                </label>

                {!selectedCategory ? (
                  <div className="rounded-2xl bg-surface-container-lowest p-4 text-sm leading-6 text-secondary">
                    Chọn loại bàn trước để xem lịch còn trống.
                  </div>
                ) : isBookingLoading && !categoryAvailability ? (
                  <div className="rounded-2xl bg-surface-container-lowest p-4 text-sm leading-6 text-secondary">
                    Đang tải khung giờ khả dụng...
                  </div>
                ) : availabilityError ? (
                  <div className="rounded-2xl border border-error/20 bg-error/5 p-4 text-sm leading-6 text-error">
                    {availabilityError}
                  </div>
                ) : !categoryAvailability || categoryAvailability.slots.length === 0 ? (
                  <div className="rounded-2xl bg-surface-container-lowest p-4 text-sm leading-6 text-secondary">
                    Chưa có khung giờ trống cho ngày đã chọn.
                  </div>
                ) : (
                  <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1">
                    {categoryAvailability.slots.map((slot) => {
                      const isSelectedSlot = selectedSlots.includes(slot.startTime);
                      let isAvailable = slot.available > 0;

                      const isToday =
                        format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      if (isToday) {
                        const [slotHour, slotMinute] = slot.startTime.split(':').map(Number);
                        const now = new Date();
                        if (
                          slotHour < now.getHours() ||
                          (slotHour === now.getHours() && slotMinute <= now.getMinutes())
                        ) {
                          isAvailable = false;
                        }
                      }

                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => handleSlotToggle(slot)}
                          className={`group relative rounded-xl py-2.5 text-xs font-semibold transition-colors ${
                            isSelectedSlot
                              ? 'border border-primary bg-primary text-on-primary'
                              : isAvailable
                                ? 'border border-transparent bg-surface-container-lowest text-on-surface hover:border-primary/20'
                                : 'cursor-not-allowed bg-secondary/10 text-secondary line-through'
                          }`}
                        >
                          {slot.startTime.slice(0, 5)}
                          {isAvailable && !isSelectedSlot && (
                            <span className="absolute -right-1 -top-1 rounded-full bg-tertiary px-1 text-[8px] text-white">
                              {slot.available}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                  Thời lượng
                </label>
                <div className="rounded-2xl bg-surface-container-lowest p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">Khung giờ đã chọn</span>
                    <span className="font-semibold text-on-background">{slotRangeLabel}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-secondary">Tổng thời lượng</span>
                    <span className="font-bold text-on-background">
                      {durationHours.toFixed(1)} giờ
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                  Phương thức thanh toán cọc
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash')}
                    className={`rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
                      paymentMethod === 'Cash'
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline-variant/30 bg-surface-container-lowest text-secondary hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    Tiền mặt (Thanh toán tại quầy)
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-end justify-between border-b border-outline-variant/10 pb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                      Tổng tạm tính
                    </p>
                    <p className="font-headline text-3xl font-black tracking-tight text-on-background">
                      {formatCurrency(grandTotal)}
                    </p>
                  </div>
                  <div className="space-y-1 text-right text-[11px] text-secondary">
                    <p>Giờ chơi: {formatCurrency(totalPrice)}</p>
                    <p className="font-bold text-tertiary">
                      Cọc trước: {formatCurrency(DEPOSIT_AMOUNT)}
                    </p>
                  </div>
                </div>

                <button
                  className="billiard-gradient w-full rounded-full py-5 text-sm font-bold uppercase tracking-[0.18em] text-on-primary transition-transform hover:translate-y-[-2px] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={
                    !selectedCategory ||
                    orderedSelectedSlots.length === 0 ||
                    isBookingLoading ||
                    isSubmittingPayment
                  }
                >
                  {isBookingLoading || isSubmittingPayment
                    ? 'Đang xử lý thanh toán...'
                    : `Xác nhận đặt bàn - cọc ${DEPOSIT_AMOUNT / 1000}K`}
                </button>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </CustomerLayout>
  );
}
