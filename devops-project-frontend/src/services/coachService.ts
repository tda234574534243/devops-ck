import api from './api';
import { Coach, CoachAvailabilitySlot } from '../types';

export const coachService = {
  getCoaches: async (): Promise<Coach[]> => {
    try {
      const response = await api.get<Coach[]>('/coaches');
      return response.data;
    } catch (error) {
      console.error("Failed to fetch coaches", error);
      return [];
    }
  },
  
  getCoachAvailability: async (coachId: string, date: string): Promise<CoachAvailabilitySlot[]> => {
    try {
      const response = await api.get<CoachAvailabilitySlot[]>(`/coaches/${coachId}/availability`, { params: { date } });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch coach availability", error);
      return [];
    }
  },

  bookCoach: async (payload: {
    coachId: string;
    sessionDate: string; // yyyy-MM-dd
    startTime: string;   // HH:mm
    endTime: string;     // HH:mm
  }) => {
    const response = await api.post(`/coaches/${payload.coachId}/book`, {
      sessionDate: payload.sessionDate,
      startTime: payload.startTime,
      endTime: payload.endTime
    });
    return response.data;
  }
};
