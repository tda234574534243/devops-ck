import { create } from 'zustand';
import { Coach, CoachAvailabilitySlot } from '../types';
import { coachService } from '../services/coachService';

interface BookCoachPayload {
  sessionDate: string;
  startTime: string;
  endTime: string;
}

interface CoachState {
  coaches: Coach[];
  selectedCoach: Coach | null;
  selectedSlot: CoachAvailabilitySlot | null;
  availability: CoachAvailabilitySlot[];
  isLoading: boolean;
  isBooking: boolean;
  fetchCoaches: () => Promise<void>;
  setSelectedCoach: (coach: Coach | null) => void;
  setSelectedSlot: (slot: CoachAvailabilitySlot | null) => void;
  fetchAvailability: (coachId: string, date: string) => Promise<void>;
  bookCoach: (payload: BookCoachPayload) => Promise<{ success: boolean; message: string }>;
}

export const useCoachStore = create<CoachState>((set, get) => ({
  coaches: [],
  selectedCoach: null,
  selectedSlot: null,
  availability: [],
  isLoading: false,
  isBooking: false,

  fetchCoaches: async () => {
    set({ isLoading: true });
    try {
      const coaches = await coachService.getCoaches();
      set({ coaches });
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedCoach: (coach) => set({ selectedCoach: coach, availability: [], selectedSlot: null }),

  setSelectedSlot: (slot) => set({ selectedSlot: slot }),

  fetchAvailability: async (coachId, date) => {
    set({ isLoading: true, selectedSlot: null });
    try {
      const availability = await coachService.getCoachAvailability(coachId, date);
      set({ availability });
    } finally {
      set({ isLoading: false });
    }
  },

  bookCoach: async (payload) => {
    const { selectedCoach } = get();
    if (!selectedCoach) {
      return { success: false, message: 'Chưa chọn HLV.' };
    }
    set({ isBooking: true });
    try {
      await coachService.bookCoach({
        coachId: selectedCoach.id,
        sessionDate: payload.sessionDate,
        startTime: payload.startTime,
        endTime: payload.endTime,
      });
      // Refresh availability so the booked slot reflects the new state
      await get().fetchAvailability(selectedCoach.id, payload.sessionDate);
      return { success: true, message: 'Đặt lịch thành công!' };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể đặt lịch.';
      return { success: false, message };
    } finally {
      set({ isBooking: false });
    }
  }
}));
