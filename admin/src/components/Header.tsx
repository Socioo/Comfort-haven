import { useState, useEffect, useRef } from "react";
import { Bell, Mail, Clock } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import UserAvatar from "./UserAvatar";
import styles from "./Header.module.css";
import { adminAPI } from "../services/api";
import classNames from "classnames";

const Header = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMessages, setShowMessages] = useState(false);
    
    const notifyRef = useRef<HTMLDivElement>(null);
    const messageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const [msgRes, notifyRes, listRes] = await Promise.all([
                    adminAPI.getInboxSummary(),
                    adminAPI.getUnreadNotifications(),
                    adminAPI.getNotifications(),
                ]);

                const totalUnreadMsgs = msgRes.data.reduce((acc: number, conv: any) => acc + (conv.unreadCount || 0), 0);
                setUnreadMessages(totalUnreadMsgs);
                setUnreadNotifications(notifyRes.data.count || 0);
                setNotifications(listRes.data);
                
                // For demo, we'll use the inbox summary as 'recent messages'
                setMessages(msgRes.data.slice(0, 5)); 
            } catch (error) {
                console.error("Failed to fetch header counts", error);
            }
        };

        fetchCounts();
        const interval = setInterval(fetchCounts, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifyRef.current && !notifyRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
                setShowMessages(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await adminAPI.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadNotifications(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.actions}>
                <div style={{ position: 'relative' }} ref={messageRef}>
                    <button 
                        className={classNames(styles.actionBtn, { [styles.active]: showMessages })} 
                        title="Messages"
                        onClick={() => {
                            setShowMessages(!showMessages);
                            setShowNotifications(false);
                        }}
                    >
                        <Mail size={20} />
                        {unreadMessages > 0 && <span className={styles.badge}>{unreadMessages}</span>}
                    </button>

                    {showMessages && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownHeader}>
                                <h3>Messages</h3>
                                <Link to="/support" className={styles.markAllRead} onClick={() => setShowMessages(false)}>Support Page</Link>
                            </div>
                            <div className={styles.notificationList}>
                                {messages.length > 0 ? (
                                    messages.map((m) => (
                                        <div 
                                            key={m.id} 
                                            className={styles.notificationItem}
                                            onClick={() => {
                                                navigate('/support');
                                                setShowMessages(false);
                                            }}
                                        >
                                            <div className={styles.msgAvatar}>
                                                {m.lastMessage?.sender?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className={styles.notificationContent}>
                                                <div className={styles.notificationTitle}>{m.lastMessage?.sender?.name || 'User'}</div>
                                                <div className={styles.notificationMessage}>{m.lastMessage?.content || 'New support request'}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.emptyState}>No messages</div>
                                )}
                            </div>
                            <div className={styles.dropdownFooter}>
                                <Link to="/support" className={styles.viewAll} onClick={() => setShowMessages(false)}>View all messages</Link>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ position: 'relative' }} ref={notifyRef}>
                    <button
                        className={classNames(styles.actionBtn, { [styles.active]: showNotifications })}
                        title="Notifications"
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            setShowMessages(false);
                        }}
                    >
                        <Bell size={20} />
                        {unreadNotifications > 0 && <span className={styles.badge}>{unreadNotifications}</span>}
                    </button>

                    {showNotifications && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownHeader}>
                                <h3>Notifications</h3>
                                <span className={styles.markAllRead}>Mark all read</span>
                            </div>
                            <div className={styles.notificationList}>
                                {notifications.length > 0 ? (
                                    notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={classNames(styles.notificationItem, { [styles.unread]: !n.isRead })}
                                            onClick={() => handleMarkAsRead(n.id)}
                                        >
                                            <div className={styles.notificationContent}>
                                                <div className={styles.notificationTitle}>{n.title}</div>
                                                <div className={styles.notificationMessage}>{n.message}</div>
                                                <div className={styles.notificationTime}>
                                                    <Clock size={10} style={{ marginRight: 4, display: 'inline' }} />
                                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.emptyState}>No new notifications</div>
                                )}
                            </div>
                            <div className={styles.dropdownFooter}>
                                <Link to="/notifications" className={styles.viewAll} onClick={() => setShowNotifications(false)}>View all notifications</Link>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.divider} />

                <div className={styles.profile}>
                    <UserAvatar
                        name={user?.name}
                        image={user?.profileImage}
                        size={36}
                    />
                    <div className={styles.profileInfo}>
                        <span className={styles.name}>{user?.name || "Admin"}</span>
                        <span className={styles.role}>{user?.role || "Administrator"}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
