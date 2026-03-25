import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import styles from "../styles/Guests.module.css";
import classNames from "classnames";
import { ArrowLeft, User } from "lucide-react";

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
  const baseUrl = 'http://localhost:3000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const UserDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Default values to exactly match Figma screenshot UI mock if undefined
  const [user, setUser] = useState<UserDetail | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get(`/users/${id}`);
        setUser(response.data);
        
        if (response.data.role === 'host') {
            try {
                const propsRes = await api.get(`/properties/host/${id}`);
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

    if (id) fetchUser();
  }, [id]);

  const handleToggleSuspend = async () => {
      const newStatus = user?.status === 'active' ? 'suspended' : 'active';
      try {
          await api.patch(`/users/${id}/status`, { status: newStatus });
          setUser(prev => prev ? { ...prev, status: newStatus } : null);
      } catch (error) {
          console.error("Failed to update status", error);
          alert("Failed to update user status.");
      }
  };

  const handleToggleBan = async () => {
      const newStatus = user?.status === 'banned' ? 'active' : 'banned';
      try {
          await api.patch(`/users/${id}/status`, { status: newStatus });
          setUser(prev => prev ? { ...prev, status: newStatus } : null);
      } catch (error) {
          console.error("Failed to update status", error);
          alert("Failed to update user status.");
      }
  };

  const handleVerify = async () => {
      try {
          await api.patch(`/users/${id}/verify`);
          setUser(prev => prev ? { ...prev, isVerified: true, status: 'active' } : null);
          alert("Host verified successfully!");
      } catch (error: any) {
          console.error("Failed to verify host", error);
          const msg = error.response?.data?.message || error.message || "Unknown error";
          alert(`Failed to verify host: ${msg}`);
      }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!user) return <div>User not found</div>;

  const mockPhone = user.phone || "+234 90377272"; // Mock matching Figma
  const daysJoined = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 3600 * 24));
  const joinedText = daysJoined === 0 ? "Today" : `last ${daysJoined} days`;

  return (
    <div className={styles.detailContainer}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#64748b",
          fontSize: "1rem",
          fontWeight: 500,
        }}
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className={styles.detailCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
            <div className={styles.detailAvatar} style={{ marginBottom: 0 }}>
                {user.profileImage ? (
                    <img src={getImageUrl(user.profileImage)} alt={user.name} className={styles.avatarImage} />
                ) : (
                    <User size={40} color="var(--text-light)" />
                )}
            </div>
            <h1 className={styles.detailName} style={{ margin: 0 }}>{user.name}</h1>
        </div>
        
        <div className={styles.detailList}>
            <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Date joined:</span>
                <span className={styles.detailValue}>{joinedText}</span>
            </div>
            
            <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Bookings Volume:</span>
                <span className={styles.detailValue}>0</span>
            </div>
            
            <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status:</span>
                <span className={styles.detailValue}>
                    <span className={classNames(styles.statusBadge, styles[user.status])}>
                        {user.status}
                    </span>
                </span>
            </div>
            
            <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Reported:</span>
                <span className={styles.detailValue}>No</span>
            </div>
            
            <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Email:</span>
                <span className={styles.detailValue}>{user.email}</span>
            </div>
            
            <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Phone number:</span>
                <span className={styles.detailValue}>{mockPhone}</span>
            </div>
        </div>
      </div>

      {user.role === 'host' && (
        <div className={styles.detailCard} style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginTop: 0, marginBottom: '24px' }}>
            Properties ({properties.length})
          </h2>
          {properties.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {properties.map(property => (
                    <div key={property.id} style={{ 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '12px', 
                        overflow: 'hidden',
                        cursor: 'pointer'
                    }} onClick={() => navigate(`/properties/${property.id}`)}>
                        <div style={{ width: '100%', height: '160px', background: 'var(--bg-color)' }}>
                            {property.images && property.images.length > 0 ? (
                                <img src={getImageUrl(property.images[0])} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : null}
                        </div>
                        <div style={{ padding: '16px' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'var(--text-main)' }}>{property.title}</h3>
                            <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.85rem' }}>{property.location}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>₦{property.price}</span>
                                <span className={classNames(styles.statusBadge, styles[property.status === 'pending' ? 'suspended' : property.status])}>
                                    {property.status}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          ) : (
             <p style={{ color: 'var(--text-light)', margin: 0 }}>This host has no properties yet.</p>
          )}
        </div>
      )}

      <div className={styles.suspendContainer} style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
              {user.role === 'host' && !user.isVerified && (
                  <button 
                      className={styles.suspendBtn} 
                      onClick={handleVerify}
                      style={{ background: 'var(--success-color)' }}
                  >
                      Verify Host
                  </button>
              )}
              <button 
                  className={styles.suspendBtn} 
                  onClick={handleToggleSuspend}
                  style={{ background: user.status === 'suspended' ? 'var(--success-color)' : 'var(--primary-color)' }}
                  disabled={user.status === 'banned'}
              >
                  {user.status === 'suspended' ? 'Restore account' : 'Suspend account'}
              </button>
              <button 
                  className={styles.suspendBtn} 
                  onClick={handleToggleBan}
                  style={{ background: user.status === 'banned' ? 'var(--success-color)' : 'var(--error-color)' }}
              >
                  {user.status === 'banned' ? 'Unban account' : 'Ban account'}
              </button>
          </div>
      </div>
    </div>
  );
};

export default UserDetails;
