import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import styles from "../styles/Guests.module.css";
import pageStyles from "../styles/Pages.module.css";
import classNames from "classnames";
import { X, User } from "lucide-react";

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: "user" | "host" | "admin";
  status: "active" | "suspended" | "banned";
  isVerified: boolean;
  profileImage?: string;
  createdAt: string;
  lastActiveAt?: string;
  phone?: string;
}

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  status: string;
  images?: string[];
}

const getImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  // If the url already includes /uploads, just prepend the baseUrl
  // Otherwise, ensure there's a leading slash
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface UserModalProps {
  userId: string;
  onClose: () => void;
  onUpdate?: () => void;
}

const UserModal = ({ userId, onClose, onUpdate }: UserModalProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get(`/users/${userId}`);
        setUser(response.data);
        
        if (response.data.role === 'host') {
            try {
                const propsRes = await api.get(`/properties/host/${userId}`);
                setProperties(propsRes.data);
            } catch (err) {
                console.error("Failed to fetch host properties", err);
            }
        }
      } catch (err) {
        console.error("Failed to fetch user details", err);
        setError("Failed to load user details.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUser();
  }, [userId]);

  const handleToggleSuspend = async () => {
      const newStatus = user?.status === 'active' ? 'suspended' : 'active';
      try {
          await api.patch(`/users/${userId}/status`, { status: newStatus });
          setUser(prev => prev ? { ...prev, status: newStatus } : null);
          onUpdate?.();
      } catch (error) {
          console.error("Failed to update status", error);
          alert("Failed to update user status.");
      }
  };

  const handleToggleBan = async () => {
      const newStatus = user?.status === 'banned' ? 'active' : 'banned';
      try {
          await api.patch(`/users/${userId}/status`, { status: newStatus });
          setUser(prev => prev ? { ...prev, status: newStatus } : null);
          onUpdate?.();
      } catch (error) {
          console.error("Failed to update status", error);
          alert("Failed to update user status.");
      }
  };

  const handleVerify = async () => {
      try {
          await api.patch(`/users/${userId}/verify`);
          setUser(prev => prev ? { ...prev, isVerified: true, status: 'active' } : null);
          onUpdate?.();
          alert("Host verified successfully!");
      } catch (error: any) {
          console.error("Failed to verify host", error);
          const msg = error.response?.data?.message || error.message || "Unknown error";
          alert(`Failed to verify host: ${msg}`);
      }
  };

  if (loading) return null; // Or a loading spinner modal

  if (error || !user) {
    return (
      <div className={pageStyles.modalOverlay} onClick={onClose}>
        <div className={pageStyles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={pageStyles.modalHeader}>
            <h2 style={{ color: 'var(--error-color)', fontWeight: '600' }}>{error || "User not found"}</h2>
            <button className={pageStyles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mockPhone = user.phone || "+234 90377272";
  const daysJoined = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 3600 * 24));
  const joinedText = daysJoined === 0 ? "Today" : `Last ${daysJoined} days`;

  return (
    <div className={pageStyles.modalOverlay} onClick={onClose} style={{ zIndex: 1050 }}>
      <div className={pageStyles.modalWrapper} onClick={(e) => e.stopPropagation()}>
        <div className={pageStyles.modalDetailCard}>
          <div 
            className={pageStyles.modalHeader} 
            style={{ 
              padding: '24px 32px 20px', 
              borderBottom: '1px solid var(--border-color)', 
              margin: '0',
              position: 'sticky',
              top: 0,
              background: 'var(--card-bg)',
              zIndex: 10
            }}
          >
             <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div 
                  style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    background: 'var(--bg-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '2px solid var(--border-color)'
                  }}
                >
                    {user.profileImage ? (
                        <img 
                          src={getImageUrl(user.profileImage)} 
                          alt={user.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          crossOrigin="anonymous"
                          onError={(e) => {
                            console.error('Modal user image load error:', e.currentTarget.src);
                            e.currentTarget.style.display = "none";
                          }}
                        />
                    ) : (
                        <User size={32} color="var(--text-light)" />
                    )}
                </div>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 'bold' }}>{user.name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', textTransform: 'capitalize' }}>{user.role}</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-color)' }} />
                    <span className={classNames(styles.statusBadge, styles[user.status])} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                      {user.status}
                    </span>
                  </div>
                </div>
            </div>
            <button 
              className={pageStyles.closeBtn} 
              onClick={onClose} 
              style={{ 
                alignSelf: 'flex-start', 
                background: 'var(--bg-color)', 
                color: 'var(--text-light)',
                marginTop: '8px'
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '32px', overflowY: 'auto' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '24px',
              background: 'var(--bg-color)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: '500' }}>Date joined</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>{joinedText}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: '500' }}>Email</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>{user.email}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: '500' }}>Phone number</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>{mockPhone}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: '500' }}>Reported</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>No</span>
                </div>
            </div>

            {user.role === 'host' && (
              <div className={styles.detailCard} style={{ marginTop: '24px', padding: '16px', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginTop: 0, marginBottom: '16px' }}>
                  Properties ({properties.length})
                </h3>
                {properties.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                      {properties.map(property => (
                          <div key={property.id} style={{ 
                              border: '1px solid var(--border-color)', 
                              borderRadius: '12px', 
                              overflow: 'hidden',
                              cursor: 'pointer',
                              background: 'var(--card-bg)',
                              transition: 'transform 0.2s, box-shadow 0.2s'
                          }} 
                          onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                          }}
                          onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                          }}
                          onClick={() => {
                              onClose();
                              navigate(`/properties/${property.id}`);
                          }}>
                              <div style={{ width: '100%', height: '140px', background: '#f8fafc' }}>
                                  {property.images && property.images.length > 0 ? (
                                      <img 
                                        src={getImageUrl(property.images[0])} 
                                        alt={property.title} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        crossOrigin="anonymous"
                                        onError={(e) => {
                                          console.error('Modal property image load error:', e.currentTarget.src);
                                          e.currentTarget.style.display = "none";
                                        }}
                                      />
                                  ) : (
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>No Image</div>
                                  )}
                              </div>
                              <div style={{ padding: '16px' }}>
                                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '600' }}>{property.title}</h4>
                                  <p style={{ margin: '0 0 8px 0', color: 'var(--text-light)', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{property.location}</p>
                                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>₦{property.price.toLocaleString()} / night</div>
                              </div>
                          </div>
                      ))}
                  </div>
                ) : (
                   <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>This host has no properties yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={pageStyles.modalActionCard}>
          <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '500px' }}>
              {user.role === 'host' && !user.isVerified && (
                  <button 
                      onClick={handleVerify}
                      style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', flex: 1, minWidth: '160px', transition: 'background 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
                  >
                      Verify Host
                  </button>
              )}
              <button 
                  onClick={handleToggleSuspend}
                  style={{ background: user.status === 'suspended' ? '#3b82f6' : '#f59e0b', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', flex: 1, minWidth: '160px', transition: 'background 0.2s' }}
                  disabled={user.status === 'banned'}
                  onMouseOver={(e) => e.currentTarget.style.background = user.status === 'suspended' ? '#2563eb' : '#d97706'}
                  onMouseOut={(e) => e.currentTarget.style.background = user.status === 'suspended' ? '#3b82f6' : '#f59e0b'}
              >
                  {user.status === 'suspended' ? 'Restore account' : 'Suspend account'}
              </button>
              <button 
                  onClick={handleToggleBan}
                  style={{ background: user.status === 'banned' ? '#3b82f6' : '#ef4444', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', flex: 1, minWidth: '160px', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = user.status === 'banned' ? '#2563eb' : '#dc2626'}
                  onMouseOut={(e) => e.currentTarget.style.background = user.status === 'banned' ? '#3b82f6' : '#ef4444'}
              >
                  {user.status === 'banned' ? 'Unban account' : 'Ban account'}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
