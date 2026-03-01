import axios from 'axios';

const api = axios.create({
    baseURL: 'http://192.168.43.200:3000', // Adjust if backend is on different port or IP changes
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
};

export default api;
