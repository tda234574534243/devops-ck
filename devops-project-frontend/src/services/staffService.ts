import api from './api';
import { ApiMessageResponse, StaffAvailability, UpsertStaffAvailabilityRequest } from '../types';

export const staffService = {
  getSchedule: (date?: string) =>
    api
      .get('/staff/schedule', {
        params: date ? { dateStr: date } : undefined,
      })
      .then(res => res.data),
  getSessions: () => api.get('/staff/sessions').then(res => res.data),
  completeSession: (id: string, notes?: string) => api.put(`/staff/sessions/${id}/complete`, { notes }).then(res => res.data),
  getAvailability: () => api.get<StaffAvailability[]>('/staff/availability').then(res => res.data),
  createAvailability: (payload: UpsertStaffAvailabilityRequest) =>
    api.post<StaffAvailability>('/staff/availability', payload).then(res => res.data),
  updateAvailability: (id: number, payload: UpsertStaffAvailabilityRequest) =>
    api.put<StaffAvailability>(`/staff/availability/${id}`, payload).then(res => res.data),
  deleteAvailability: (id: number) =>
    api.delete<ApiMessageResponse>(`/staff/availability/${id}`).then(res => res.data),
};
