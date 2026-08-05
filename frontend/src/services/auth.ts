import { api } from './api.js';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  theme?: 'light' | 'dark' | 'system';
  language?: 'en' | 'ur_roman' | 'ur';
  createdAt: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    theme?: 'light' | 'dark' | 'system';
    language?: 'en' | 'ur_roman' | 'ur';
  };
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  register: async (data: any): Promise<AuthResponse> => {
    const res = await api.post('/auth/register', data);
    return res.data.data;
  },

  login: async (data: any): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', data);
    return res.data.data;
  },

  logout: async (refreshToken: string | null): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },

  getProfile: async (): Promise<UserProfile> => {
    const res = await api.get('/auth/profile');
    return res.data.data;
  },

  updateProfile: async (data: { name?: string; email?: string; theme?: 'light' | 'dark' | 'system'; language?: 'en' | 'ur_roman' | 'ur' }): Promise<UserProfile> => {
    const res = await api.put('/auth/profile', data);
    return res.data.data;
  },

  changePassword: async (data: any): Promise<void> => {
    await api.put('/auth/change-password', data);
  },

  verifyPassword: async (password: string): Promise<boolean> => {
    const res = await api.post('/auth/verify-password', { password });
    return res.data.data.isValid;
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete('/auth/delete-account');
  },
};
