import api from './api';
import {
  ApiMessageResponse,
  BookingListResponse,
  CategoryAvailability,
  CreateBookingRequest,
  CreateBookingResponse,
  RescheduleBookingRequest,
  TableType,
} from '../types';

export const bookingService = {
  createBooking: async (data: CreateBookingRequest): Promise<CreateBookingResponse> => {
    const response = await api.post<{ Message?: string; message?: string; ReservationId?: string; reservationId?: string }>(
      '/reservations',
      data,
    );

    return {
      message: response.data.message || response.data.Message || 'Reservation created successfully.',
      reservationId: response.data.reservationId || response.data.ReservationId,
    };
  },

  getCategoryAvailability: async (tableType: TableType, date: string): Promise<CategoryAvailability> => {
    const response = await api.get<CategoryAvailability>('/reservations/category-availability', {
      params: { tableType, date }
    });
    return response.data;
  },
  
  // Keep the richer compatibility list for now because the dedicated reservation
  // endpoint does not yet expose the full history card payload the UI needs.
  getBookings: async (pageNumber = 1, pageSize = 10, status?: string): Promise<BookingListResponse> => {
    const params: Record<string, string | number> = { page: pageNumber, pageSize };
    if (status) params.status = status;
    const response = await api.get<BookingListResponse>('/bookings', { params });
    return response.data;
  },
  
  cancelBooking: async (id: string): Promise<boolean> => {
    const response = await api.put(`/bookings/${id}/cancel`);
    return response.status === 200 || response.status === 204;
  },
  
  rescheduleBooking: async (id: string, data: RescheduleBookingRequest): Promise<ApiMessageResponse> => {
    const response = await api.put<ApiMessageResponse>(`/bookings/${id}/reschedule`, data);
    return response.data;
  }
};
