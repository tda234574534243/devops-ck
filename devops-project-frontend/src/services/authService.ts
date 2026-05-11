import axios from 'axios';
import api from './api';
import { Role } from '../types';

export interface LoginResponse {
  id: string;
  token: string;
  refreshToken?: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface ExternalGoogleLoginRequest {
  idToken?: string;
  authorizationCode?: string;
  redirectUri?: string;
  codeVerifier?: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  },

  externalGoogleLogin: async (payload: ExternalGoogleLoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/external/google', payload);
    return response.data;
  },

  register: async (email: string, password: string, fullName: string, phoneNumber?: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/register', {
      email,
      password,
      fullName,
      phoneNumber,
    });
    return response.data;
  },

  sendOtp: async (email: string) => {
    const response = await api.post('/auth/send-otp', { email });
    return response.data;
  },

  verifyOtp: async (email: string, otp: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/active', { email, otp });
    return response.data;
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await axios.post<LoginResponse>(`${api.defaults.baseURL}/auth/refresh-token`, { refreshToken });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  revokeToken: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/revoke-token', { refreshToken });
  },
};
