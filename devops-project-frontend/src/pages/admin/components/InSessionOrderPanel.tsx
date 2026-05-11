import React, { useEffect, useMemo, useState } from 'react';
import { X, Coffee, Minus, Plus } from 'lucide-react';
import { fnbService } from '../../../services/fnbService';
import { adminService } from '../../../services/adminService';
import { AdminTable, FnBMenuItem } from '../../../types';
import { getFnBCategoryLabel } from '../../../utils/labels';

interface InSessionOrderPanelProps {
  isOpen: boolean;
  onClose: () => void;
  table?: AdminTable | null;
  sessionId?: string | null;
}

type DraftOrderItem = {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
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

export const InSessionOrderPanel = ({
  isOpen,
  onClose,
  table,
  sessionId,
}: InSessionOrderPanelProps) => {
  const [menuItems, setMenuItems] = useState<FnBMenuItem[]>([]);
  const [order, setOrder] = useState<DraftOrderItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setOrder([]);
    setError('');
    setLoading(true);

    fnbService
      .getMenuItems()
      .then((items) => {
        setMenuItems(items.filter((item) => item.isAvailable));
      })
      .catch((loadError) => {
        setError(getErrorMessage(loadError, 'Không thể tải thực đơn F&B lúc này.'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen]);

  const total = useMemo(
    () => order.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [order],
  );

  if (!isOpen) {
    return null;
  }

  const handleAdd = (item: FnBMenuItem) => {
    setOrder((previous) => {
      const existing = previous.find((entry) => entry.menuItemId === item.id);
      if (existing) {
        return previous.map((entry) =>
          entry.menuItemId === item.id
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry,
        );
      }

      return [
        ...previous,
        { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 },
      ];
    });
  };

  const handleRemove = (id: number) => {
    setOrder((previous) => {
      const existing = previous.find((entry) => entry.menuItemId === id);
      if (!existing) {
        return previous;
      }

      if (existing.quantity > 1) {
        return previous.map((entry) =>
          entry.menuItemId === id ? { ...entry, quantity: entry.quantity - 1 } : entry,
        );
      }

      return previous.filter((entry) => entry.menuItemId !== id);
    });
  };

  const handleSubmit = async () => {
    if (!sessionId || order.length === 0) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await adminService.addSessionFnB(
        sessionId,
        order.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
      );
      onClose();
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Không thể thêm món cho phiên này.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-right fixed inset-y-0 right-0 z-[70] flex w-96 flex-col border-l border-neutral-200 bg-white shadow-2xl duration-300">
      <div className="flex items-center justify-between border-b bg-neutral-50 p-6 text-neutral-900">
        <div>
          <h2 className="font-headline text-lg font-bold tracking-tight">
            {table?.tableNumber || 'Bàn đang sử dụng'}
          </h2>
          <p className="text-sm text-neutral-500">
            Khách: {table?.currentCustomerName || 'Khách vãng lai'}
          </p>
        </div>
        <button
          aria-label="Đóng bảng gọi món"
          title="Đóng"
          onClick={onClose}
          className="rounded-full border border-neutral-200 bg-white p-2 text-neutral-500 shadow-sm hover:text-black"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <h3 className="flex items-center gap-2 font-headline text-lg font-semibold text-neutral-700">
          <Coffee size={16} />
          Chọn món trong thực đơn
        </h3>

        {error && (
          <div className="rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">
            {error}
          </div>
        )}

        {!sessionId && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Không tìm thấy phiên đang hoạt động cho bàn này.
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-neutral-100 p-4 text-sm text-neutral-500">
            Đang tải thực đơn F&amp;B...
          </div>
        ) : (
          <div className="space-y-3">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50"
              >
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                    {getFnBCategoryLabel(item.category)}
                  </p>
                  <p className="text-xs font-bold text-primary">
                    {item.price?.toLocaleString()}đ
                  </p>
                </div>
                <button
                  aria-label={`Thêm ${item.name}`}
                  title={`Thêm ${item.name}`}
                  onClick={() => handleAdd(item)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition-colors hover:bg-primary hover:text-white"
                >
                  <Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 border-t bg-neutral-50 p-6">
        {order.length > 0 && (
          <div className="max-h-32 space-y-2 overflow-y-auto">
            <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Hóa đơn F&amp;B
            </h4>
            {order.map((item) => (
              <div key={item.menuItemId} className="flex items-center justify-between text-sm">
                <span className="flex-1">{item.name}</span>
                <div className="flex w-24 items-center justify-center gap-2">
                  <button
                    aria-label={`Giảm số lượng ${item.name}`}
                    title={`Giảm số lượng ${item.name}`}
                    onClick={() => handleRemove(item.menuItemId)}
                    className="rounded bg-white p-1 shadow-sm hover:bg-neutral-200"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-4 text-center font-medium">{item.quantity}</span>
                  <button
                    aria-label={`Tăng số lượng ${item.name}`}
                    title={`Tăng số lượng ${item.name}`}
                    onClick={() => {
                      const menuItem = menuItems.find((entry) => entry.id === item.menuItemId);
                      if (menuItem) {
                        handleAdd(menuItem);
                      }
                    }}
                    className="rounded bg-white p-1 shadow-sm hover:bg-neutral-200"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-neutral-200 pt-2">
          <span className="font-semibold">Tổng tạm tính:</span>
          <span className="text-xl font-bold text-primary">{total.toLocaleString()}đ</span>
        </div>
        <button
          onClick={() => void handleSubmit()}
          disabled={!sessionId || order.length === 0 || submitting}
          className="w-full rounded-xl bg-primary py-3 font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Đang gửi món...' : 'Gửi yêu cầu'}
        </button>
      </div>
    </div>
  );
};
