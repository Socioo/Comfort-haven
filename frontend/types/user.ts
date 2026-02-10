export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'host' | 'admin';
  profileImage?: string;
  phoneNumber?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // For compatibility with your existing code
  name?: string;
  photoUrl?: string;
  phone?: string;
}