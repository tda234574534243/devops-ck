import { Role } from '../types';
import { useAuthStore } from '../stores/authStore';

export const getDefaultRouteForRole = (role: Role) => {
  switch (role) {
    case 'Admin':
      return '/admin';
    case 'Staff':
      return '/staff';
    case 'Customer':
    default:
      return '/floor-plan';
  }
};

export const useAuth = () => {
  const { user, token, isAuthenticated, login, logout } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    hasRole: (roles: string[]) => user && roles.includes(user.role),
  };
};
