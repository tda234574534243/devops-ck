import api from './api';
import { BilliardTable, FloorPlanSnapshot, TableAvailabilityResponse, TableAvailabilitySlot } from '../types';

export const tableService = {
  getTables: async (): Promise<BilliardTable[]> => {
    try {
      const response = await api.get<BilliardTable[]>('/tables');
      return response.data;
    } catch (error) {
      console.error("Failed to fetch tables", error);
      return [];
    }
  },
  getTableAvailability: async (tableId: number, date: string): Promise<TableAvailabilitySlot[]> => {
    try {
      const response = await api.get<TableAvailabilityResponse>(`/tables/${tableId}/availability`, { params: { date } });
      return response.data.slots;
    } catch (error) {
      console.error("Failed to fetch table availability", error);
      return [];
    }
  },
  getFloorPlanSnapshot: async (date: string): Promise<FloorPlanSnapshot | null> => {
    try {
      const response = await api.get<FloorPlanSnapshot>('/floorplan/snapshot', { params: { date } });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch floor plan snapshot', error);
      return null;
    }
  }
};
