import React, { useEffect, useState } from 'react';
import {
  Plus,
  MoreVertical,
  Edit,
  AlertCircle,
  CheckCircle2,
  Star,
  Users,
  Calendar,
  Trash2,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { AdminModal } from '../components/AdminModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getCoachSpecialtyLabel } from '../../../utils/labels';

interface CoachRecord {
  id: string;
  fullName: string;
  email: string;
  specialty?: string;
  bio?: string;
  hourlyRate: number;
  photoUrl?: string;
  isActive: boolean;
  rating?: number;
  totalSessions?: number;
}

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1542382103-68d1f7dcf7da';

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

export const CoachesView = () => {
  const [coaches, setCoaches] = useState<CoachRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const initialForm = {
    fullName: '',
    email: '',
    specialty: 'Pool',
    bio: '',
    hourlyRate: 0,
    photoUrl: '',
    isActive: true,
  };

  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await adminService.getCoaches();
      setCoaches(Array.isArray(response) ? response : []);
    } catch (error) {
      setCoaches([]);
      setLoadError(getErrorMessage(error, 'Không thể tải danh sách huấn luyện viên.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const totalCoaches = coaches.length;
  const activeCoaches = coaches.filter((coach) => coach.isActive).length;
  const avgRating = totalCoaches
    ? (
        coaches.reduce((sum, coach) => sum + (Number(coach.rating) || 0), 0) / totalCoaches
      ).toFixed(1)
    : '0';
  const totalSessions = coaches.reduce((sum, coach) => sum + (coach.totalSessions ?? 0), 0);
  const featuredCoach =
    coaches.length > 0
      ? coaches.reduce((best, coach) =>
          (Number(coach.rating) || 0) > (Number(best.rating) || 0) ? coach : best,
        )
      : null;

  const openCreate = () => {
    setFormData(initialForm);
    setEditingId(null);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openEdit = (coach: CoachRecord) => {
    setFormData({
      fullName: coach.fullName,
      email: coach.email,
      specialty: coach.specialty || 'Pool',
      bio: coach.bio || '',
      hourlyRate: coach.hourlyRate,
      photoUrl: coach.photoUrl || '',
      isActive: coach.isActive,
    });
    setEditingId(coach.id);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      specialty: formData.specialty,
      bio: formData.bio.trim(),
      hourlyRate: Number(formData.hourlyRate),
      photoUrl: formData.photoUrl.trim(),
      isActive: formData.isActive,
    };

    try {
      if (editingId) {
        await adminService.updateCoach(editingId, payload);
        setFeedback({ type: 'success', message: 'Đã cập nhật hồ sơ huấn luyện viên.' });
      } else {
        await adminService.createCoach(payload);
        setFeedback({
          type: 'success',
          message:
            'Đã tạo tài khoản huấn luyện viên. Hệ thống sẽ tạo mật khẩu tạm cho tài khoản mới. Sau khi tạo, vui lòng gửi hướng dẫn đổi mật khẩu cho huấn luyện viên.',
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Không thể lưu thông tin huấn luyện viên.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await adminService.deleteCoach(deletingId);
      setIsDeleteOpen(false);
      setDeletingId(null);
      setFeedback({ type: 'success', message: 'Đã gỡ huấn luyện viên khỏi danh sách.' });
      await loadData();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Không thể xóa huấn luyện viên này.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (coach: CoachRecord) => {
    setFeedback(null);

    try {
      await adminService.updateCoach(coach.id, {
        fullName: coach.fullName,
        email: coach.email,
        specialty: coach.specialty,
        bio: coach.bio,
        hourlyRate: coach.hourlyRate,
        photoUrl: coach.photoUrl,
        isActive: !coach.isActive,
      });

      setFeedback({
        type: 'success',
        message: `${coach.fullName} hiện ${coach.isActive ? 'đã tạm nghỉ' : 'đang hoạt động'}.`,
      });
      await loadData();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Không thể cập nhật trạng thái huấn luyện viên.'),
      });
    }
  };

  return (
    <div className="animate-in fade-in space-y-6 p-8 duration-500">
      {loadError && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>Không thể tải dữ liệu huấn luyện viên: {loadError}</span>
          <button onClick={() => void loadData()} className="font-medium underline">
            Thử lại
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">
        {[
          {
            label: 'Tổng số HLV',
            value: totalCoaches,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Đang hoạt động',
            value: activeCoaches,
            icon: CheckCircle2,
            color: 'text-tertiary',
            bg: 'bg-teal-50',
          },
          {
            label: 'Đánh giá TB',
            value: `${avgRating}/5`,
            icon: Star,
            color: 'text-amber-500',
            bg: 'bg-amber-50',
          },
          {
            label: 'Số buổi dạy',
            value: totalSessions,
            icon: Calendar,
            color: 'text-primary',
            bg: 'bg-red-50',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="flex items-center gap-4 rounded-2xl border border-neutral-100 bg-surface-lowest p-6 shadow-sm"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${kpi.bg} ${kpi.color}`}
            >
              <kpi.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">{kpi.label}</p>
              <h3 className="font-headline text-2xl font-bold text-neutral-900">
                {kpi.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 overflow-hidden rounded-2xl border border-neutral-100 bg-surface-lowest shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 p-6">
            <h3 className="font-headline text-lg font-bold">Danh sách huấn luyện viên</h3>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              <Plus size={16} /> Thêm HLV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-50/50 text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="p-4 font-medium">HLV</th>
                  <th className="p-4 font-medium">Chuyên môn</th>
                  <th className="p-4 font-medium">Đánh giá</th>
                  <th className="p-4 font-medium">Phí / giờ</th>
                  <th className="p-4 font-medium">Trạng thái</th>
                  <th className="p-4 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-400">
                      Đang tải danh sách huấn luyện viên...
                    </td>
                  </tr>
                ) : coaches.length > 0 ? (
                  coaches.map((coach) => (
                    <tr
                      key={coach.id}
                      className="border-b border-neutral-100 transition-colors hover:bg-neutral-50/50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={coach.photoUrl || DEFAULT_AVATAR}
                            alt={coach.fullName}
                            className="h-10 w-10 rounded-full border border-neutral-200 object-cover"
                          />
                          <div>
                            <p className="font-medium text-neutral-900">{coach.fullName}</p>
                            <p className="text-xs text-neutral-500">{coach.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center rounded bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600">
                          {getCoachSpecialtyLabel(coach.specialty)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 font-medium text-neutral-900">
                          <Star size={14} className="fill-amber-400 text-amber-400" />
                          {Number(coach.rating || 0).toFixed(1)}{' '}
                          <span className="font-normal text-neutral-400">
                            ({coach.totalSessions ?? 0})
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-medium">
                        {coach.hourlyRate?.toLocaleString()}đ
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => void toggleStatus(coach)}
                          className="flex items-center gap-2"
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${
                              coach.isActive ? 'bg-tertiary' : 'bg-neutral-400'
                            }`}
                          ></div>
                          <span
                            className={`text-xs font-medium ${
                              coach.isActive ? 'text-tertiary' : 'text-neutral-500'
                            }`}
                          >
                            {coach.isActive ? 'Hoạt động' : 'Tạm nghỉ'}
                          </span>
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-3 text-neutral-400">
                          <button
                            onClick={() => openEdit(coach)}
                            className="transition-colors hover:text-primary"
                            title="Sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingId(coach.id);
                              setIsDeleteOpen(true);
                            }}
                            className="transition-colors hover:text-primary"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-400">
                      Chưa có huấn luyện viên nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col items-center rounded-2xl border border-neutral-100 bg-surface-lowest p-6 text-center shadow-sm">
          <div className="mb-6 flex w-full items-start justify-between">
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-500">
              <Star size={12} className="fill-amber-500" /> HLV nổi bật
            </span>
            <button
              type="button"
              className="text-neutral-400 hover:text-neutral-900"
              aria-label="Tùy chọn huấn luyện viên nổi bật"
              title="Tùy chọn"
            >
              <MoreVertical size={16} />
            </button>
          </div>
          {featuredCoach ? (
            <>
              <div className="relative mb-4">
                <img
                  src={featuredCoach.photoUrl || DEFAULT_AVATAR}
                  alt={featuredCoach.fullName}
                  className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-sm"
                />
                <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-tertiary text-white shadow-sm">
                  <CheckCircle2 size={14} />
                </div>
              </div>
              <h4 className="font-headline text-xl font-bold">{featuredCoach.fullName}</h4>
              <p className="mb-4 text-sm text-neutral-500">
                Chuyên môn: {getCoachSpecialtyLabel(featuredCoach.specialty)}
              </p>
              <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Hệ thống sẽ tạo mật khẩu tạm cho tài khoản mới. Sau khi tạo, vui lòng gửi hướng
                dẫn đổi mật khẩu cho huấn luyện viên.
              </p>

              <div className="mt-auto grid w-full grid-cols-2 gap-4 border-t border-neutral-100 pt-6">
                <div>
                  <p className="mb-1 text-xs text-neutral-400">Đánh giá</p>
                  <p className="text-lg font-bold">
                    {Number(featuredCoach.rating || 0).toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-neutral-400">Buổi dạy</p>
                  <p className="text-lg font-bold">{featuredCoach.totalSessions ?? 0}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-10 text-sm text-neutral-500">
              Chưa có dữ liệu huấn luyện viên.
            </div>
          )}
        </div>
      </div>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Sửa thông tin HLV' : 'Thêm HLV mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="coachFullName" className="mb-1 block text-sm font-medium text-neutral-700">
                Họ tên
              </label>
              <input
                id="coachFullName"
                required
                type="text"
                value={formData.fullName}
                onChange={(event) =>
                  setFormData({ ...formData, fullName: event.target.value })
                }
                className="w-full rounded-md border border-neutral-200 bg-surface-lowest px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label htmlFor="coachEmail" className="mb-1 block text-sm font-medium text-neutral-700">
                Email
              </label>
              <input
                id="coachEmail"
                required
                type="email"
                value={formData.email}
                onChange={(event) =>
                  setFormData({ ...formData, email: event.target.value })
                }
                className="w-full rounded-md border border-neutral-200 bg-surface-lowest px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="hlv@cuemasters.vn"
              />
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <AlertCircle size={16} />
              Mật khẩu tạm cho tài khoản mới
            </div>
            <p>
              Hệ thống sẽ tạo mật khẩu tạm cho tài khoản mới. Sau khi tạo, vui lòng gửi hướng dẫn
              đổi mật khẩu cho huấn luyện viên.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="coachSpecialty" className="mb-1 block text-sm font-medium text-neutral-700">
                Chuyên môn
              </label>
              <select
                id="coachSpecialty"
                value={formData.specialty}
                onChange={(event) =>
                  setFormData({ ...formData, specialty: event.target.value })
                }
                className="w-full rounded-md border border-neutral-200 bg-surface-lowest px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="Pool">Bida lỗ</option>
                <option value="Snooker">Snooker</option>
                <option value="Carom">Carom</option>
              </select>
            </div>
            <div>
              <label htmlFor="coachHourlyRate" className="mb-1 block text-sm font-medium text-neutral-700">
                Phí / giờ (VND)
              </label>
              <input
                id="coachHourlyRate"
                required
                type="number"
                min="0"
                step="10000"
                value={formData.hourlyRate}
                onChange={(event) =>
                  setFormData({ ...formData, hourlyRate: Number(event.target.value) })
                }
                className="w-full rounded-md border border-neutral-200 bg-surface-lowest px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="coachBio" className="mb-1 block text-sm font-medium text-neutral-700">
              Tiểu sử
            </label>
            <textarea
              id="coachBio"
              rows={3}
              value={formData.bio}
              onChange={(event) => setFormData({ ...formData, bio: event.target.value })}
              className="w-full rounded-md border border-neutral-200 bg-surface-lowest px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Kinh nghiệm, thành tích..."
            />
          </div>

          <div>
            <label htmlFor="coachPhotoUrl" className="mb-1 block text-sm font-medium text-neutral-700">
              Link ảnh avatar
            </label>
            <input
              id="coachPhotoUrl"
              type="text"
              value={formData.photoUrl}
              onChange={(event) =>
                setFormData({ ...formData, photoUrl: event.target.value })
              }
              className="w-full rounded-md border border-neutral-200 bg-surface-lowest px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="https://"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveCoach"
              checked={formData.isActive}
              onChange={(event) =>
                setFormData({ ...formData, isActive: event.target.checked })
              }
              className="rounded text-primary focus:ring-primary"
            />
            <label htmlFor="isActiveCoach" className="text-sm font-medium text-neutral-700">
              Đang hoạt động và hiển thị cho khách
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingId(null);
        }}
        onConfirm={handleDelete}
        title="Xóa huấn luyện viên"
        message="Bạn có chắc muốn xóa huấn luyện viên này không? Dữ liệu sẽ không thể khôi phục."
      />
    </div>
  );
};
