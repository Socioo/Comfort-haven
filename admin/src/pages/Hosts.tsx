import { useState, useEffect, useMemo } from "react";

import api from "../services/api";
import styles from "../styles/Guests.module.css";
import { Search } from "lucide-react";
import classNames from "classnames";
import UserAvatar from "../components/UserAvatar";
import UserModal from "../components/UserModal";
import Pagination from "../components/Pagination";
import NotificationModal from "../components/NotificationModal";
import type { NotificationType } from "../components/NotificationModal";


// Mock Data Removed

interface Host {
  id: string;
  name: string;
  email: string;
  status: string;
  isVerified: boolean;
  profileImage?: string;
  properties?: any[]; // For accurate counting
}


const Hosts = () => {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [notification, setNotification] = useState<{ isOpen: boolean; type: NotificationType; title: string; message: string }>({
    isOpen: false,
    type: "info",
    title: "",
    message: ""
  });

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

  const handleVerify = async (id: string) => {
    try {
      await api.patch(`/users/${id}/verify`);
      fetchHosts();
      setNotification({
        isOpen: true,
        type: "success",
        title: "Host Verified",
        message: "Host has been verified successfully!"
      });
    } catch (error: any) {
      console.error("Failed to verify host", error);
      const msg = error.response?.data?.message || error.message || "Unknown error";
      setNotification({
        isOpen: true,
        type: "error",
        title: "Verification Failed",
        message: `Failed to verify host: ${msg}`
      });
    }
  };


  const filteredHosts = useMemo(() => {
    return hosts.filter(h => 
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [hosts, searchTerm]);

  const paginatedHosts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHosts.slice(start, start + itemsPerPage);
  }, [filteredHosts, currentPage]);

  const stats = useMemo(() => {
    const total = hosts.length;
    const active = hosts.filter(h => h.status === 'active').length;
    const pending = hosts.filter(h => !h.isVerified).length;
    const suspended = hosts.filter(h => h.status === 'suspended' || h.status === 'banned').length;
    const totalProperties = hosts.reduce((acc, host) => acc + (host.properties?.length || 0), 0);
    return { total, active, pending, suspended, totalProperties };
  }, [hosts]);

  // Reset to first page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              <span className={styles.statLabel}>Suspended hosts</span>
              <span className={styles.statValue}>{stats.suspended}</span>
          </div>
          <div className={styles.statCardSolid}>
              <span className={styles.statLabel}>Total properties</span>
              <span className={styles.statValue}>{stats.totalProperties}</span>
          </div>
          <div className={styles.statCardLight}>
              <span className={styles.statLabel}>Pending approvals</span>
              <span className={styles.statValue}>{stats.pending}</span>
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
            {paginatedHosts.map((host) => (
              <tr key={host.id}>
                <td>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div className={styles.avatarContainer} style={{ background: 'none' }}>
                      <UserAvatar 
                        name={host.name} 
                        image={host.profileImage} 
                        size={32} 
                      />
                    </div>
                    <span>{host.name}</span>
                  </div>
                </td>
                <td>{host.email}</td>
                <td>
                  {host.isVerified ? (
                    <span style={{ color: "var(--success-color)", fontWeight: '600' }}>Yes</span>
                  ) : (
                    <span style={{ color: "var(--warning-color)", fontWeight: '600' }}>Pending</span>
                  )}
                </td>
                <td>{host.properties?.length || 0}</td>
                <td>
                  <span
                    className={classNames(styles.statusBadge, styles[host.status])}
                  >
                    {host.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <button
                      className={styles.viewBtn}
                      title="View Profile"
                      onClick={() => setSelectedUserId(host.id)}
                    >
                      View
                    </button>
                    {!host.isVerified && (
                      <button
                        className={styles.viewBtn} // Using viewBtn style for now, can be customized
                        style={{ backgroundColor: 'var(--success-color)', color: 'white', border: 'none' }}
                        onClick={() => handleVerify(host.id)}
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination 
          currentPage={currentPage}
          totalItems={filteredHosts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
      {selectedUserId && (
        <UserModal 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
          onUpdate={fetchHosts}
        />
      )}
      
      {notification.isOpen && (
        <NotificationModal 
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification({ ...notification, isOpen: false })}
        />
      )}
    </div>
  );
};

export default Hosts;
