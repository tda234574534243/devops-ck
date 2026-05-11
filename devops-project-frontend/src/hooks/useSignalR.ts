import { useEffect, useMemo } from 'react';
import { signalRService } from '../services/signalrService';
import { useTableStore } from '../stores/tableStore';
import { TableStatus } from '../types';

type SignalRTableSlotGroup = {
  tableId: number;
  date: string;
};

interface UseSignalROptions {
  floorPlanDate?: string | Date;
  tableSlotGroups?: SignalRTableSlotGroup[];
  onTableStatusChanged?: (tableId: number, newStatus: TableStatus) => void;
  onCategoryCapacityChanged?: (tableType: string, bookingDate: string) => void;
  onBookingAssigned?: (reservationId: string, tableId: number) => void;
  onRunningTotalUpdated?: (runningTotal: unknown) => void;
}

const formatDateParam = (value: string | Date | undefined) => {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  return [
    value.getFullYear(),
    `${value.getMonth() + 1}`.padStart(2, '0'),
    `${value.getDate()}`.padStart(2, '0'),
  ].join('-');
};

export const useSignalR = (options: UseSignalROptions = {}) => {
  const updateTableStatus = useTableStore((state) => state.updateTableStatus);
  const onTableStatusChanged = options.onTableStatusChanged;
  const onCategoryCapacityChanged = options.onCategoryCapacityChanged;
  const onBookingAssigned = options.onBookingAssigned;
  const onRunningTotalUpdated = options.onRunningTotalUpdated;

  const floorPlanDate = useMemo(() => formatDateParam(options.floorPlanDate) ?? formatDateParam(new Date())!, [options.floorPlanDate]);
  const tableSlotGroups = useMemo(
    () =>
      (options.tableSlotGroups ?? []).map((group) => ({
        tableId: group.tableId,
        date: formatDateParam(group.date) ?? floorPlanDate,
      })),
    [floorPlanDate, options.tableSlotGroups],
  );

  useEffect(() => {
    const handleTableStatusChanged = (tableId: number, newStatus: TableStatus) => {
      updateTableStatus(tableId, newStatus);
      onTableStatusChanged?.(tableId, newStatus);
    };

    const handleCategoryCapacityChanged = (tableType: string, bookingDate: string) => {
      onCategoryCapacityChanged?.(tableType, bookingDate);
    };

    const handleBookingAssigned = (reservationId: string, tableId: number) => {
      onBookingAssigned?.(reservationId, tableId);
    };

    const handleRunningTotalUpdated = (runningTotal: unknown) => {
      onRunningTotalUpdated?.(runningTotal);
    };

    signalRService.on('TableStatusChanged', handleTableStatusChanged);
    signalRService.on('CategoryCapacityChanged', handleCategoryCapacityChanged);
    signalRService.on('BookingAssigned', handleBookingAssigned);
    signalRService.on('RunningTotalUpdated', handleRunningTotalUpdated);

    let cancelled = false;

    const joinGroups = async () => {
      try {
        await signalRService.connect();

        if (cancelled) {
          return;
        }

        await signalRService.joinFloorPlanGroup(floorPlanDate);
        await Promise.all(
          tableSlotGroups.map((group) => signalRService.joinTableSlotGroup(group.tableId, group.date)),
        );
      } catch (error) {
        console.error('Unable to subscribe to SignalR groups', error);
      }
    };

    void joinGroups();

    return () => {
      cancelled = true;
      signalRService.off('TableStatusChanged', handleTableStatusChanged);
      signalRService.off('CategoryCapacityChanged', handleCategoryCapacityChanged);
      signalRService.off('BookingAssigned', handleBookingAssigned);
      signalRService.off('RunningTotalUpdated', handleRunningTotalUpdated);
      void signalRService.leaveFloorPlanGroup(floorPlanDate);
      tableSlotGroups.forEach((group) => {
        void signalRService.leaveTableSlotGroup(group.tableId, group.date);
      });
    };
  }, [
    floorPlanDate,
    onBookingAssigned,
    onCategoryCapacityChanged,
    onRunningTotalUpdated,
    onTableStatusChanged,
    tableSlotGroups,
    updateTableStatus,
  ]);
};
