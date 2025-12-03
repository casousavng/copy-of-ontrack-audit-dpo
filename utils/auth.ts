import { UserRole } from '../types';

export const getCurrentUser = () => {
  const auth = localStorage.getItem('ontrack_auth');
  if (!auth) return null;
  return JSON.parse(auth);
};

export const hasRole = (role: UserRole): boolean => {
  const user = getCurrentUser();
  if (!user || !user.roles || !Array.isArray(user.roles)) return false;
  return user.roles.includes(role);
};

export const logout = () => {
  localStorage.removeItem('ontrack_auth');
};
