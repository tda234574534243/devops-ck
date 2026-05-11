import React, { useEffect, useMemo, useState } from 'react';
import CustomerLayout from '../components/layout/CustomerLayout';
import { MembershipPlan, PaymentMethod, ScreenProps } from '../types';
import { useMembershipStore } from '../stores/membershipStore';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency } from '../utils/formatCurrency';
import { Check, Crown, CalendarDays, Clock, Info } from 'lucide-react';
import { getMembershipTierLabel } from '../utils/labels';

const getAdvanceWindowLabel = (days: number) => {
  if (days <= 0) return 'Chỉ đặt trong ngày';
  return `Đặt trước ${days} ngày`;
};

const getMembershipStatusLabel = (status?: string | null) => {
  switch (status) {
    case 'Active':
      return 'Đang hiệu lực';
    case 'Expired':
      return 'Đã hết hạn';
    case 'Cancelled':
      return 'Đã hủy';
    default:
      return status || 'Không xác định';
  }
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
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

export default function Membership({ onNavigate }: ScreenProps) {
  const {
    plans,
    myMembership,
    isLoading,
    error,
    fetchPlans,
    fetchMyMembership,
    subscribe,
    cancelAutoRenew,
    clearError,
  } = useMembershipStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeMembership = isAuthenticated ? myMembership : null;
  const [autoRenewOnSubscribe, setAutoRenewOnSubscribe] = useState(true);
  const [membershipPaymentMethod, setMembershipPaymentMethod] = useState<
    Extract<PaymentMethod, 'Cash' | 'PayPal'>
  >('Cash');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchMyMembership();
    }
  }, [fetchMyMembership, isAuthenticated]);

  useEffect(() => {
    if (error) {
      setFeedback({ type: 'error', message: error });
      clearError();
    }
  }, [clearError, error]);

  const currentPlan = useMemo<MembershipPlan | null>(() => {
    if (!activeMembership) return null;

    return (
      plans.find((plan) => plan.id === activeMembership.planId) || {
        id: activeMembership.planId,
        tier: activeMembership.tier,
        name: activeMembership.planName,
        monthlyPrice: activeMembership.monthlyPrice,
        tableDiscountPercent: activeMembership.tableDiscountPercent,
        priorityBooking: activeMembership.priorityBooking,
        freeCoachingSessionsPerMonth: activeMembership.freeCoachingSessionsPerMonth,
        maxAdvanceBookingDays: activeMembership.maxAdvanceBookingDays,
        isActive: true,
      }
    );
  }, [activeMembership, plans]);

  const handleSubscribe = async (planId: number) => {
    if (!isAuthenticated) {
      setFeedback({
        type: 'error',
        message: 'Vui lòng đăng nhập trước khi đăng ký gói thành viên.',
      });
      onNavigate('login');
      return;
    }

    setFeedback(null);

    try {
      const result = await subscribe(planId, autoRenewOnSubscribe, membershipPaymentMethod);

      if (result.requiresRedirect) {
        if (!result.approvalUrl) {
          throw new Error('Không tìm thấy đường dẫn thanh toán PayPal.');
        }

        if (result.payPalOrderId) {
          sessionStorage.setItem('pendingMembershipPayPalOrderId', result.payPalOrderId);
        }
        window.location.href = result.approvalUrl;
        return;
      }

      if (!result.membership) {
        throw new Error('Không tìm thấy thông tin gói thành viên vừa đăng ký.');
      }

      setFeedback({
        type: 'success',
        message: `Đăng ký gói ${result.membership.planName} thành công.`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Không thể đăng ký gói thành viên lúc này.'),
      });
    }
  };

  const handleCancelAutoRenew = async () => {
    setFeedback(null);

    try {
      await cancelAutoRenew();
      setFeedback({
        type: 'success',
        message: 'Đã tắt gia hạn tự động cho gói hiện tại.',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Không thể hủy gia hạn tự động.'),
      });
    }
  };

  return (
    <CustomerLayout onNavigate={onNavigate} activeScreen="membershipTiers">
      <div className="min-h-screen bg-[#0A0A0A] px-6 py-12 text-white md:py-20">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="space-y-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Câu lạc bộ thành viên
            </p>
            <h1 className="font-headline text-4xl font-black tracking-tight text-white md:text-5xl">
              Gói thành viên CueMasters
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-stone-400 md:text-base">
              Nâng cấp trải nghiệm billiards với quyền lợi đặt bàn sớm hơn, ưu đãi giờ chơi và
              những đặc quyền dành riêng cho khách quay lại thường xuyên.
            </p>
          </div>

          {feedback && (
            <div
              className={`flex items-center gap-3 rounded-2xl border p-4 text-sm font-medium ${
                feedback.type === 'success'
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-red-500/20 bg-red-500/10 text-red-400'
              }`}
            >
              <Info className="h-5 w-5 shrink-0" />
              {feedback.message}
            </div>
          )}

          {activeMembership && currentPlan && (
            <div className="relative overflow-hidden rounded-[32px] border border-stone-800 bg-gradient-to-br from-stone-900 to-stone-950 p-8 shadow-2xl md:p-10">
              <div className="pointer-events-none absolute -right-8 -top-8 p-8 opacity-5">
                <Crown className="h-64 w-64" />
              </div>

              <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-primary/20 px-4 py-1.5 text-xs font-black uppercase tracking-[0.22em] text-primary">
                      {getMembershipTierLabel(currentPlan.tier)}
                    </span>
                    <span
                      className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.22em] ${
                        activeMembership.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {getMembershipStatusLabel(activeMembership.status)}
                    </span>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-stone-400">
                      Gói đang sử dụng
                    </p>
                    <h2 className="font-headline text-4xl font-black tracking-tight text-white md:text-5xl">
                      {activeMembership.planName}
                    </h2>
                  </div>

                  <div className="flex flex-col gap-4 text-sm font-medium text-stone-300 sm:flex-row sm:items-center sm:gap-8">
                    <div className="flex items-center gap-2.5">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      Hiệu lực: {formatDate(activeMembership.startDate)} đến{' '}
                      {formatDate(activeMembership.endDate)}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-primary" />
                      Gia hạn: {activeMembership.autoRenew ? 'Tự động' : 'Thủ công'}
                    </div>
                  </div>
                </div>

                <div className="flex min-w-[220px] flex-col gap-4">
                  {activeMembership.autoRenew && (
                    <button
                      onClick={handleCancelAutoRenew}
                      disabled={isLoading}
                      className="w-full rounded-2xl border border-stone-700/50 bg-stone-800/50 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:border-stone-600 hover:bg-stone-800 disabled:opacity-50"
                    >
                      Tắt gia hạn tự động
                    </button>
                  )}
                </div>
              </div>

              <div className="relative z-10 mt-10 grid grid-cols-2 gap-6 border-t border-stone-800/50 pt-10 md:grid-cols-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-400">
                    Giảm giá bàn
                  </span>
                  <span className="text-2xl font-black text-white md:text-3xl">
                    {currentPlan.tableDiscountPercent}%
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-400">
                    Đặt bàn online
                  </span>
                  <span className="text-2xl font-black text-white md:text-3xl">
                    {getAdvanceWindowLabel(currentPlan.maxAdvanceBookingDays)}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-400">
                    Buổi HLV mỗi tháng
                  </span>
                  <span className="text-2xl font-black text-white md:text-3xl">
                    {currentPlan.freeCoachingSessionsPerMonth}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-400">
                    Ưu tiên xếp bàn
                  </span>
                  <span className="text-2xl font-black text-white md:text-3xl">
                    {currentPlan.priorityBooking ? 'Có' : 'Không'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!activeMembership && (
            <div className="mx-auto flex max-w-2xl flex-col gap-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMembershipPaymentMethod('Cash')}
                  className={`rounded-xl border px-5 py-4 text-sm font-bold transition-colors ${
                    membershipPaymentMethod === 'Cash'
                      ? 'border-primary bg-primary text-white'
                      : 'border-stone-800 bg-stone-900/40 text-stone-300 hover:border-primary/50 hover:text-white'
                  }`}
                >
                  Tiền mặt
                </button>
                <button
                  type="button"
                  onClick={() => setMembershipPaymentMethod('PayPal')}
                  className={`rounded-xl border px-5 py-4 text-sm font-bold transition-colors ${
                    membershipPaymentMethod === 'PayPal'
                      ? 'border-primary bg-primary text-white'
                      : 'border-stone-800 bg-stone-900/40 text-stone-300 hover:border-primary/50 hover:text-white'
                  }`}
                >
                  PayPal
                </button>
              </div>

              <div className="flex justify-center">
                <label className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-stone-800/60 bg-stone-900/40 px-6 py-4 transition-colors hover:bg-stone-900/80">
                  <input
                    type="checkbox"
                    checked={autoRenewOnSubscribe}
                    onChange={(event) => setAutoRenewOnSubscribe(event.target.checked)}
                    className="h-5 w-5 rounded border-stone-700 bg-stone-950 text-emerald-500 transition-colors focus:ring-emerald-500/50 focus:ring-offset-stone-950"
                  />
                  <span className="select-none font-medium text-stone-300 transition-colors group-hover:text-white">
                    Tự động gia hạn gói theo chu kỳ tháng
                  </span>
                </label>
              </div>
            </div>
          )}

          {plans.length === 0 && !isLoading ? (
            <div className="py-12 text-center font-medium text-stone-500">
              Hiện chưa có gói thành viên nào đang mở bán.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
              {plans.map((plan) => {
                const isCurrentPlan = activeMembership?.planId === plan.id;
                const isMostPopular =
                  plan.tier.toLowerCase() === 'gold' || plan.tier.toLowerCase() === 'vip';

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-[2rem] p-8 transition-all duration-300 ${
                      isCurrentPlan
                        ? 'scale-[1.02] border-2 border-primary/40 bg-primary/5 shadow-[0_0_40px_rgba(var(--primary-rgb),0.15)]'
                        : 'border border-stone-800 bg-stone-900/30 hover:border-stone-700 hover:bg-stone-900/60'
                    }`}
                  >
                    {!plan.isActive && (
                      <div className="absolute -right-3 -top-3">
                        <span className="rounded-full bg-red-500 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg">
                          Tạm ngưng
                        </span>
                      </div>
                    )}

                    <div className="mb-8">
                      <div className="mb-6 flex items-center justify-between">
                        <span
                          className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${
                            isCurrentPlan
                              ? 'bg-primary/20 text-primary'
                              : 'bg-stone-800 text-stone-300'
                          }`}
                        >
                          {getMembershipTierLabel(plan.tier)}
                        </span>
                        {isMostPopular && !isCurrentPlan && (
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-500">
                            <Crown className="h-3.5 w-3.5" />
                            Được chọn nhiều
                          </span>
                        )}
                      </div>
                      <h3 className="mb-2 text-2xl font-black text-white">{plan.name}</h3>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-white">
                          {formatCurrency(plan.monthlyPrice)}
                        </span>
                        <span className="text-sm font-bold uppercase tracking-[0.16em] text-stone-500">
                          /tháng
                        </span>
                      </div>
                    </div>

                    <div className="mb-8 flex-1 space-y-4">
                      <div className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span className="text-sm leading-7 text-stone-300">
                          Giảm ngay <strong className="font-black text-white">{plan.tableDiscountPercent}%</strong>{' '}
                          cho phí giờ chơi bàn
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span className="text-sm leading-7 text-stone-300">
                          Quyền đặt bàn <strong className="font-black text-white">{getAdvanceWindowLabel(plan.maxAdvanceBookingDays).toLowerCase()}</strong>
                        </span>
                      </div>
                      {plan.freeCoachingSessionsPerMonth > 0 && (
                        <div className="flex items-start gap-3">
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <span className="text-sm leading-7 text-stone-300">
                            <strong className="font-black text-white">
                              {plan.freeCoachingSessionsPerMonth} buổi
                            </strong>{' '}
                            huấn luyện miễn phí mỗi tháng
                          </span>
                        </div>
                      )}
                      {plan.priorityBooking && (
                        <div className="flex items-start gap-3">
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <span className="text-sm leading-7 text-stone-300">
                            Có quyền <strong className="font-black text-white">ưu tiên xếp bàn</strong> vào giờ cao điểm
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-6">
                      <button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={isLoading || !!activeMembership || !plan.isActive}
                        className={`w-full rounded-xl py-4 text-sm font-bold uppercase tracking-[0.16em] transition-all ${
                          isCurrentPlan
                            ? 'cursor-default bg-primary text-white shadow-lg shadow-primary/20'
                            : activeMembership
                              ? 'hidden cursor-not-allowed bg-stone-800 text-stone-500'
                              : !plan.isActive
                                ? 'cursor-not-allowed bg-stone-800 text-stone-500'
                                : 'bg-white text-black hover:bg-stone-200'
                        }`}
                      >
                        {isCurrentPlan ? 'Đang sử dụng' : 'Đăng ký gói này'}
                      </button>

                      {activeMembership && !isCurrentPlan && (
                        <div className="w-full py-3 text-center text-xs font-medium text-stone-500">
                          Bạn chưa thể đổi gói khi gói hiện tại vẫn còn hiệu lực.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}
