import { api } from './api.js';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  recitationsCount: number;
  totalAyahs: number;
  createdAt: string;
}

export const adminApi = {
  getAllUsers: async (): Promise<AdminUser[]> => {
    const res = await api.get('/admin/users');
    return res.data.data;
  },

  updateUserRole: async (id: string, role: 'user' | 'admin'): Promise<any> => {
    const res = await api.put(`/admin/users/${id}/role`, { role });
    return res.data;
  },

  deleteUser: async (id: string): Promise<any> => {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  }
};
