import React, { useEffect, useMemo, useState } from 'react';
import CustomerLayout from '../components/layout/CustomerLayout';
import { ScreenProps, BookingStatus } from '../types';
import { useBookingStore } from '../stores/bookingStore';
import {
  getBookingChannelLabel,
  getBookingStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getTableTypeLabel,
} from '../utils/labels';

const statusFilters: Array<{ value: '' | BookingStatus; label: string }> = [
  { value: '', label: 'Tất cả' },
  { value: 'Confirmed', label: 'Sắp tới' },
  { value: 'InProgress', label: 'Đang chơi' },
  { value: 'Completed', label: 'Đã hoàn tất' },
  { value: 'Cancelled', label: 'Đã hủy' },
  { value: 'NoShow', label: 'Không đến' },
];

const formatMoney = (value?: number | null) =>
  (value || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const formatDateTime = (value?: string | null) => {
  if (!value) return '--';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN');
};

export default function BookingHistory({ onNavigate }: ScreenProps) {
  const { bookings, fetchBookings, isLoading, cancelBooking, totalItems, totalPages } = useBookingStore();
  const [filter, setFilter] = useState<'' | BookingStatus>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    void fetchBookings(currentPage, 10, filter || undefined);
  }, [currentPage, fetchBookings, filter]);

  const visibleBookings = useMemo(() => bookings, [bookings]);

  const handleFilterChange = (nextFilter: '' | BookingStatus) => {
    setFilter(nextFilter);
    setCurrentPage(1);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lượt đặt chỗ này không?')) {
      return;
    }

    const success = await cancelBooking(bookingId);
    if (success) {
      setFeedback('Đã hủy lượt đặt chỗ thành công.');
      void fetchBookings(currentPage, 10, filter || undefined);
    }
  };

  return (
    <CustomerLayout onNavigate={onNavigate} activeScreen="bookingHistory">
      <div className="px-8 pb-20">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="space-y-3">
            <h1 className="font-headline text-4xl font-extrabold tracking-[-0.05em]">
              Lịch sử đặt chỗ
            </h1>
            <p className="max-w-2xl text-secondary">
              Theo dõi tất cả lượt đặt của bạn, từ lịch sắp tới đến những buổi đã hoàn tất.
            </p>
          </div>

          {feedback && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {feedback}
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleFilterChange(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                    filter === option.value
                      ? 'bg-on-surface text-surface'
                      : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-8 text-center text-secondary">
                Đang tải lịch sử đặt chỗ...
              </div>
            ) : visibleBookings.length === 0 ? (
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-8 text-center text-secondary">
                Chưa có lượt đặt chỗ nào.
              </div>
            ) : (
              visibleBookings.map((booking) => {
                const startTime = new Date(booking.startTime);
                const endTime = new Date(booking.endTime);
                const durationHours = Math.max(0, (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
                const isActive = booking.status === 'Confirmed' || booking.status === 'InProgress';
                const isExpanded = expandedBookingId === booking.id;

                return (
                  <div
                    key={booking.id}
                    className={`relative overflow-hidden rounded-xl border p-6 ${
                      isActive
                        ? 'border-primary/30 bg-surface-container-lowest'
                        : 'border-outline-variant/30 bg-surface-container-lowest'
                    }`}
                  >
                    {isActive && <div className="absolute bottom-0 left-0 top-0 w-1 bg-primary"></div>}
                    {booking.status === 'Cancelled' && <div className="absolute bottom-0 left-0 top-0 w-1 bg-error"></div>}
                    {booking.status === 'NoShow' && <div className="absolute bottom-0 left-0 top-0 w-1 bg-secondary"></div>}

                    <div className="flex flex-col gap-6 md:flex-row md:items-center">
                      <div className="w-24 flex-shrink-0 text-center md:text-left">
                        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-secondary">
                          Tháng {startTime.getMonth() + 1}
                        </p>
                        <p className="font-headline text-3xl font-black text-primary">{startTime.getDate()}</p>
                        <p className="mt-1 text-sm font-bold">
                          {startTime.getHours()}:{startTime.getMinutes().toString().padStart(2, '0')}
                        </p>
                      </div>

                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <span className="material-symbols-outlined text-sm text-secondary">event_seat</span>
                          <p className="font-headline text-lg font-bold">
                            {booking.tableName
                              ? `Bàn ${booking.tableName}`
                              : `${getTableTypeLabel(booking.requestedTableType)} (xếp bàn khi tới)`}
                          </p>
                        </div>

                        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-secondary">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            <span>{durationHours.toFixed(1)} giờ</span>
                          </div>
                          <span>•</span>
                          <span className="font-medium">{formatMoney(booking.actualCost || booking.totalPrice)}</span>
                          <span>•</span>
                          <span
                            className={`rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                              booking.status === 'NoShow'
                                ? 'bg-secondary/10 text-secondary'
                                : booking.status === 'Cancelled'
                                  ? 'bg-error/10 text-error'
                                  : 'bg-surface-container-high text-secondary'
                            }`}
                          >
                            {getBookingStatusLabel(booking.status)}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-secondary">
                          <span className="material-symbols-outlined text-[14px]">payments</span>
                          <span>Cọc: {formatMoney(booking.depositAmount)}</span>
                          {booking.status === 'Cancelled' && (
                            <span className={booking.depositForfeited ? 'font-medium text-error' : 'font-medium text-emerald-600'}>
                              ({booking.depositForfeited ? 'Không hoàn cọc' : 'Đã hoàn cọc'})
                            </span>
                          )}
                          {booking.status === 'NoShow' && <span className="font-medium text-error">(Mất cọc)</span>}
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-2 md:w-auto">
                        <button
                          onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                          className="rounded-full bg-primary px-6 py-3 text-center text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-container"
                        >
                          {isExpanded ? 'Ẩn chi tiết' : 'Chi tiết'}
                        </button>
                        {booking.status === 'Confirmed' && (
                          <button
                            onClick={() => void handleCancelBooking(booking.id)}
                            className="whitespace-nowrap rounded-full bg-error/10 px-6 py-3 text-center text-xs font-bold uppercase tracking-widest text-error transition-colors hover:bg-error/20"
                          >
                            Hủy đặt chỗ
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-6 grid gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-low p-4 text-sm text-secondary md:grid-cols-2">
                        <div>
                          <span className="font-semibold text-on-surface">Kênh đặt chỗ:</span>{' '}
                          {getBookingChannelLabel(booking.bookingType)}
                        </div>
                        <div>
                          <span className="font-semibold text-on-surface">Tạo lúc:</span> {formatDateTime(booking.createdAt)}
                        </div>
                        <div>
                          <span className="font-semibold text-on-surface">Gán bàn lúc:</span> {formatDateTime(booking.assignedAt)}
                        </div>
                        <div>
                          <span className="font-semibold text-on-surface">Nhận bàn:</span> {formatDateTime(booking.checkedInAt)}
                        </div>
                        <div>
                          <span className="font-semibold text-on-surface">Trả bàn:</span> {formatDateTime(booking.checkedOutAt)}
                        </div>
                        <div>
                          <span className="font-semibold text-on-surface">Huấn luyện viên:</span> {booking.coach?.fullName || 'Không có'}
                        </div>
                        <div>
                          <span className="font-semibold text-on-surface">Trạng thái thanh toán:</span>{' '}
                          {getPaymentStatusLabel(booking.payment?.status)}
                        </div>
                        <div>
                          <span className="font-semibold text-on-surface">Phương thức thanh toán:</span>{' '}
                          {getPaymentMethodLabel(booking.payment?.method)}
                        </div>
                        <div>
                          <span className="font-semibold text-on-surface">Số món F&amp;B:</span> {booking.fnBOrders?.length || 0}
                        </div>
                        <div>
                          <span className="font-semibold text-on-surface">Ghi chú:</span> {booking.notes || 'Không có'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-8">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant/20 bg-surface-container-lowest text-secondary transition-colors hover:bg-surface-container-high disabled:opacity-50"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="flex h-10 min-w-10 items-center justify-center rounded-lg bg-primary px-3 text-sm font-bold text-on-primary">
              {currentPage}
            </button>
            <span className="text-sm text-secondary">
              / {Math.max(totalPages, 1)} • {totalItems} lượt đặt
            </span>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant/20 bg-surface-container-lowest text-secondary transition-colors hover:bg-surface-container-high disabled:opacity-50"
              disabled={totalPages <= 0 || currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => Math.min(Math.max(totalPages, 1), page + 1))}
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
