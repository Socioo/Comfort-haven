import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const adminAPI = {
  getProfile: (id: string) => api.get(`/users/${id}`),
  updateProfile: (id: string, data: any) => api.patch(`/users/${id}/profile`, data),
  updateNotifications: (id: string, data: any) =>
    api.patch(`/users/${id}/notifications`, data),
  updateAppearance: (id: string, data: any) =>
    api.patch(`/users/${id}/appearance`, data),
  updatePassword: (id: string, data: any) =>
    api.patch(`/users/${id}/password`, data),
  getUnreadNotifications: () => api.get('/notifications/unread-count'),
  getNotifications: () => api.get('/notifications'),
  markNotificationAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.post('/notifications/read-all'),
  clearAllNotifications: () => api.delete('/notifications/clear-all'),
  getInboxSummary: () => api.get('/messages/inbox'),
  markAllMessagesAsRead: () => api.patch('/messages/mark-all-read'),
  clearAllMessages: () => api.delete('/messages/clear-all'),
};

export const settingsAPI = {
  getAll: () => api.get('/settings'),
  getByGroup: (group: string) => api.get(`/settings/group/${group}`),
  updateMany: (settings: { key: string; value: string }[]) => api.patch('/settings', { settings }),
};

export const faqAPI = {
  getAll: () => api.get('/faqs'),
  getOne: (id: string) => api.get(`/faqs/${id}`),
  create: (data: any) => api.post('/faqs', data),
  update: (id: string, data: any) => api.put(`/faqs/${id}`, data),
  delete: (id: string) => api.delete(`/faqs/${id}`),
};

export default api;
