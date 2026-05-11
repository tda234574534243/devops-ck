import api from './api';
import {
  AdminAnalytics,
  AdminBookingListResponse,
  AdminDashboardStats,
  AdminMembershipPlan,
  AdminTable,
  AdminUpsertMembershipPlanRequest,
  ApiMessageResponse,
  BufferConfig,
  CheckoutSummary,
  FloorPlanSnapshot,
  LinkableCoachSession,
  PendingCheckin,
  RunningTotal,
  UpcomingWarning,
  UpdateTableRequest,
} from '../types';

interface DateRangeParams {
  from?: string;
  to?: string;
}

interface AnalyticsParams extends DateRangeParams {
  period?: string;
  basis?: 'service' | 'payment';
}

interface BookingQueryParams extends DateRangeParams {
  page?: number;
  pageSize?: number;
  status?: string;
  tableId?: number;
  userId?: string;
}

export const adminService = {
  getStats: (params?: DateRangeParams): Promise<AdminDashboardStats> =>
    api.get('/admin/dashboard/stats', { params }).then((res) => res.data),
  getTables: (): Promise<AdminTable[]> =>
    api.get<AdminTable[]>('/admin/tables').then((res) => res.data),
  getFloorPlanSnapshot: (date: string): Promise<FloorPlanSnapshot> =>
    api.get<FloorPlanSnapshot>('/floorplan/snapshot', { params: { date } }).then((res) => res.data),
  createTable: (data: UpdateTableRequest) => api.post('/admin/tables', data).then((res) => res.data),
  updateTable: (id: number, data: UpdateTableRequest) =>
    api.put(`/admin/tables/${id}`, data).then((res) => res.data),
  deleteTable: (id: number) => api.delete(`/admin/tables/${id}`).then((res) => res.data),
  getBookings: (params?: BookingQueryParams): Promise<AdminBookingListResponse> =>
    api.get('/admin/bookings', { params }).then((res) => res.data),
  getCoaches: () => api.get('/admin/coaches').then((res) => res.data),
  createCoach: (data: any) => api.post('/admin/coaches', data).then((res) => res.data),
  updateCoach: (id: string, data: any) => api.put(`/admin/coaches/${id}`, data).then((res) => res.data),
  deleteCoach: (id: string) => api.delete(`/admin/coaches/${id}`).then((res) => res.data),
  getFnBItems: () => api.get('/admin/fnb').then((res) => res.data),
  createFnBItem: (data: any) => api.post('/admin/fnb', data).then((res) => res.data),
  updateFnBItem: (id: number, data: any) => api.put(`/admin/fnb/${id}`, data).then((res) => res.data),
  deleteFnBItem: (id: number) => api.delete(`/admin/fnb/${id}`).then((res) => res.data),
  getMemberships: (): Promise<AdminMembershipPlan[]> =>
    api.get<AdminMembershipPlan[]>('/admin/memberships').then((res) => res.data),
  createMembership: (data: AdminUpsertMembershipPlanRequest) =>
    api.post('/admin/memberships', data).then((res) => res.data),
  updateMembership: (id: number, data: AdminUpsertMembershipPlanRequest) =>
    api.put(`/admin/memberships/${id}`, data).then((res) => res.data),
  deleteMembership: (id: number) => api.delete(`/admin/memberships/${id}`).then((res) => res.data),
  getBufferConfigs: (): Promise<BufferConfig[]> =>
    api.get<BufferConfig[]>('/admin/buffer-configs').then((res) => res.data),
  createBufferConfig: (data: Omit<BufferConfig, 'id'>) =>
    api.post('/admin/buffer-configs', data).then((res) => res.data),
  updateBufferConfig: (id: number, data: Omit<BufferConfig, 'id'>) =>
    api.put(`/admin/buffer-configs/${id}`, data).then((res) => res.data),
  deleteBufferConfig: (id: number) =>
    api.delete(`/admin/buffer-configs/${id}`).then((res) => res.data),
  getAnalytics: (params?: AnalyticsParams): Promise<AdminAnalytics> =>
    api.get('/admin/analytics', { params }).then((res) => res.data),
  updateBookingStatus: (id: string, status: 'Cancelled' | 'NoShow'): Promise<ApiMessageResponse> =>
    api.put(`/admin/bookings/${id}`, { status }).then((res) => res.data),
  checkinBooking: (id: string, data: { tableId: number }) =>
    api.put(`/admin/bookings/${id}/checkin`, data).then((res) => res.data),
  checkoutBooking: (id: string, data: { paymentMethod: string }): Promise<{ message: string; summary?: CheckoutSummary }> =>
    api.put(`/admin/bookings/${id}/checkout`, data).then((res) => ({
      message: res.data.message || res.data.Message || 'Thanh toán hoàn tất thành công.',
      summary: res.data.summary || res.data.Summary,
    })),
  getSessionRunningTotal: (sessionId: string): Promise<RunningTotal> =>
    api.get(`/admin/sessions/${sessionId}/running-total`).then((res) => res.data),
  getSessionInterimBill: (sessionId: string): Promise<CheckoutSummary> =>
    api.get(`/admin/sessions/${sessionId}/interim-bill`).then((res) => res.data),
  extendSession: (sessionId: string, additionalMinutes: number): Promise<ApiMessageResponse> =>
    api.post(`/admin/sessions/${sessionId}/extend`, { additionalMinutes }).then((res) => res.data),
  transferSessionTable: (
    sessionId: string,
    data: { newTableId: number; reason?: string },
  ): Promise<ApiMessageResponse> =>
    api.post(`/admin/sessions/${sessionId}/transfer-table`, data).then((res) => res.data),
  addSessionFnB: (sessionId: string, items: { menuItemId: number; quantity: number }[]): Promise<ApiMessageResponse> =>
    api.post(`/sessions/${sessionId}/fnb`, { items }).then((res) => res.data),
  startWalkIn: (tableId: number, data: { guestName: string }) =>
    api.post(`/admin/tables/${tableId}/walkin`, data).then((res) => res.data),
  getPendingCheckins: (date: string): Promise<PendingCheckin[]> =>
    api.get<PendingCheckin[]>('/admin/bookings/pending-checkin', { params: { date } }).then((res) => res.data),
  getUpcomingWarnings: (): Promise<UpcomingWarning[]> =>
    api.get<UpcomingWarning[]>('/admin/bookings/upcoming-warnings').then((res) => res.data),
  linkCoachSession: (id: string, data: { coachingSessionId: string }) =>
    api.put(`/admin/bookings/${id}/link-coach-session`, data).then((res) => res.data),
  getAvailableCoachSessions: (id: string): Promise<LinkableCoachSession[]> =>
    api.get(`/admin/bookings/${id}/available-coach-sessions`).then((res) => res.data),
};
