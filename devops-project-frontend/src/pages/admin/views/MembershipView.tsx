import React, { useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { AdminMembershipPlan, AdminUpsertMembershipPlanRequest } from '../../../types';
import { formatCurrency } from '../../../utils/formatCurrency';
import { getMembershipTierLabel } from '../../../utils/labels';

const EMPTY_FORM: AdminUpsertMembershipPlanRequest = {
  tier: 'Free',
  name: '',
  monthlyPrice: 0,
  tableDiscountPercent: 0,
  priorityBooking: false,
  freeCoachingSessionsPerMonth: 0,
  maxAdvanceBookingDays: 0,
  isActive: true,
};

const getAdvanceWindowLabel = (days: number) => {
  if (days <= 0) return 'Trong ngày';
  if (days === 1) return '1 ngày';
  return `${days} ngày`;
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

export const MembershipView = () => {
  const [plans, setPlans] = useState<AdminMembershipPlan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [formData, setFormData] = useState<AdminUpsertMembershipPlanRequest>(EMPTY_FORM);

  const totalSubscribers = useMemo(
    () => plans.reduce((sum, plan) => sum + plan.activeSubscribers, 0),
    [plans],
  );

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getMemberships();
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      setNotice({
        type: 'error',
        message: getErrorMessage(error, 'Không thể tải danh sách gói thành viên.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPlans();
  }, []);

  const handleOpenModal = (plan?: AdminMembershipPlan) => {
    if (plan) {
      setEditingPlanId(plan.id);
      setFormData({
        tier: plan.tier,
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
        tableDiscountPercent: plan.tableDiscountPercent,
        priorityBooking: plan.priorityBooking,
        freeCoachingSessionsPerMonth: plan.freeCoachingSessionsPerMonth,
        maxAdvanceBookingDays: plan.maxAdvanceBookingDays,
        isActive: plan.isActive,
      });
    } else {
      setEditingPlanId(null);
      setFormData(EMPTY_FORM);
    }

    setNotice(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlanId(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setNotice(null);

    try {
      if (editingPlanId !== null) {
        await adminService.updateMembership(editingPlanId, formData);
        setNotice({ type: 'success', message: 'Đã cập nhật gói thành viên.' });
      } else {
        await adminService.createMembership(formData);
        setNotice({ type: 'success', message: 'Đã tạo gói thành viên mới.' });
      }

      handleCloseModal();
      await fetchPlans();
    } catch (error) {
      setNotice({
        type: 'error',
        message: getErrorMessage(error, 'Có lỗi xảy ra khi lưu gói thành viên.'),
      });
      setIsLoading(false);
    }
  };

  const handleDelete = async (plan: AdminMembershipPlan) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa gói ${plan.name}? Nếu còn người dùng đang sử dụng, gói sẽ được chuyển sang tạm ngưng thay vì xóa hẳn.`,
    );
    if (!confirmed) return;

    setIsLoading(true);
    setNotice(null);

    try {
      const response = await adminService.deleteMembership(plan.id);
      setNotice({
        type: 'success',
        message: response?.message || 'Đã xử lý thao tác xóa gói thành viên.',
      });
      await fetchPlans();
    } catch (error) {
      setNotice({
        type: 'error',
        message: getErrorMessage(error, 'Có lỗi xảy ra khi xóa gói thành viên.'),
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 p-8 text-neutral-900">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Quản lý gói thành viên
          </p>
          <h2 className="text-3xl font-black font-headline tracking-tight">
            Quản lý danh mục gói thành viên
          </h2>
          <p className="max-w-4xl text-sm leading-7 text-neutral-500">
            Hệ thống hiện lưu thông tin gói, thành viên đang tham gia và quyền lợi đã dùng. Hiện
            tại giảm giá bàn và thời gian đặt trước đã áp dụng tự động; các quyền lợi còn lại sẽ
            được bổ sung dần.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-primary-container"
        >
          <Plus size={18} />
          Thêm gói mới
        </button>
      </div>

      {notice && (
        <div
          className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {notice.message}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-neutral-100 bg-surface-lowest p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Tổng số gói</p>
          <p className="mt-2 text-3xl font-black font-headline text-on-background">{plans.length}</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-surface-lowest p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Gói đang hoạt động</p>
          <p className="mt-2 text-3xl font-black font-headline text-tertiary">
            {plans.filter((plan) => plan.isActive).length}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-surface-lowest p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Thành viên đang sử dụng</p>
          <p className="mt-2 text-3xl font-black font-headline text-primary">{totalSubscribers}</p>
        </div>
      </div>

      {plans.length === 0 && !isLoading ? (
        <div className="rounded-2xl border border-neutral-200 bg-surface-lowest p-10 text-center text-sm text-neutral-500">
          Chưa có gói thành viên nào.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-3xl border border-neutral-200 bg-surface-lowest p-6 shadow-sm transition-colors hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-surface-low px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-600">
                      {getMembershipTierLabel(plan.tier)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                        plan.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {plan.isActive ? 'Đang hoạt động' : 'Tạm ẩn'}
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-black font-headline text-on-background">
                    {plan.name}
                  </h3>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
                    Giá/tháng
                  </p>
                  <p className="mt-2 text-2xl font-black text-primary">
                    {formatCurrency(plan.monthlyPrice)}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 text-sm">
                <div className="flex items-center justify-between rounded-2xl bg-surface-low px-4 py-3">
                  <span className="text-neutral-500">Thành viên đang dùng</span>
                  <strong>{plan.activeSubscribers}</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-surface-low px-4 py-3">
                  <span className="text-neutral-500">Giảm giá bàn</span>
                  <strong>{plan.tableDiscountPercent}%</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-surface-low px-4 py-3">
                  <span className="text-neutral-500">Đặt trước</span>
                  <strong>{getAdvanceWindowLabel(plan.maxAdvanceBookingDays)}</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-surface-low px-4 py-3">
                  <span className="text-neutral-500">Buổi HLV miễn phí</span>
                  <strong>{plan.freeCoachingSessionsPerMonth} buổi/tháng</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-surface-low px-4 py-3">
                  <span className="text-neutral-500">Ưu tiên đặt chỗ</span>
                  <strong>{plan.priorityBooking ? 'Bật' : 'Tắt'}</strong>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
                Một số quyền lợi đã hiển thị nhưng chưa tự động trừ ngay. Hệ thống sẽ cập nhật
                trong các phiên bản tiếp theo.
              </div>

              <div className="mt-6 flex gap-3 border-t border-neutral-100 pt-4">
                <button
                  onClick={() => handleOpenModal(plan)}
                  className="flex-1 rounded-xl bg-surface-low py-3 text-sm font-bold transition-colors hover:bg-neutral-200"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(plan)}
                  className="flex-1 rounded-xl bg-red-50 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
                >
                  Xóa
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  {editingPlanId !== null ? 'Cập nhật gói' : 'Tạo gói mới'}
                </p>
                <h3 className="mt-2 text-2xl font-black font-headline text-on-background">
                  {editingPlanId !== null ? 'Sửa gói thành viên' : 'Thêm gói thành viên'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-full bg-surface-low p-2 text-neutral-500 transition-colors hover:text-black"
                aria-label="Đóng biểu mẫu gói thành viên"
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="membershipName" className="mb-1 block text-sm font-medium text-neutral-700">
                  Tên gói
                </label>
                <input
                  id="membershipName"
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="membershipTier" className="mb-1 block text-sm font-medium text-neutral-700">
                  Hạng gói
                </label>
                <select
                  id="membershipTier"
                  value={formData.tier}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      tier: event.target.value as AdminUpsertMembershipPlanRequest['tier'],
                    })
                  }
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:border-primary focus:outline-none"
                >
                  <option value="Free">Miễn phí</option>
                  <option value="Silver">Bạc</option>
                  <option value="Gold">Vàng</option>
                </select>
              </div>

              <div>
                <label htmlFor="membershipPrice" className="mb-1 block text-sm font-medium text-neutral-700">
                  Giá mỗi tháng
                </label>
                <input
                  id="membershipPrice"
                  type="number"
                  min={0}
                  value={formData.monthlyPrice}
                  onChange={(event) =>
                    setFormData({ ...formData, monthlyPrice: Number(event.target.value) })
                  }
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="membershipDiscount" className="mb-1 block text-sm font-medium text-neutral-700">
                  Giảm giá bàn (%)
                </label>
                <input
                  id="membershipDiscount"
                  type="number"
                  min={0}
                  value={formData.tableDiscountPercent}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      tableDiscountPercent: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="membershipAdvanceDays" className="mb-1 block text-sm font-medium text-neutral-700">
                  Đặt trước tối đa (ngày)
                </label>
                <input
                  id="membershipAdvanceDays"
                  type="number"
                  min={0}
                  value={formData.maxAdvanceBookingDays}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      maxAdvanceBookingDays: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="membershipFreeCoaching" className="mb-1 block text-sm font-medium text-neutral-700">
                  Buổi HLV miễn phí/tháng
                </label>
                <input
                  id="membershipFreeCoaching"
                  type="number"
                  min={0}
                  value={formData.freeCoachingSessionsPerMonth}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      freeCoachingSessionsPerMonth: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700">
                <input
                  type="checkbox"
                  checked={formData.priorityBooking}
                  onChange={(event) =>
                    setFormData({ ...formData, priorityBooking: event.target.checked })
                  }
                />
                Ưu tiên đặt chỗ
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(event) => setFormData({ ...formData, isActive: event.target.checked })}
                />
                Gói đang hoạt động
              </label>

              <div className="mt-2 flex gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editingPlanId !== null ? 'Lưu thay đổi' : 'Tạo gói'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
