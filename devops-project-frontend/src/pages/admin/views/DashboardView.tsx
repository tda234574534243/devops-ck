import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Coffee } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { useSignalR } from '../../../hooks/useSignalR';
import { AdminBooking, AdminDashboardStats, AdminTable, UpcomingWarning } from '../../../types';
import { TableCard } from '../components/TableCard';
import { InSessionOrderPanel } from '../components/InSessionOrderPanel';
import { CheckoutPanel } from '../components/CheckoutPanel';
import { getTableTypeLabel } from '../../../utils/labels';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const getTodayRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
};

const formatClockTime = (value?: string | null) => {
  if (!value) return '--:--';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (typeof (error as any).response?.data?.message === 'string' ||
      typeof (error as any).response?.data?.Message === 'string')
  ) {
    return (error as any).response?.data?.message || (error as any).response?.data?.Message || fallbackMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

const enrichTablesWithActiveSessions = (
  tables: AdminTable[],
  snapshot: Awaited<ReturnType<typeof adminService.getFloorPlanSnapshot>>,
) => {
  const activeSessionsByTableId = new Map(snapshot.tables.map((table) => [table.tableId, table.activeSessionId ?? null]));

  return tables.map((table) => ({
    ...table,
    activeSessionId: activeSessionsByTableId.get(table.id) ?? null,
  }));
};

export const DashboardView = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [adminTables, setAdminTables] = useState<AdminTable[]>([]);
  const [warnings, setWarnings] = useState<UpcomingWarning[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderPanelTable, setOrderPanelTable] = useState<AdminTable | null>(null);
  const [checkoutTable, setCheckoutTable] = useState<AdminTable | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      const today = getTodayDate();
      const todayRange = getTodayRange();
      const [statsData, bookingsData, tablesData, snapshot, warningsData] = await Promise.all([
        adminService.getStats(todayRange),
        adminService.getBookings({ page: 1, pageSize: 200 }),
        adminService.getTables(),
        adminService.getFloorPlanSnapshot(today),
        adminService.getUpcomingWarnings(),
      ]);

      setStats(statsData);
      setBookings(bookingsData.items || []);
      setAdminTables(enrichTablesWithActiveSessions(tablesData, snapshot));
      setWarnings(warningsData || []);
      setError('');
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Không thể tải dữ liệu bảng điều khiển lúc này.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useSignalR({
    floorPlanDate: getTodayDate(),
    onTableStatusChanged: () => {
      void fetchData();
    },
    onCategoryCapacityChanged: () => {
      void fetchData();
    },
    onBookingAssigned: () => {
      void fetchData();
    },
  });

  useEffect(() => {
    void fetchData();
    const interval = window.setInterval(() => {
      void fetchData();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [fetchData]);

  const inUseTables = adminTables.filter((table) => table.displayStatus === 'InUse').length;
  const occupancyRate = adminTables.length > 0 ? Math.round((inUseTables / adminTables.length) * 100) : 0;

  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status === 'Confirmed' && new Date(booking.startTime) > new Date())
        .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime())
        .slice(0, 5),
    [bookings],
  );

  const activeFnBBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'InProgress' && booking.fnBTotal > 0),
    [bookings],
  );
  const checkoutBookingId = useMemo(() => {
    if (!checkoutTable) {
      return null;
    }

    const activeBooking = bookings.find(
      (booking) => booking.tableId === checkoutTable.id && booking.status === 'InProgress',
    );

    return activeBooking?.id ?? null;
  }, [bookings, checkoutTable]);

  return (
    <div className="animate-in fade-in space-y-6 p-8 duration-500">
      {error && (
        <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">
        {[
          {
            label: 'Tỷ lệ lấp đầy hiện tại',
            value: `${occupancyRate}%`,
            sub: `${inUseTables}/${adminTables.length} bàn đang hoạt động`,
          },
          {
            label: 'Doanh thu hôm nay',
            value: `${(stats?.revenue || 0).toLocaleString()}đ`,
            sub: 'Thống kê theo ngày hiện tại',
          },
          {
            label: 'Khách không đến hôm nay',
            value: `${stats?.noShowsToday || 0}`,
            sub: `Thu cọc: ${(stats?.forfeitedDepositsToday || 0).toLocaleString()}đ`,
          },
          {
            label: 'Bàn đang trống',
            value: `${stats?.availableTables ?? adminTables.filter((table) => table.displayStatus === 'Available').length}`,
            sub: 'Cập nhật từ sơ đồ sàn hiện tại',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-neutral-100 bg-white p-6">
            <p className="mb-2 text-[13px] font-medium text-neutral-500">{kpi.label}</p>
            <h3 className="mb-1 text-3xl font-semibold tracking-tight font-headline text-neutral-900">{kpi.value}</h3>
            <p className="text-[12px] text-neutral-400">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-2xl border border-neutral-100 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold font-headline text-neutral-800">
              Sơ đồ vận hành thời gian thực
            </h3>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-tertiary"></span> Sẵn sàng
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-primary"></span> Đang sử dụng
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-amber-500"></span> Sắp tới
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-neutral-300"></span> Bảo trì
              </div>
            </div>
          </div>

          {isLoading && adminTables.length === 0 ? (
            <div className="rounded-xl border border-neutral-100 bg-surface-low p-8 text-center text-neutral-500">
              Đang tải trạng thái vận hành...
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {adminTables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  onClick={(selectedTable) => setOrderPanelTable(selectedTable)}
                  onCheckout={(_, selectedTable) => setCheckoutTable(selectedTable)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-100 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold font-headline text-neutral-800">
                Lượt đặt sắp tới
              </h3>
            </div>
            <div className="relative ml-3 space-y-6 border-l-2 border-neutral-100 pb-2">
              {upcomingBookings.length > 0 ? (
                upcomingBookings.map((booking) => (
                  <div key={booking.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-amber-500 bg-surface-lowest"></div>
                    <p className="text-[13px] font-semibold text-neutral-800">
                      {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {booking.userFullName || booking.guestName || 'Khách vãng lai'}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {booking.tableNumber
                        ? `Bàn ${booking.tableNumber}`
                        : `Loại ${getTableTypeLabel(booking.requestedTableType)} - xếp bàn lúc nhận bàn`}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-400">{booking.userEmail}</p>
                  </div>
                ))
              ) : (
                <div className="pl-6 text-sm text-neutral-500">Không có lượt đặt nào sắp tới</div>
              )}
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold font-headline text-orange-900">
                <span className="material-symbols-outlined">warning</span> Cảnh báo sức chứa
              </h3>
              <div className="space-y-3">
                {warnings.map((warning) => (
                  <div key={`${warning.bookingId}-${warning.tableId ?? 'na'}`} className="rounded-lg border border-orange-100 bg-white p-3 shadow-sm">
                    <p className="text-sm font-medium text-orange-800">
                      Bàn {warning.tableNumber || warning.tableId || 'chưa rõ'} ({getTableTypeLabel(warning.category)}) - còn {warning.minutesRemaining} phút - khách{' '}
                      {warning.currentCustomerName || 'chưa rõ'} - hết lúc {formatClockTime(warning.endsAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-neutral-100 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold font-headline text-neutral-800">
              Yêu cầu F&amp;B
            </h3>
            <div className="space-y-3">
              {activeFnBBookings.length > 0 ? (
                activeFnBBookings.map((booking) => (
                  <div key={booking.id} className="flex gap-3 rounded-lg border border-neutral-100 bg-surface-low p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Coffee size={16} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-neutral-800">
                        {booking.tableNumber
                          ? `Bàn ${booking.tableNumber}`
                          : getTableTypeLabel(booking.requestedTableType)}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-600">
                        Giá trị đơn: {booking.fnBTotal.toLocaleString()}đ
                      </p>
                      <p className="mt-1 text-[10px] text-neutral-400">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-2 text-sm text-neutral-500">Không có yêu cầu F&amp;B</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <InSessionOrderPanel
        isOpen={!!orderPanelTable}
        onClose={() => {
          setOrderPanelTable(null);
          void fetchData();
        }}
        table={orderPanelTable}
        sessionId={orderPanelTable?.activeSessionId}
      />

      <CheckoutPanel
        isOpen={!!checkoutTable}
        onClose={(success) => {
          setCheckoutTable(null);
          if (success) {
            void fetchData();
          }
        }}
        table={checkoutTable}
        sessionId={checkoutTable?.activeSessionId}
        bookingId={checkoutBookingId}
      />
    </div>
  );
};
