import React, { useEffect, useState } from 'react';
import { Clock, Users } from 'lucide-react';
import { AdminTable } from '../../../types';
import { getTableStatusLabel, getTableTypeLabel } from '../../../utils/labels';

const formatElapsed = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours} giờ ${remainingMinutes} phút` : `${remainingMinutes} phút`;
};

interface TableCardProps {
  table: AdminTable;
  onClick?: (table: AdminTable) => void;
  onCheckout?: (sessionId: string, table: AdminTable) => void;
  onWalkin?: (table: AdminTable) => void;
  hasPending?: boolean;
  onCheckinOnline?: (table: AdminTable) => void;
}

export const TableCard = ({
  table,
  onClick,
  onCheckout,
  onWalkin,
  hasPending = false,
  onCheckinOnline,
}: TableCardProps) => {
  const status = table.displayStatus;
  const customerName =
    status === 'Reserved' ? table.nextCustomerName : table.currentCustomerName;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== 'InUse' || !table.currentSessionStartedAt) {
      return;
    }

    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, [status, table.currentSessionStartedAt]);

  let statusColor = 'border-neutral-200';
  let badgeColor = 'bg-neutral-100 text-neutral-500';

  if (status === 'InUse') {
    statusColor = 'border-primary';
    badgeColor = 'bg-red-50 text-primary';
  } else if (status === 'Available') {
    statusColor = 'border-tertiary';
    badgeColor = 'bg-teal-50 text-tertiary';
  } else if (status === 'Reserved') {
    statusColor = 'border-amber-500';
    badgeColor = 'bg-amber-50 text-amber-600';
  } else if (status === 'Maintenance') {
    statusColor = 'border-neutral-300';
    badgeColor = 'bg-neutral-100 text-neutral-600';
  }

  return (
    <div
      onClick={() => {
        if (status === 'InUse' && table.activeSessionId) {
          onClick?.(table);
        }
      }}
      className={`relative flex cursor-pointer flex-col rounded-2xl border-2 bg-surface-lowest p-4 transition-all hover:shadow-md ${statusColor}`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h4 className="font-bold text-neutral-900">{table.tableNumber}</h4>
          <p className="text-xs text-neutral-500">{getTableTypeLabel(table.type)}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${badgeColor}`}>
          {getTableStatusLabel(status)}
        </span>
      </div>

      <div className="mb-4 mt-auto space-y-2">
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-1 text-neutral-500">
            <Clock size={14} />
            {status === 'Reserved' ? 'Giờ đến' : 'Bắt đầu'}
          </span>
          <span className="font-medium text-neutral-900">
            {status === 'Reserved'
              ? table.nextBookingStartTime
                ? new Date(table.nextBookingStartTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '--:--'
              : table.currentSessionStartedAt
                ? new Date(table.currentSessionStartedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '--:--'}
          </span>
        </div>

        {status === 'InUse' && table.currentSessionStartedAt && (
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Đã chơi</span>
            <span className="font-bold text-primary">
              {formatElapsed(
                Math.max(
                  0,
                  Math.floor((now - new Date(table.currentSessionStartedAt).getTime()) / 60000),
                ),
              )}
            </span>
          </div>
        )}

        {customerName && (
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1 text-neutral-500">
              <Users size={14} />
              Khách
            </span>
            <span className="max-w-[120px] truncate font-medium text-neutral-900">
              {customerName}
            </span>
          </div>
        )}

        {status === 'Reserved' && !table.nextCustomerName && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-700">
            Lượt đặt theo loại bàn. Nhân viên sẽ gán bàn khi khách làm thủ tục nhận bàn.
          </div>
        )}

        {(table.currentSessionAmount ?? 0) > 0 && (
          <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 text-sm">
            <span className="text-neutral-500">Tạm tính</span>
            <span className="font-bold text-primary">
              {`${table.currentSessionAmount?.toLocaleString()}đ`}
            </span>
          </div>
        )}
      </div>

      {status === 'InUse' && table.activeSessionId && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onCheckout?.(table.activeSessionId!, table);
          }}
          className="mt-2 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-600"
        >
          Thanh toán
        </button>
      )}

      {status === 'Available' && (
        <div className="mt-2 flex gap-2">
          {hasPending && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onCheckinOnline?.(table);
              }}
              className="flex-1 whitespace-nowrap rounded-xl bg-amber-600 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-700"
            >
              Chờ xếp
            </button>
          )}
          <button
            onClick={(event) => {
              event.stopPropagation();
              onWalkin?.(table);
            }}
            className="flex-1 whitespace-nowrap rounded-xl bg-neutral-800 py-2 text-sm font-bold text-white transition-colors hover:bg-neutral-700"
          >
            Vãng lai
          </button>
        </div>
      )}
    </div>
  );
};
