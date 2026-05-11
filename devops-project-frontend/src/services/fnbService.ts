import api from './api';
import { FnBMenuItem } from '../types';

export const fnbService = {
  getMenuItems: async (): Promise<FnBMenuItem[]> => {
    try {
      const response = await api.get<FnBMenuItem[]>('/fnb/menu');
      return response.data;
    } catch (error) {
      console.error("Failed to fetch fnb menu", error);
      return [];
    }
  },
  createOrderForSession: async (sessionId: string, items: { menuItemId: number, quantity: number }[]) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/fnb`, { items });
      return response.data;
    } catch (error) {
      console.error("Failed to create fnb order", error);
      throw error;
    }
  }
};
