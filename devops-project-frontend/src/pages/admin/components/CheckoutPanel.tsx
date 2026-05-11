import React, { useEffect, useMemo, useState } from 'react';
import { X, Receipt, Wallet, Banknote, CreditCard, RefreshCw } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { AdminTable, CheckoutSummary, LinkableCoachSession, RunningTotal } from '../../../types';

interface CheckoutPanelProps {
  isOpen: boolean;
  onClose: (success: boolean) => void;
  table?: AdminTable | null;
  sessionId?: string | null;
  bookingId?: string | null;
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

export const CheckoutPanel = ({
  isOpen,
  onClose,
  table,
  sessionId,
  bookingId,
}: CheckoutPanelProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [linkableSessions, setLinkableSessions] = useState<LinkableCoachSession[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash');
  const [runningTotal, setRunningTotal] = useState<RunningTotal | null>(null);
  const [interimBill, setInterimBill] = useState<CheckoutSummary | null>(null);

  const customerName = useMemo(
    () => interimBill?.customerName || table?.currentCustomerName || 'Khách vãng lai',
    [interimBill?.customerName, table?.currentCustomerName],
  );

  const refreshBilling = async () => {
    if (!sessionId) {
      setRunningTotal(null);
      setInterimBill(null);
      setLinkableSessions([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [total, bill, sessions] = await Promise.all([
        adminService.getSessionRunningTotal(sessionId),
        adminService.getSessionInterimBill(sessionId),
        bookingId
          ? adminService.getAvailableCoachSessions(bookingId)
          : Promise.resolve([] as LinkableCoachSession[]),
      ]);

      setRunningTotal(total);
      setInterimBill(bill);
      setLinkableSessions(sessions);
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Không thể tải thông tin thanh toán cho phiên này.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void refreshBilling();

    const interval = window.setInterval(() => {
      void refreshBilling();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [bookingId, isOpen, sessionId]);

  if (!isOpen) {
    return null;
  }

  const handleLinkCoach = async (coachSessionId: string) => {
    if (!bookingId) {
      setError('Không tìm thấy lượt đặt đang hoạt động để cộng phí HLV.');
      return;
    }

    setLinkingId(coachSessionId);
    setError('');
    setSuccessMessage('');

    try {
      await adminService.linkCoachSession(bookingId, { coachingSessionId: coachSessionId });
      setSuccessMessage('Đã cộng phí HLV vào hóa đơn hiện tại.');
      await refreshBilling();
    } catch (linkError) {
      setError(getErrorMessage(linkError, 'Có lỗi khi thêm phí HLV vào hóa đơn.'));
    } finally {
      setLinkingId(null);
    }
  };

  const handleSubmit = async () => {
    if (!bookingId) {
      setError('Không tìm thấy lượt đặt đang hoạt động để thanh toán.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const apiPaymentMethod = paymentMethod === 'Transfer' ? 'Cash' : paymentMethod;
      const response = await adminService.checkoutBooking(bookingId, {
        paymentMethod: apiPaymentMethod,
      });
      setSuccessMessage(response.message || 'Thanh toán thành công.');
      onClose(true);
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Lỗi khi thanh toán.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-right fixed inset-y-0 right-0 z-[70] flex w-[420px] flex-col border-l border-neutral-200 bg-white shadow-2xl duration-300">
      <div className="flex items-center justify-between border-b bg-neutral-50 p-6 text-neutral-900">
        <div>
          <h2 className="font-headline text-lg font-bold tracking-tight">
            {table?.tableNumber || 'Thanh toán bàn'}
          </h2>
          <p className="text-sm text-neutral-500">Khách: {customerName}</p>
        </div>
        <button
          aria-label="Đóng bảng thanh toán"
          title="Đóng"
          onClick={() => onClose(false)}
          className="rounded-full border border-neutral-200 bg-white p-2 text-neutral-500 shadow-sm hover:text-black"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-headline text-lg font-bold">
            <Receipt size={20} className="text-primary" />
            Chi tiết hóa đơn
          </h3>
          <button
            type="button"
            onClick={() => void refreshBilling()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {runningTotal?.note && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {runningTotal.note}
          </div>
        )}

        {loading && !interimBill ? (
          <div className="rounded-xl border border-neutral-100 bg-surface-low p-4 text-sm text-neutral-500">
            Đang tải tổng tiền phiên...
          </div>
        ) : interimBill ? (
          <div className="space-y-3 rounded-xl border border-neutral-100 bg-surface-low p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Tiền bàn</span>
              <span className="font-medium text-neutral-900">
                {interimBill.tableCost.toLocaleString()}đ
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Dịch vụ F&amp;B</span>
              <span className="font-medium text-neutral-900">
                {interimBill.fnBCost.toLocaleString()}đ
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Phí huấn luyện viên</span>
              <span className="font-medium text-neutral-900">
                {interimBill.coachingCost.toLocaleString()}đ
              </span>
            </div>
            {interimBill.discountAmount > 0 && (
              <div className="flex items-center justify-between text-tertiary">
                <span className="font-medium">Giảm giá thành viên</span>
                <span className="font-bold">
                  -{interimBill.discountAmount.toLocaleString()}đ
                </span>
              </div>
            )}
            {interimBill.depositAmount > 0 && (
              <div className="flex items-center justify-between text-emerald-600">
                <span className="font-medium">Tiền cọc đã thu</span>
                <span className="font-bold">
                  -{interimBill.depositAmount.toLocaleString()}đ
                </span>
              </div>
            )}

            <div className="border-t border-dashed border-neutral-300 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-neutral-900">Tổng chi phí</span>
                <span className="text-lg font-bold text-neutral-500">
                  {interimBill.totalCost.toLocaleString()}đ
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xl font-black text-primary">KHÁCH CẦN TRẢ</span>
                <span className="text-2xl font-black text-primary">
                  {interimBill.amountDue.toLocaleString()}đ
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-100 bg-surface-low p-4 text-sm text-neutral-500">
            Không tìm thấy phiên đang hoạt động để tính hóa đơn.
          </div>
        )}

        {runningTotal && (
          <div className="rounded-xl border border-neutral-100 bg-surface-lowest p-4 text-xs text-neutral-600">
            <div className="flex items-center justify-between">
              <span>Tạm tính hiện tại</span>
              <span className="font-semibold text-neutral-900">
                {runningTotal.estimatedBalanceDue.toLocaleString()}đ
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>Tổng trước cọc</span>
              <span>{runningTotal.subtotal.toLocaleString()}đ</span>
            </div>
          </div>
        )}

        {linkableSessions.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-headline text-lg font-bold text-primary">
              Buổi dạy kèm chưa cộng phí
            </h3>
            <div className="flex flex-col gap-3">
              {linkableSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-xl border border-tertiary/30 bg-teal-50 p-3"
                >
                  <div>
                    <p className="text-sm font-bold">HLV: {session.coachName}</p>
                    <p className="text-xs text-neutral-500">
                      {session.sessionDate.slice(0, 10)} | {session.startTime} -{' '}
                      {session.endTime}
                    </p>
                    <p className="text-sm font-bold text-tertiary">
                      {session.cost?.toLocaleString()}đ
                    </p>
                  </div>
                  <button
                    disabled={linkingId === session.id}
                    onClick={() => void handleLinkCoach(session.id)}
                    className="rounded bg-tertiary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {linkingId === session.id ? 'Đang thêm...' : 'Thêm vào hóa đơn'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="flex items-center gap-2 font-headline text-lg font-bold">
            <Wallet size={20} className="text-primary" />
            Phương thức thanh toán
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('Cash')}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                paymentMethod === 'Cash'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-neutral-200 text-neutral-500 hover:border-primary/50'
              }`}
            >
              <Banknote size={24} />
              <span className="text-sm font-medium">Tiền mặt</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('Transfer')}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                paymentMethod === 'Transfer'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-neutral-200 text-neutral-500 hover:border-primary/50'
              }`}
            >
              <CreditCard size={24} />
              <span className="text-sm font-medium">Chuyển khoản</span>
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200 bg-neutral-50 p-6">
        <button
          onClick={() => void handleSubmit()}
          disabled={!bookingId || submitting || loading}
          className="w-full rounded-xl bg-primary py-4 text-lg font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {submitting ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
        </button>
      </div>
    </div>
  );
};
