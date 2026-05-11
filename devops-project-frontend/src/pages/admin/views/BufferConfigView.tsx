import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { BufferConfig, TableType, UpsertBufferConfigRequest } from '../../../types';
import { AdminModal } from '../components/AdminModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getDayOfWeekLabel, getTableTypeLabel } from '../../../utils/labels';

const DAYS = [
  { label: 'Tất cả các ngày', value: '' },
  { label: 'Chủ nhật', value: '0' },
  { label: 'Thứ hai', value: '1' },
  { label: 'Thứ ba', value: '2' },
  { label: 'Thứ tư', value: '3' },
  { label: 'Thứ năm', value: '4' },
  { label: 'Thứ sáu', value: '5' },
  { label: 'Thứ bảy', value: '6' },
];

const emptyForm = {
  tableType: 'Pool' as TableType,
  dayOfWeek: '',
  timeFrom: '',
  timeTo: '',
  bufferCount: 1,
  isActive: true,
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

const normalizeTime = (value?: string | null) => (value ? value.slice(0, 5) : '');

const describeScope = (config: BufferConfig) => {
  const dayLabel = getDayOfWeekLabel(config.dayOfWeek, {
    allDaysLabel: 'Tất cả các ngày',
  });
  const timeLabel =
    config.timeFrom && config.timeTo
      ? `${normalizeTime(config.timeFrom)} - ${normalizeTime(config.timeTo)}`
      : 'Cả ngày';
  return `${dayLabel} / ${timeLabel}`;
};

export const BufferConfigView = () => {
  const [configs, setConfigs] = useState<BufferConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<BufferConfig | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<BufferConfig | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadConfigs = async () => {
    setIsLoading(true);

    try {
      const response = await adminService.getBufferConfigs();
      setConfigs(Array.isArray(response) ? response : []);
    } catch (error) {
      setConfigs([]);
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Không thể tải thiết lập bàn dự phòng.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadConfigs();
  }, []);

  const groupedSummary = useMemo(() => {
    return (['Pool', 'Snooker', 'Carom'] as TableType[]).map((tableType) => ({
      tableType,
      totalRules: configs.filter((config) => config.tableType === tableType).length,
      activeRules: configs.filter(
        (config) => config.tableType === tableType && config.isActive,
      ).length,
    }));
  }, [configs]);

  const openCreate = () => {
    setEditingConfig(null);
    setFormData(emptyForm);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openEdit = (config: BufferConfig) => {
    setEditingConfig(config);
    setFormData({
      tableType: config.tableType,
      dayOfWeek: config.dayOfWeek == null ? '' : String(config.dayOfWeek),
      timeFrom: normalizeTime(config.timeFrom),
      timeTo: normalizeTime(config.timeTo),
      bufferCount: config.bufferCount,
      isActive: config.isActive,
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const buildPayload = (): UpsertBufferConfigRequest => ({
    tableType: formData.tableType,
    dayOfWeek: formData.dayOfWeek === '' ? null : Number(formData.dayOfWeek),
    timeFrom: formData.timeFrom || null,
    timeTo: formData.timeTo || null,
    bufferCount: Number(formData.bufferCount),
    isActive: formData.isActive,
  });

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = buildPayload();
      if (editingConfig) {
        await adminService.updateBufferConfig(editingConfig.id, payload);
        setFeedback({ type: 'success', message: 'Đã cập nhật quy tắc bàn dự phòng.' });
      } else {
        await adminService.createBufferConfig(payload);
        setFeedback({ type: 'success', message: 'Đã tạo quy tắc bàn dự phòng mới.' });
      }

      setIsModalOpen(false);
      await loadConfigs();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Không thể lưu quy tắc bàn dự phòng.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingConfig) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await adminService.deleteBufferConfig(deletingConfig.id);
      setDeletingConfig(null);
      setFeedback({ type: 'success', message: 'Đã xóa quy tắc bàn dự phòng.' });
      await loadConfigs();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Không thể xóa quy tắc bàn dự phòng.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in space-y-6 p-8 duration-500">
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

      <div className="grid grid-cols-3 gap-6">
        {groupedSummary.map((group) => (
          <div
            key={group.tableType}
            className="rounded-2xl border border-neutral-100 bg-surface-lowest p-6 shadow-sm"
          >
            <p className="mb-2 text-sm font-medium text-neutral-500">
              {getTableTypeLabel(group.tableType)}
            </p>
            <h3 className="font-headline text-2xl font-bold text-neutral-900">
              {group.activeRules}
            </h3>
            <p className="text-xs text-neutral-400">
              {group.totalRules} quy tắc đang cấu hình
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-surface-lowest shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 p-6">
          <div>
            <h3 className="font-headline text-lg font-bold">Thiết lập bàn dự phòng cho đặt online</h3>
            <p className="mt-1 text-sm leading-7 text-neutral-500">
              Giữ lại số bàn dự phòng theo loại bàn, ngày trong tuần và khung giờ cụ thể.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void loadConfigs()}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              <RefreshCw size={16} />
              Làm mới
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Plus size={16} />
              Thêm quy tắc
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50/50 text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="p-4 font-medium">Loại bàn</th>
                <th className="p-4 font-medium">Phạm vi áp dụng</th>
                <th className="p-4 font-medium">Số bàn dự phòng</th>
                <th className="p-4 font-medium">Trạng thái</th>
                <th className="p-4 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-400">
                    Đang tải thiết lập bàn dự phòng...
                  </td>
                </tr>
              ) : configs.length > 0 ? (
                configs.map((config) => (
                  <tr
                    key={config.id}
                    className="border-b border-neutral-100 transition-colors hover:bg-neutral-50/50"
                  >
                    <td className="p-4 font-medium text-neutral-900">
                      {getTableTypeLabel(config.tableType)}
                    </td>
                    <td className="p-4 text-neutral-600">{describeScope(config)}</td>
                    <td className="p-4 font-medium text-neutral-900">{config.bufferCount}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          config.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {config.isActive ? 'Đang áp dụng' : 'Tạm tắt'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-3 text-neutral-400">
                        <button
                          type="button"
                          onClick={() => openEdit(config)}
                          className="transition-colors hover:text-primary"
                          title="Sửa quy tắc"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingConfig(config)}
                          className="transition-colors hover:text-red-500"
                          title="Xóa quy tắc"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-400">
                    Chưa có quy tắc bàn dự phòng nào được thiết lập.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingConfig ? 'Chỉnh sửa quy tắc bàn dự phòng' : 'Tạo quy tắc bàn dự phòng'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm font-medium text-neutral-700">
              Loại bàn
              <select
                value={formData.tableType}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    tableType: event.target.value as TableType,
                  }))
                }
                className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="Pool">Pool</option>
                <option value="Snooker">Snooker</option>
                <option value="Carom">Carom</option>
              </select>
            </label>
            <label className="text-sm font-medium text-neutral-700">
              Số bàn dự phòng
              <input
                required
                min={0}
                type="number"
                value={formData.bufferCount}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    bufferCount: Number(event.target.value),
                  }))
                }
                className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <label className="text-sm font-medium text-neutral-700">
              Ngày áp dụng
              <select
                value={formData.dayOfWeek}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, dayOfWeek: event.target.value }))
                }
                className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {DAYS.map((day) => (
                  <option key={day.label} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-neutral-700">
              Từ giờ
              <input
                type="time"
                value={formData.timeFrom}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, timeFrom: event.target.value }))
                }
                className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </label>
            <label className="text-sm font-medium text-neutral-700">
              Đến giờ
              <input
                type="time"
                value={formData.timeTo}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, timeTo: event.target.value }))
                }
                className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(event) =>
                setFormData((current) => ({ ...current, isActive: event.target.checked }))
              }
            />
            Quy tắc đang được áp dụng
          </label>

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
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Đang lưu...'
                : editingConfig
                  ? 'Cập nhật quy tắc'
                  : 'Tạo quy tắc'}
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmDialog
        isOpen={!!deletingConfig}
        onClose={() => setDeletingConfig(null)}
        onConfirm={handleDelete}
        title="Xóa quy tắc bàn dự phòng"
        message="Bạn có chắc muốn xóa quy tắc bàn dự phòng cho đặt online này không?"
      />
    </div>
  );
};
