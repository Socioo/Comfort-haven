export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profileImage?: string;
  phone?: string;
  // For UI fallbacks
  firstName?: string;
  lastName?: string;
  photoUrl?: string; // This will map to profileImage from backend
  notifications?: {
    newProperties: boolean;
    newBookings: boolean;
    marketing: boolean;
    propertyApproval: boolean;
    verificationStatus: boolean;
  };
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
}

export type UserRole = 'user' | 'host' | 'admin';