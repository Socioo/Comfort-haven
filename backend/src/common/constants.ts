export enum UserRole {
  USER = 'user',
  HOST = 'host',
  SUPER_ADMIN = 'super-admin',
  MANAGER = 'manager',
  FINANCE = 'finance',
  SUPPORT = 'support',
  ADMIN = 'admin',
  SUB_ADMIN = 'sub-admin',
}

export const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
export const JWT_EXPIRATION = '7d';