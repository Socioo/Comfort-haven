export enum UserRole {
  USER = 'user',
  HOST = 'host',
  ADMIN = 'admin'
}

export const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
export const JWT_EXPIRATION = '7d';