import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// IMPORTANT: Replace with your actual backend URL
// For physical devices or Expo Go, use your machine's local IP address (e.g. 192.168.x.x)
const API_BASE_URL = 'http://192.168.43.200:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { access_token, refresh_token } = response.data;
          
          // Save new tokens
          await AsyncStorage.setItem('access_token', access_token);
          await AsyncStorage.setItem('refresh_token', refresh_token);
          
          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        await AsyncStorage.removeItem('user');
        
        // You might want to navigate to login screen here
        // import { router } from 'expo-router';
        // router.push('/auth/login');
      }
    }
    
    return Promise.reject(error);
  }
);

// OAuth Authentication
export const authAPI = {
  // Standard Login
  login: (data: any) => api.post('/auth/login', data),

  // Standard Register
  register: (data: any) => api.post('/auth/signup', data),

  // OAuth Login
  oauthLogin: (provider: string, token: string) =>
    api.post(`/auth/${provider}/login`, { token }),
  
  // Register with OAuth
  oauthRegister: (provider: string, userData: any) =>
    api.post(`/auth/${provider}/register`, userData),
  
  // Refresh token
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  
  // Logout
  logout: () => api.post('/auth/logout'),
  
  // Get profile
  getProfile: () => api.get('/auth/profile'),
  
  // Update profile
  updateProfile: (userData: any) => api.patch('/auth/profile', userData),
};

// Properties API (adjust endpoints based on your NestJS routes)
export const propertiesAPI = {
  // Get all properties
  getAll: (params?: any) => api.get('/properties', { params }),
  
  // Get property by ID
  getById: (id: string) => api.get(`/properties/${id}`),
  
  // Create property
  create: (propertyData: any) => api.post('/properties', propertyData),
  
  // Update property
  update: (id: string, updates: any) => api.patch(`/properties/${id}`, updates),
  
  // Delete property
  delete: (id: string) => api.delete(`/properties/${id}`),
  
  // Get host properties
  getByHost: (hostId: string) => api.get(`/properties/host/${hostId}`),
  
  // Search properties
  search: (query: any) => api.post('/properties/search', query),
};

// Bookings API
export const bookingsAPI = {
  // Get all bookings
  getAll: () => api.get('/bookings'),
  
  // Get booking by ID
  getById: (id: string) => api.get(`/bookings/${id}`),
  
  // Create booking
  create: (bookingData: any) => api.post('/bookings', bookingData),
  
  // Update booking
  update: (id: string, updates: any) => api.patch(`/bookings/${id}`, updates),
  
  // Cancel booking
  cancel: (id: string) => api.post(`/bookings/${id}/cancel`),
  
  // Get user bookings
  getUserBookings: (userId: string) => api.get(`/bookings/user/${userId}`),
  
  // Get property bookings
  getPropertyBookings: (propertyId: string) => api.get(`/bookings/property/${propertyId}`),
};

// Favorites API
export const favoritesAPI = {
  // Get favorites
  getAll: () => api.get('/favorites'),
  
  // Add to favorites
  add: (propertyId: string) => api.post(`/favorites/${propertyId}`),
  
  // Remove from favorites
  remove: (propertyId: string) => api.delete(`/favorites/${propertyId}`),
  
  // Check if favorite
  check: (propertyId: string) => api.get(`/favorites/${propertyId}/check`),
};

// Reviews API
export const reviewsAPI = {
  // Get property reviews
  getByProperty: (propertyId: string) => api.get(`/reviews/property/${propertyId}`),
  
  // Create review
  create: (reviewData: any) => api.post('/reviews', reviewData),
  
  // Update review
  update: (id: string, updates: any) => api.patch(`/reviews/${id}`, updates),
  
  // Delete review
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

// Users API
export const usersAPI = {
  // Get user by ID
  getById: (id: string) => api.get(`/users/${id}`),
  
  // Get all users (filterable by role)
  getAll: (role?: string) => api.get('/users', { params: { role } }),
  
  // Update user status (admin)
  updateStatus: (id: string, status: string) => api.patch(`/users/${id}/status`, { status }),
};

// Messages API
export const messagesAPI = {
  getInbox: () => api.get('/messages/inbox'),
  getChatHistory: (userId: string) => api.get(`/messages/${userId}`),
  sendMessage: (receiverId: string, content: string) => api.post('/messages', { receiverId, content }),
};

export default api;