import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import styles from "../styles/Guests.module.css";
import { Search, User } from "lucide-react";
import classNames from "classnames";


// Mock Data Removed

interface Host {
  id: string;
  name: string;
  email: string;
  status: string;
  isVerified: boolean;
  profileImage?: string;
  propertiesCount?: number;
}

const Hosts = () => {
  const navigate = useNavigate();
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHosts();
  }, []);

  const fetchHosts = async () => {
    try {
      const response = await api.get("/users?role=host");
      setHosts(response.data);
    } catch (error) {
      console.error("Failed to fetch hosts", error);
    } finally {
      setLoading(false);
    }
  };


  const stats = useMemo(() => {
    const total = hosts.length;
    const active = hosts.filter(h => h.status === 'active').length;
    const pending = hosts.filter(h => !h.isVerified).length;
    const totalProperties = hosts.reduce((acc, host) => acc + (host.propertiesCount || 0), 0);
    return { total, active, pending, totalProperties };
  }, [hosts]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Host record</h1>
          <div className={styles.searchBar}>
              <Search size={18} color="#94a3b8" />
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
              <span className={styles.statLabel}>Total hosts</span>
              <span className={styles.statValue}>{stats.total}</span>
          </div>
          <div className={styles.statCardLight}>
              <span className={styles.statLabel}>Active hosts</span>
              <span className={styles.statValue}>{stats.active}</span>
          </div>
          <div className={styles.statCardLight}>
              <span className={styles.statLabel}>Pending hosts</span>
              <span className={styles.statValue}>{stats.pending}</span>
          </div>
          <div className={styles.statCardSolid}>
              <span className={styles.statLabel}>Total properties</span>
              <span className={styles.statValue}>{stats.totalProperties}</span>
          </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.customTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Verified</th>
              <th>Properties</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hosts.map((host) => (
              <tr key={host.id}>
                <td>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div className={styles.avatarContainer}>
                      {host.profileImage ? (
                        <img
                          src={host.profileImage}
                          alt={host.name}
                          className={styles.avatarImage}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <User size={16} color="#94a3b8" />
                      )}
                    </div>
                    <span>{host.name}</span>
                  </div>
                </td>
                <td>{host.email}</td>
                <td>
                  {host.isVerified ? (
                    <span style={{ color: "green" }}>Yes</span>
                  ) : (
                    <span style={{ color: "orange" }}>Pending</span>
                  )}
                </td>
                <td>{host.propertiesCount || 0}</td>
                <td>
                  <span
                    className={classNames(styles.statusBadge, styles[host.status])}
                  >
                    {host.status}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    className={styles.viewBtn}
                    title="View Profile"
                    onClick={() => navigate(`/hosts/${host.id}`)}
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

export default Hosts;
