import { useState, useEffect } from "react";
import { Bell, Clock, User, Home, Info, Check } from "lucide-react";
import classNames from "classnames";
import { adminAPI } from "../services/api";
import styles from "../styles/Notifications.module.css";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await adminAPI.getNotifications();
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await adminAPI.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      // Assuming endpoint exists or we do it sequentially for now
      // Real app should have a bulk endpoint
      const unread = notifications.filter(n => !n.isRead);
      await Promise.all(unread.map(n => adminAPI.markNotificationAsRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'user': return <User size={20} />;
      case 'property': return <Home size={20} />;
      default: return <Info size={20} />;
    }
  };

  const getIconClass = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'user': return styles.iconUser;
      case 'property': return styles.iconProperty;
      default: return styles.iconSystem;
    }
  };

  if (loading) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Notifications</h1>
        <div className={styles.controls}>
          <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
            <Check size={16} style={{ marginRight: 8, display: 'inline' }} />
            Mark all read
          </button>
        </div>
      </div>

      <div className={styles.notificationList}>
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={classNames(styles.notificationItem, { [styles.unread]: !n.isRead })}
              onClick={() => !n.isRead && handleMarkAsRead(n.id)}
            >
              {!n.isRead && <div className={styles.unreadIndicator} />}
              <div className={classNames(styles.iconWrapper, getIconClass(n.type))}>
                {getIcon(n.type)}
              </div>
              <div className={styles.content}>
                <div className={styles.header}>
                  <div className={styles.title}>{n.title}</div>
                  <div className={styles.time}>
                    <Clock size={12} />
                    {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className={styles.message}>{n.message}</div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <Bell size={48} className={styles.emptyIcon} />
            <p>You're all caught up! No new notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
