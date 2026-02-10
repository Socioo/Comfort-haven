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