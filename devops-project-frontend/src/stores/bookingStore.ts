import { create } from 'zustand';
import { Booking, CreateBookingRequest, CreateBookingResponse, TableType, CategoryAvailability } from '../types';
import { bookingService } from '../services/bookingService';

interface BookingState {
  selectedCategory: TableType | null;
  categoryAvailability: CategoryAvailability | null;
  availabilityError: string | null;
  selectedDate: Date;
  selectedSlots: string[];
  bookings: Booking[];
  isLoading: boolean;
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  setSelectedCategory: (category: TableType | null) => void;
  setSelectedDate: (date: Date) => void;
  toggleSlot: (slot: string) => void;
  clearBooking: () => void;
  fetchCategoryAvailability: (category: TableType, date: Date) => Promise<void>;
  fetchBookings: (page?: number, size?: number, status?: string) => Promise<void>;
  createBooking: (data: CreateBookingRequest) => Promise<CreateBookingResponse>;
  cancelBooking: (id: string) => Promise<boolean>;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedCategory: null,
  categoryAvailability: null,
  availabilityError: null,
  selectedDate: new Date(),
  selectedSlots: [],
  bookings: [],
  isLoading: false,
  totalItems: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
  setSelectedCategory: (category) => set({ selectedCategory: category, selectedSlots: [], categoryAvailability: null, availabilityError: null }),
  setSelectedDate: (date) => set({ selectedDate: date, selectedSlots: [], categoryAvailability: null, availabilityError: null }),
  toggleSlot: (slot) => set((state) => ({
    selectedSlots: state.selectedSlots.includes(slot) 
      ? state.selectedSlots.filter(s => s !== slot)
      : [...state.selectedSlots, slot].sort()
  })),
  clearBooking: () => set({ selectedCategory: null, selectedSlots: [], categoryAvailability: null, availabilityError: null }),
  
  fetchCategoryAvailability: async (category, date) => {
    set({ isLoading: true, availabilityError: null, categoryAvailability: null });
    try {
      const dateString = [
        date.getFullYear(),
        `${date.getMonth() + 1}`.padStart(2, '0'),
        `${date.getDate()}`.padStart(2, '0'),
      ].join('-');
      const response = await bookingService.getCategoryAvailability(category, dateString);
      set({ categoryAvailability: response });
    } catch {
      set({
        categoryAvailability: null,
        availabilityError: 'Không thể tải khung giờ trống lúc này. Vui lòng thử lại sau ít phút.',
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchBookings: async (page = 1, size = 10, status) => {
    set({ isLoading: true });
    try {
      const response = await bookingService.getBookings(page, size, status);
      set({ 
        bookings: response.items, 
        totalItems: response.totalItems,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: response.totalPages
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  createBooking: async (data) => {
    set({ isLoading: true });
    try {
      return await bookingService.createBooking(data);
    } finally {
      set({ isLoading: false });
    }
  },
  
  cancelBooking: async (id: string) => {
    set({ isLoading: true });
    try {
      const success = await bookingService.cancelBooking(id);
      if (success) {
        set((state) => ({
          bookings: state.bookings.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b)
        }));
      }
      return success;
    } finally {
      set({ isLoading: false });
    }
  }
}));
