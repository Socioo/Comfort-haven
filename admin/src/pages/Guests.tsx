import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import styles from "../styles/Guests.module.css";
import { Search } from "lucide-react";
import classNames from "classnames";
import { User } from "lucide-react";

interface Guest {
  id: string;
  name: string;
  email: string;
  status: "active" | "suspended" | "banned";
  profileImage?: string;
  lastActiveAt?: string;
  createdAt: string;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? 'N/A' : d.toISOString().split('T')[0];
};

const formatTime = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Guests = () => {
  const navigate = useNavigate();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      const response = await api.get("/users?role=user");
      setGuests(response.data);
    } catch (error) {
      console.error("Failed to fetch guests", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = guests.length;
    const active = guests.filter(g => g.status === 'active').length;
    const inactive = guests.filter(g => g.status !== 'active').length;
    // Mock metric per screenshot
    const totalBookings = Math.max(Math.floor(total * 1.5), 1); 
    return { total, active, inactive, totalBookings };
  }, [guests]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Guest record</h1>
          <div className={styles.searchBar}>
              <Search size={18} color="var(--text-light)" />
              <input 
                  type="text" 
                  placeholder="search menu" 
                  className={styles.searchInput}
              />
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
          <div className={styles.statCardSolid}>
              <span className={styles.statLabel}>Total guests</span>
              <span className={styles.statValue}>{stats.total}</span>
          </div>
          <div className={styles.statCardLight}>
              <span className={styles.statLabel}>Active guests</span>
              <span className={styles.statValue}>{stats.active}</span>
          </div>
          <div className={styles.statCardLight}>
              <span className={styles.statLabel}>Not active guests</span>
              <span className={styles.statValue}>{stats.inactive}</span>
          </div>
          <div className={styles.statCardSolid}>
              <span className={styles.statLabel}>Total guests bookings</span>
              <span className={styles.statValue}>{stats.totalBookings}</span>
          </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.customTable}>
          <thead>
            <tr>
              <th>Date joined</th>
              <th>Status</th>
              <th>User name</th>
              <th>Email address</th>
              <th>Location</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <tr key={guest.id}>
                <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{formatDate(guest.createdAt)}</span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            {formatTime(guest.createdAt)}
                        </span>
                    </div>
                </td>
                <td>
                  <span
                    className={classNames(styles.statusBadge, styles[guest.status])}
                  >
                    {guest.status}
                  </span>
                </td>
                <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={styles.avatarContainer}>
                            {guest.profileImage ? (
                                <img src={guest.profileImage} alt={guest.name} className={styles.avatarImage} />
                            ) : (
                                <User size={16} color="#94a3b8" />
                            )}
                        </div>
                        <span style={{ fontWeight: 500 }}>{guest.name}</span>
                    </div>
                </td>
                <td>{guest.email}</td>
                {/* Mock data point for layout fidelity to Figma screenshot */}
                <td>Abuja, Nigeria</td> 
                <td style={{ textAlign: 'right' }}>
                  <button
                    className={styles.viewBtn}
                    onClick={() => navigate(`/guests/${guest.id}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Guests;
