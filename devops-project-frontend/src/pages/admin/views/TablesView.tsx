import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Edit, Trash2, Map as MapIcon, List, Clock } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { AdminBooking, AdminTable, PendingCheckin, TableType } from '../../../types';
import { TableCard } from '../components/TableCard';
import { AdminModal } from '../components/AdminModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { InSessionOrderPanel } from '../components/InSessionOrderPanel';
import { CheckoutPanel } from '../components/CheckoutPanel';
import { WalkInModal } from '../components/WalkInModal';
import { useSignalR } from '../../../hooks/useSignalR';
import { getTableStatusLabel, getTableTypeLabel } from '../../../utils/labels';

const itemsPerPage = 10;

const formatClockTime = (value?: string | null) => {
  if (!value) {
    return '--:--';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const LiveElapsedTime = ({ startTime }: { startTime: string }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Date.now() - new Date(startTime).getTime());
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      setElapsed(hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`);
    };

    update();
    const interval = window.setInterval(update, 60000);
    return () => window.clearInterval(interval);
  }, [startTime]);

  return (
    <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600">
      {elapsed}
    </span>
  );
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

const getTodayDate = () => new Date().toISOString().slice(0, 10);

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

export const TablesView = () => {
  const [activeBookings, setActiveBookings] = useState<AdminBooking[]>([]);
  const [adminTables, setAdminTables] = useState<AdminTable[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<AdminTable | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [orderPanelTable, setOrderPanelTable] = useState<AdminTable | null>(null);
  const [checkoutTable, setCheckoutTable] = useState<AdminTable | null>(null);
  const [walkInTable, setWalkInTable] = useState<AdminTable | null>(null);
  const [selectedTableForCheckin, setSelectedTableForCheckin] = useState<AdminTable | null>(null);
  const [pendingCheckins, setPendingCheckins] = useState<PendingCheckin[]>([]);
  const [selectedPendingBooking, setSelectedPendingBooking] = useState<PendingCheckin | null>(null);
  const [noShowBooking, setNoShowBooking] = useState<PendingCheckin | null>(null);
  const [extendTable, setExtendTable] = useState<AdminTable | null>(null);
  const [transferTable, setTransferTable] = useState<AdminTable | null>(null);
  const [extensionMinutes, setExtensionMinutes] = useState(30);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [formData, setFormData] = useState({
    tableNumber: '',
    type: 'Pool' as TableType,
    hourlyRate: 50000,
    status: 'Available' as 'Available' | 'Maintenance',
    isActive: true,
    positionX: '',
    positionY: '',
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      const today = getTodayDate();
      const [tables, snapshot, pending, activeBookingsResponse] = await Promise.all([
        adminService.getTables(),
        adminService.getFloorPlanSnapshot(today),
        adminService.getPendingCheckins(today),
        adminService.getBookings({ page: 1, pageSize: 200, status: 'InProgress' }),
      ]);

      setAdminTables(enrichTablesWithActiveSessions(tables, snapshot));
      setPendingCheckins(pending || []);
      setActiveBookings(activeBookingsResponse.items || []);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Không thể tải dữ liệu bàn lúc này.'),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useSignalR({
    floorPlanDate: getTodayDate(),
    onTableStatusChanged: () => {
      void loadData();
    },
    onCategoryCapacityChanged: () => {
      void loadData();
    },
    onBookingAssigned: () => {
      void loadData();
    },
  });

  useEffect(() => {
    void loadData();
    const interval = window.setInterval(() => {
      void loadData();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loadData]);

  const total = adminTables.length;
  const inUse = adminTables.filter((table) => table.displayStatus === 'InUse').length;
  const maintenances = adminTables.filter((table) => table.displayStatus === 'Maintenance').length;
  const available = adminTables.filter((table) => table.displayStatus === 'Available').length;

  const filteredData = useMemo(
    () =>
      adminTables.filter((table) => {
        const matchesSearch = table.tableNumber.toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === 'All' || table.type === filterType;
        const matchesStatus = filterStatus === 'All' || table.displayStatus === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
      }),
    [adminTables, filterStatus, filterType, search],
  );

  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const checkoutBookingId = useMemo(() => {
    if (!checkoutTable) {
      return null;
    }

    const activeBooking = activeBookings.find(
      (booking) => booking.tableId === checkoutTable.id && booking.status === 'InProgress',
    );

    return activeBooking?.id ?? null;
  }, [activeBookings, checkoutTable]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openCreate = () => {
    setEditingTable(null);
    setFormData({
      tableNumber: '',
      type: 'Pool',
      hourlyRate: 50000,
      status: 'Available',
      isActive: true,
      positionX: '',
      positionY: '',
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openEdit = (table: AdminTable) => {
    setEditingTable(table);
    setFormData({
      tableNumber: table.tableNumber,
      type: table.type,
      hourlyRate: table.hourlyRate,
      status: table.manualStatus || 'Available',
      isActive: table.isActive,
      positionX: table.positionX == null ? '' : String(table.positionX),
      positionY: table.positionY == null ? '' : String(table.positionY),
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const payload = {
      tableNumber: formData.tableNumber.trim(),
      type: formData.type,
      hourlyRate: Number(formData.hourlyRate),
      status: formData.status,
      isActive: formData.isActive,
      positionX: formData.positionX === '' ? null : Number(formData.positionX),
      positionY: formData.positionY === '' ? null : Number(formData.positionY),
    };

    try {
      if (editingTable) {
        await adminService.updateTable(editingTable.id, payload);
        setFeedback({ type: 'success', message: `Đã cập nhật bàn ${payload.tableNumber}.` });
      } else {
        await adminService.createTable(payload);
        setFeedback({ type: 'success', message: `Đã tạo bàn ${payload.tableNumber}.` });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Không thể lưu thông tin bàn.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await adminService.deleteTable(deletingId);
      setIsDeleteOpen(false);
      setDeletingId(null);
      setFeedback({ type: 'success', message: 'Đã xóa hoặc lưu trữ bàn thành công.' });
      await loadData();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Không thể xóa bàn này.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignBooking = async (bookingId: string, tableId: number) => {
    setIsSaving(true);
    setFeedback(null);

    try {
      await adminService.checkinBooking(bookingId, { tableId });
      setSelectedPendingBooking(null);
      setSelectedTableForCheckin(null);
      setFeedback({ type: 'success', message: 'Nhận bàn thành công.' });
      await loadData();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Không thể làm thủ tục nhận bàn lúc này.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkNoShow = async () => {
    if (!noShowBooking) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await adminService.updateBookingStatus(noShowBooking.bookingId, 'NoShow');
      setNoShowBooking(null);
      setSelectedPendingBooking(null);
      setSelectedTableForCheckin(null);
      setFeedback({ type: 'success', message: 'Đã đánh dấu khách không đến.' });
      await loadData();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Không thể đánh dấu khách không đến cho lượt đặt này.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExtendSession = async () => {
    if (!extendTable?.activeSessionId) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await adminService.extendSession(extendTable.activeSessionId, extensionMinutes);
      setFeedback({ type: 'success', message: `Đã gia hạn bàn ${extendTable.tableNumber} thêm ${extensionMinutes} phút.` });
      setExtendTable(null);
      setExtensionMinutes(30);
      await loadData();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Không thể gia hạn phiên lúc này.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransferSession = async () => {
    if (!transferTable?.activeSessionId || !transferTargetId) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await adminService.transferSessionTable(transferTable.activeSessionId, {
        newTableId: Number(transferTargetId),
        reason: transferReason.trim() || undefined,
      });
      setFeedback({ type: 'success', message: 'Đã chuyển phiên sang bàn mới thành công.' });
      setTransferTable(null);
      setTransferTargetId('');
      setTransferReason('');
      await loadData();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Không thể chuyển bàn cho phiên này.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in space-y-6 p-8 duration-500">
      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-error/20 bg-error/5 text-error'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {pendingCheckins.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="mb-4 text-xl font-semibold font-headline text-amber-900">
            Khách online chờ nhận bàn
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {pendingCheckins.map((booking) => (
              <div key={booking.bookingId} className="min-w-[280px] rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="font-bold text-neutral-900">
                    {booking.guestName || booking.userFullName || 'Khách online'}
                  </h4>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                    {getTableTypeLabel(booking.requestedTableType)}
                  </span>
                </div>
                <div className="mb-4 flex items-center gap-1 text-sm text-neutral-500">
                  <Clock size={14} /> Giờ: {formatClockTime(booking.startTime)} - {formatClockTime(booking.endTime)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPendingBooking(booking)}
                    className="flex-1 rounded-lg bg-amber-600 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-700"
                  >
                    Xep ban
                  </button>
                  <button
                    onClick={() => setNoShowBooking(booking)}
                    className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-50"
                  >
                    Đánh dấu khách không đến
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">
        <div className="rounded-2xl border border-neutral-100 bg-white p-6">
          <p className="mb-2 text-[13px] font-medium text-neutral-500">Tổng số bàn</p>
          <h3 className="mb-1 text-3xl font-semibold tracking-tight font-headline text-neutral-900">{total}</h3>
          <p className="text-[12px] text-neutral-400">Tất cả khu vực</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-white p-6">
          <p className="mb-2 text-[13px] font-medium text-neutral-500">Bàn đang trống</p>
          <h3 className="mb-1 text-3xl font-semibold tracking-tight font-headline text-tertiary">{available}</h3>
          <p className="text-[12px] text-neutral-400">Sẵn sàng phục vụ</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-white p-6">
          <p className="mb-2 text-[13px] font-medium text-neutral-500">Đang sử dụng</p>
          <h3 className="mb-1 text-3xl font-semibold tracking-tight font-headline text-primary">{inUse}</h3>
          <p className="text-[12px] text-neutral-400">Khách đang chơi</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-white p-6">
          <p className="mb-2 text-[13px] font-medium text-neutral-500">Bảo trì</p>
          <h3 className="mb-1 text-3xl font-semibold tracking-tight font-headline text-amber-500">{maintenances}</h3>
          <p className="text-[12px] text-neutral-400">Cần xử lý</p>
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-neutral-100 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold font-headline text-neutral-800">
            Danh sách bàn
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-lg bg-neutral-100 p-1">
              <button
                aria-label="Chuyển sang chế độ danh sách"
                title="Danh sách"
                onClick={() => setViewMode('list')}
                className={`rounded-md p-2 transition-all ${
                  viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <List size={18} />
              </button>
              <button
                aria-label="Chuyển sang chế độ sơ đồ"
                title="Sơ đồ"
                onClick={() => setViewMode('grid')}
                className={`rounded-md p-2 transition-all ${
                  viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <MapIcon size={18} />
              </button>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-600"
            >
              <Plus size={18} />
              Thêm bàn mới
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative max-w-sm min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm bàn..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-neutral-200 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            aria-label="Lọc theo loại bàn"
            title="Lọc theo loại bàn"
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
            className="rounded-xl border border-neutral-200 px-4 py-2 focus:outline-none"
          >
            <option value="All">Tất cả loại bàn</option>
            <option value="Pool">Pool</option>
            <option value="Snooker">Snooker</option>
            <option value="Carom">Carom</option>
          </select>
          <select
            aria-label="Lọc theo trạng thái bàn"
            title="Lọc theo trạng thái bàn"
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="rounded-xl border border-neutral-200 px-4 py-2 focus:outline-none"
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="Available">Sẵn sàng</option>
            <option value="Reserved">Sắp tới</option>
            <option value="InUse">Đang sử dụng</option>
            <option value="Maintenance">Bảo trì</option>
            <option value="Inactive">Tạm khóa</option>
          </select>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-neutral-100 bg-surface-low p-8 text-center text-neutral-500">
            Đang tải dữ liệu bàn...
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-200 bg-surface-low">
                  <th className="px-4 py-3 text-sm font-semibold text-neutral-600">Số bàn</th>
                  <th className="px-4 py-3 text-sm font-semibold text-neutral-600">Loại bàn</th>
                  <th className="px-4 py-3 text-sm font-semibold text-neutral-600">Trạng thái</th>
                  <th className="px-4 py-3 text-sm font-semibold text-neutral-600">Khách / Lịch</th>
                  <th className="px-4 py-3 text-sm font-semibold text-neutral-600">Đơn giá / giờ</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((table) => {
                  const status = table.displayStatus;
                  let badge = 'bg-neutral-100 text-neutral-600';
                  if (status === 'InUse') badge = 'bg-red-50 text-red-600';
                  else if (status === 'Available') badge = 'bg-teal-50 text-teal-600';
                  else if (status === 'Reserved') badge = 'bg-amber-50 text-amber-600';
                  else if (status === 'Maintenance') badge = 'bg-neutral-200 text-neutral-700';

                  return (
                    <tr
                      key={table.id}
                      onClick={() => {
                        if (status === 'InUse' && table.activeSessionId) {
                          setOrderPanelTable(table);
                        }
                      }}
                      className="cursor-pointer border-b border-neutral-100 hover:bg-neutral-50/50"
                    >
                      <td className="px-4 py-3 font-medium">{table.tableNumber}</td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {getTableTypeLabel(table.type)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-1 text-xs font-bold ${badge}`}>
                          {getTableStatusLabel(status)}
                        </span>
                      </td>
                      <td className="min-w-[220px] px-4 py-3">
                        {status === 'InUse' ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-neutral-900">
                              {table.currentCustomerName || 'Khách vãng lai'}
                            </span>
                            <div className="mt-1 flex items-center text-xs text-neutral-500">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                Bắt đầu {table.currentSessionStartedAt ? formatClockTime(table.currentSessionStartedAt) : '--:--'}
                              </span>
                              {table.currentSessionStartedAt && <LiveElapsedTime startTime={table.currentSessionStartedAt} />}
                            </div>
                          </div>
                        ) : status === 'Reserved' ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-neutral-900">
                              {table.nextCustomerName || 'Đặt theo loại bàn'}
                            </span>
                            <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                              <Clock size={12} />
                              <span>
                                {table.nextCustomerName ? 'Tới lúc' : 'Giờ cao điểm lúc'}{' '}
                                {table.nextBookingStartTime ? formatClockTime(table.nextBookingStartTime) : '--:--'}
                              </span>
                            </div>
                            {!table.nextCustomerName && (
                              <span className="mt-1 text-[11px] text-neutral-500">
                                Nhân viên sẽ xếp bàn khi khách làm thủ tục nhận bàn.
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-neutral-400">Không có lịch đang hiển thị</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-primary">
                        {table.hourlyRate?.toLocaleString() || 0}đ
                      </td>
                      <td className="px-4 py-3 text-right">
                        {status === 'InUse' && table.activeSessionId && (
                          <>
                            <button
                              aria-label="Mở F&B"
                              title="Mở F&B"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOrderPanelTable(table);
                              }}
                              className="mr-2 p-2 text-xs font-bold uppercase text-neutral-500 transition-colors hover:text-neutral-900"
                            >
                              F&B
                            </button>
                            <button
                              aria-label="Gia hạn"
                              title="Gia hạn phiên"
                              onClick={(event) => {
                                event.stopPropagation();
                                setExtensionMinutes(30);
                                setExtendTable(table);
                              }}
                              className="mr-2 p-2 text-xs font-bold uppercase text-amber-600 transition-colors hover:text-amber-700"
                            >
                              Gia hạn
                            </button>
                            <button
                              aria-label="Chuyển bàn"
                              title="Chuyển bàn"
                              onClick={(event) => {
                                event.stopPropagation();
                                setTransferTable(table);
                                setTransferTargetId('');
                                setTransferReason('');
                              }}
                              className="mr-2 p-2 text-xs font-bold uppercase text-blue-600 transition-colors hover:text-blue-700"
                            >
                              Chuyển
                            </button>
                            <button
                              aria-label="Thanh toán"
                              title="Thanh toán"
                              onClick={(event) => {
                                event.stopPropagation();
                                setCheckoutTable(table);
                              }}
                              className="mr-2 p-2 text-xs font-bold uppercase text-primary transition-colors hover:text-primary-600"
                            >
                              Thanh toan
                            </button>
                          </>
                        )}
                        {status === 'Available' && (
                          <>
                            {pendingCheckins.some((booking) => booking.requestedTableType === table.type) && (
                              <button
                                aria-label="Chờ xếp"
                                title="Khách chờ xếp online"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedTableForCheckin(table);
                                }}
                                className="mr-2 p-2 text-xs font-bold uppercase text-amber-600 transition-colors hover:text-amber-700"
                              >
                                Chờ xếp
                              </button>
                            )}
                            <button
                              aria-label="Khách vãng lai"
                              title="Khách vãng lai"
                              onClick={(event) => {
                                event.stopPropagation();
                                setWalkInTable(table);
                              }}
                              className="mr-2 p-2 text-xs font-bold uppercase text-neutral-400 transition-colors hover:text-neutral-900"
                            >
                              Vãng lai
                            </button>
                          </>
                        )}
                        <button
                          aria-label={`Sửa bàn ${table.tableNumber}`}
                          title={`Sửa bàn ${table.tableNumber}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            openEdit(table);
                          }}
                          className="p-2 text-neutral-400 transition-colors hover:text-primary"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          aria-label={`Xóa bàn ${table.tableNumber}`}
                          title={`Xóa bàn ${table.tableNumber}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeletingId(table.id);
                            setIsDeleteOpen(true);
                          }}
                          className="p-2 text-neutral-400 transition-colors hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-500">
                      Không tìm thấy dữ liệu phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4">
                <span className="text-sm text-neutral-500">Trang {currentPage} / {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => page - 1)}
                    className="rounded-lg border border-neutral-200 px-3 py-1 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => page + 1)}
                    className="rounded-lg border border-neutral-200 px-3 py-1 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-4 gap-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 p-6">
            {adminTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={(selectedTable) => setOrderPanelTable(selectedTable)}
                onCheckout={(_, selectedTable) => setCheckoutTable(selectedTable)}
                onWalkin={(selectedTable) => setWalkInTable(selectedTable)}
                hasPending={pendingCheckins.some((booking) => booking.requestedTableType === table.type)}
                onCheckinOnline={(selectedTable) => setSelectedTableForCheckin(selectedTable)}
              />
            ))}
          </div>
        )}
      </div>

      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTable ? 'Chỉnh sửa bàn' : 'Thêm bàn mới'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Số bàn</label>
            <input
              required
              type="text"
              title="Số bàn"
              placeholder="Nhập số bàn"
              className="w-full rounded-xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={formData.tableNumber}
              onChange={(event) => setFormData((current) => ({ ...current, tableNumber: event.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Loại bàn</label>
            <select
              aria-label="Loại bàn"
              title="Loại bàn"
              className="w-full rounded-xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={formData.type}
              onChange={(event) => setFormData((current) => ({ ...current, type: event.target.value as TableType }))}
            >
              <option value="Pool">Pool</option>
              <option value="Snooker">Snooker</option>
              <option value="Carom">Carom</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Đơn giá / giờ</label>
            <input
              required
              min={0}
              type="number"
              title="Đơn giá mỗi giờ"
              placeholder="Nhập đơn giá"
              className="w-full rounded-xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={formData.hourlyRate}
              onChange={(event) => setFormData((current) => ({ ...current, hourlyRate: Number(event.target.value) }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Trạng thái thủ công</label>
            <select
              aria-label="Trạng thái bàn"
              title="Trạng thái bàn"
              className="w-full rounded-xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={formData.status}
              onChange={(event) =>
                setFormData((current) => ({ ...current, status: event.target.value as 'Available' | 'Maintenance' }))
              }
            >
              <option value="Available">Sẵn sàng</option>
              <option value="Maintenance">Bảo trì</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm font-medium text-neutral-700">
              Vị trí X
              <input
                type="number"
                value={formData.positionX}
                onChange={(event) => setFormData((current) => ({ ...current, positionX: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Tọa độ X"
              />
            </label>
            <label className="text-sm font-medium text-neutral-700">
              Vị trí Y
              <input
                type="number"
                value={formData.positionY}
                onChange={(event) => setFormData((current) => ({ ...current, positionY: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Tọa độ Y"
              />
            </label>
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(event) => setFormData((current) => ({ ...current, isActive: event.target.checked }))}
            />
            Bàn đang hoạt động
          </label>
          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 rounded-xl bg-neutral-100 py-2 font-medium text-neutral-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl bg-primary py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Xóa bàn này?"
        message="Bạn có chắc muốn xóa bàn này? Nếu bàn đã có lịch sử lượt chơi, hệ thống sẽ lưu lại thay vì xóa hẳn."
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      <InSessionOrderPanel
        isOpen={!!orderPanelTable}
        onClose={() => {
          setOrderPanelTable(null);
          void loadData();
        }}
        table={orderPanelTable}
        sessionId={orderPanelTable?.activeSessionId}
      />

      <CheckoutPanel
        isOpen={!!checkoutTable}
        onClose={(success) => {
          setCheckoutTable(null);
          if (success) {
            void loadData();
          }
        }}
        table={checkoutTable}
        sessionId={checkoutTable?.activeSessionId}
        bookingId={checkoutBookingId}
      />

      <WalkInModal
        isOpen={!!walkInTable}
        onClose={(success: boolean) => {
          setWalkInTable(null);
          if (success) {
            void loadData();
          }
        }}
        table={walkInTable}
      />

      <AdminModal isOpen={!!selectedPendingBooking} onClose={() => setSelectedPendingBooking(null)} title="Phân bổ bàn cho khách">
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Chọn bàn trống thuộc loại <strong>{getTableTypeLabel(selectedPendingBooking?.requestedTableType)}</strong> để làm thủ tục nhận bàn cho khách{' '}
            <strong>{selectedPendingBooking?.guestName || selectedPendingBooking?.userFullName || 'Khách online'}</strong>.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {adminTables
              .filter((table) => table.displayStatus === 'Available' && table.type === selectedPendingBooking?.requestedTableType)
              .map((table) => (
                <button
                  key={table.id}
                  onClick={() => void handleAssignBooking(selectedPendingBooking!.bookingId, table.id)}
                  disabled={isSaving}
                  className="rounded-xl border-2 border-tertiary bg-teal-50 px-4 py-3 font-bold text-tertiary transition-colors hover:bg-tertiary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Bàn {table.tableNumber}
                </button>
              ))}
            {adminTables.filter((table) => table.displayStatus === 'Available' && table.type === selectedPendingBooking?.requestedTableType).length === 0 && (
              <div className="col-span-3 rounded-xl border border-error/20 bg-error/10 py-4 text-center font-medium text-error">
                Không có bàn trống thuộc loại này. Vui lòng đợi thêm hoặc giải phóng bàn khác.
              </div>
            )}
          </div>
        </div>
      </AdminModal>

      <AdminModal isOpen={!!selectedTableForCheckin} onClose={() => setSelectedTableForCheckin(null)} title="Chọn khách online cho bàn này">
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Chọn một khách đang chờ loại bàn <strong>{getTableTypeLabel(selectedTableForCheckin?.type)}</strong> để xếp vào bàn{' '}
            <strong>{selectedTableForCheckin?.tableNumber}</strong>.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {pendingCheckins
              .filter((booking) => booking.requestedTableType === selectedTableForCheckin?.type)
              .map((booking) => (
                <div key={booking.bookingId} className="flex items-center justify-between rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                  <div>
                    <h4 className="font-bold text-amber-900">
                      {booking.guestName || booking.userFullName || 'Khách online'}
                    </h4>
                    <div className="mt-1 flex items-center gap-1 text-sm text-amber-700/80">
                      <Clock size={14} /> {formatClockTime(booking.startTime)} - {formatClockTime(booking.endTime)}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      selectedTableForCheckin && void handleAssignBooking(booking.bookingId, selectedTableForCheckin.id)
                    }
                    disabled={isSaving}
                    className="rounded-lg bg-amber-600 px-4 py-2 font-bold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Xếp vào đây
                  </button>
                </div>
              ))}
            {pendingCheckins.filter((booking) => booking.requestedTableType === selectedTableForCheckin?.type).length === 0 && (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 py-4 text-center text-neutral-500">
                Không có khách online nào đang chờ loại bàn này.
              </div>
            )}
          </div>
        </div>
      </AdminModal>

      <AdminModal isOpen={!!extendTable} onClose={() => setExtendTable(null)} title="Gia hạn phiên">
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Gia hạn phiên đang chạy trên bàn <strong>{extendTable?.tableNumber}</strong>.
          </p>
          <label className="block text-sm font-medium text-neutral-700">
            Số phút thêm
            <input
              type="number"
              min={15}
              step={15}
              value={extensionMinutes}
              onChange={(event) => setExtensionMinutes(Number(event.target.value))}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={() => setExtendTable(null)}
              className="rounded-lg bg-neutral-100 px-4 py-2 font-medium text-neutral-700"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSaving || extensionMinutes < 15}
              onClick={() => void handleExtendSession()}
              className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Đang xử lý...' : 'Xác nhận gia hạn'}
            </button>
          </div>
        </div>
      </AdminModal>

      <AdminModal isOpen={!!transferTable} onClose={() => setTransferTable(null)} title="Chuyển phiên sang bàn khác">
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Chọn bàn trống cùng loại <strong>{getTableTypeLabel(transferTable?.type)}</strong> để chuyển phiên hiện tại.
          </p>
          <label className="block text-sm font-medium text-neutral-700">
            Bàn đích
            <select
              value={transferTargetId}
              onChange={(event) => setTransferTargetId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Chọn bàn trống</option>
              {adminTables
                .filter(
                  (table) =>
                    table.displayStatus === 'Available' &&
                    table.type === transferTable?.type &&
                    table.id !== transferTable?.id,
                )
                .map((table) => (
                  <option key={table.id} value={table.id}>
                    Bàn {table.tableNumber}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Lý do (tùy chọn)
            <textarea
              rows={3}
              value={transferReason}
              onChange={(event) => setTransferReason(event.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Ví dụ: khách muốn đổi bàn, cần bảo trì, tối ưu luồng vận hành..."
            />
          </label>
          <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={() => setTransferTable(null)}
              className="rounded-lg bg-neutral-100 px-4 py-2 font-medium text-neutral-700"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSaving || !transferTargetId}
              onClick={() => void handleTransferSession()}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Đang xử lý...' : 'Xác nhận chuyển bàn'}
            </button>
          </div>
        </div>
      </AdminModal>

      <ConfirmDialog
        isOpen={!!noShowBooking}
        onClose={() => setNoShowBooking(null)}
        onConfirm={handleMarkNoShow}
        title="Đánh dấu khách không đến"
        message={`Xác nhận ${(noShowBooking?.guestName || noShowBooking?.userFullName || 'khách này')} là khách không đến? Tiền cọc sẽ được xử lý theo quy định đặt bàn hiện tại.`}
      />
    </div>
  );
};
