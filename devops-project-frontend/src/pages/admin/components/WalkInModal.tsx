import React, { useState } from 'react';
import { AdminModal } from './AdminModal';
import { AdminTable } from '../../../types';
import { adminService } from '../../../services/adminService';

interface WalkInModalProps {
  isOpen: boolean;
  onClose: (success: boolean) => void;
  table: AdminTable | null;
}

export const WalkInModal = ({ isOpen, onClose, table }: WalkInModalProps) => {
  const [guestName, setGuestName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!table) return;

    setIsSubmitting(true);
    setError('');

    try {
      await adminService.startWalkIn(table.id, {
        guestName: guestName.trim() || 'Khách vãng lai',
      });
      setGuestName('');
      onClose(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi bắt đầu phiên vãng lai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!table) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={() => onClose(false)}
      title={`Bắt đầu lượt vãng lai - Bàn ${table.tableNumber}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Tên khách (tùy chọn)
          </label>
          <input
            type="text"
            placeholder="Nhập tên khách..."
            className="w-full rounded-2xl border border-neutral-200 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
          />
          <p className="mt-1 text-xs leading-6 text-neutral-500">
            Nếu để trống, hệ thống sẽ lưu là &quot;Khách vãng lai&quot;.
          </p>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="flex-1 rounded-xl bg-neutral-100 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-container disabled:opacity-50"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Bắt đầu tính giờ'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
};
