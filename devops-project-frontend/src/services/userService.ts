import api from './api';
import { ApiMessageResponse, UpdateProfileRequest, UserProfile } from '../types';

export const userService = {
  getProfile: async (): Promise<UserProfile | null> => {
    try {
      const response = await api.get<UserProfile>('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Failed to load user profile', error);
      return null;
    }
  },
  
  updateProfile: async (data: UpdateProfileRequest): Promise<ApiMessageResponse> => {
    try {
      const response = await api.put<ApiMessageResponse>('/users/profile', data);
      return response.data;
    } catch (error) {
      console.error('Failed to update profile', error);
      throw error;
    }
  }
};
