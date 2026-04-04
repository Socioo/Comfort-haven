import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { notificationsAPI } from '../services/api';
import { useAuth } from './auth';

interface NotificationsContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
});

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data?.count ?? 0);
    } catch (error) {
      // Silently fail - non-critical
    }
  }, [user]);

  // Poll for new notifications every 60 seconds when logged in
  useEffect(() => {
    if (!user) return;
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [user, refreshUnreadCount]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
