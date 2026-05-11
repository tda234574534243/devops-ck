import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import CustomerLayout from '../components/layout/CustomerLayout';
import { paymentService } from '../services/paymentService';
import { Payment, ScreenProps } from '../types';

const clearPendingPaymentKeys = () => {
  sessionStorage.removeItem('pendingPayPalOrderId');
  sessionStorage.removeItem('pendingReservationId');
  sessionStorage.removeItem('pendingMembershipPayPalOrderId');
};

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

export default function PaymentReturn({ onNavigate }: ScreenProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác nhận thanh toán PayPal...');
  const [payment, setPayment] = useState<Payment | null>(null);
  const didCapture = useRef(false);

  useEffect(() => {
    if (didCapture.current) {
      return;
    }

    didCapture.current = true;

    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setStatus('error');
      setMessage('Không tìm thấy mã thanh toán PayPal trong đường dẫn trả về.');
      clearPendingPaymentKeys();
      return;
    }

    const capturePayment = async () => {
      try {
        const capturedPayment = await paymentService.capturePayPalPayment(token);
        setPayment(capturedPayment);
        setStatus('success');
        setMessage(
          capturedPayment.type === 'MembershipPurchase'
            ? 'Gói thành viên đã được kích hoạt.'
            : 'Tiền cọc đã được ghi nhận. Lịch chơi của bạn đã sẵn sàng.',
        );
        clearPendingPaymentKeys();
      } catch (error) {
        setStatus('error');
        setMessage(
          getErrorMessage(
            error,
            'Không thể xác nhận thanh toán PayPal lúc này. Vui lòng liên hệ nhân viên để kiểm tra giao dịch.',
          ),
        );
        clearPendingPaymentKeys();
      }
    };

    void capturePayment();
  }, []);

  const isMembershipPayment = payment?.type === 'MembershipPurchase';

  return (
    <CustomerLayout onNavigate={onNavigate} activeScreen={isMembershipPayment ? 'membershipTiers' : 'bookingHistory'}>
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6 py-16">
        <section className="w-full rounded-[28px] border border-outline-variant/20 bg-surface-container-low p-8 text-center shadow-[0_18px_46px_-30px_rgba(0,0,0,0.35)] md:p-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-high">
            {status === 'loading' && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle2 className="h-8 w-8 text-emerald-600" />}
            {status === 'error' && <AlertCircle className="h-8 w-8 text-error" />}
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
            PayPal
          </p>
          <h1 className="mt-3 font-headline text-3xl font-black tracking-tight text-on-background md:text-4xl">
            {status === 'loading'
              ? 'Đang xác nhận thanh toán'
              : status === 'success'
                ? 'Thanh toán thành công'
                : 'Thanh toán chưa hoàn tất'}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-secondary md:text-base">
            {message}
          </p>

          {status === 'success' && (
            <button
              type="button"
              onClick={() => onNavigate(isMembershipPayment ? 'membershipTiers' : 'bookingHistory')}
              className="mt-8 rounded-full bg-primary px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-on-primary transition-transform hover:translate-y-[-2px] active:scale-95"
            >
              {isMembershipPayment ? 'Xem gói thành viên' : 'Xem lịch đặt bàn'}
            </button>
          )}

          {status === 'error' && (
            <button
              type="button"
              onClick={() => onNavigate('floorPlan')}
              className="mt-8 rounded-full border border-outline-variant/50 px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-on-background transition-colors hover:border-primary hover:text-primary"
            >
              Quay lại đặt bàn
            </button>
          )}
        </section>
      </div>
    </CustomerLayout>
  );
}
