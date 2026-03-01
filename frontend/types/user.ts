export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'host' | 'admin';
  profileImage?: string;
  phone?: string;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // For backwards compatibility and UI fallbacks
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  phoneNumber?: string;
}