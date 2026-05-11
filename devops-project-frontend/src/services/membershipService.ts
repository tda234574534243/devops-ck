import api from './api';
import {
  ApiMessageResponse,
  MembershipPlan,
  SubscribeMembershipRequest,
  SubscribeMembershipResult,
  UserMembership,
} from '../types';

export const membershipService = {
  getPlans: async (): Promise<MembershipPlan[]> => {
    try {
      const response = await api.get<MembershipPlan[]>('/memberships/plans');
      return response.data;
    } catch (error) {
      console.error("Failed to fetch membership plans", error);
      return [];
    }
  },
  
  getMyMembership: async (): Promise<UserMembership | null> => {
    try {
      const response = await api.get<UserMembership>('/memberships/my');
      return response.data;
    } catch (error) {
      return null;
    }
  },
  
  subscribe: async (data: SubscribeMembershipRequest): Promise<SubscribeMembershipResult> => {
    try {
      const response = await api.post<SubscribeMembershipResult>('/memberships/subscribe', data);
      return response.data;
    } catch (error) {
      console.error("Failed to subscribe", error);
      throw error;
    }
  },
  
  cancelAutoRenew: async (): Promise<ApiMessageResponse> => {
    try {
      const response = await api.put<ApiMessageResponse>('/memberships/my/cancel');
      return response.data;
    } catch (error) {
      console.error("Failed to cancel auto renew", error);
      throw error;
    }
  }
};
