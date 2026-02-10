import { useState, useEffect } from 'react';
import api from '../services/api';
import styles from '../styles/Pages.module.css';
import { Ban, CheckCircle, Eye, UserCheck } from 'lucide-react';
import classNames from 'classnames';

interface Host {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  status: 'active' | 'suspended' | 'banned';
  propertiesCount: number;
}

// Mock Data Removed

const Hosts = () => {
  const [hosts, setHosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHosts();
  }, []);

  const fetchHosts = async () => {
    try {
      const response = await api.get('/users?role=host');
      setHosts(response.data);
    } catch (error) {
      console.error('Failed to fetch hosts', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
      // Optimistic
      const prevHosts = [...hosts];
      setHosts(prev => prev.map(h => h.id === id ? { ...h, status: newStatus } : h));

      try {
          await api.patch(`/users/${id}/status`, { status: newStatus });
      } catch (error) {
          console.error('Failed to update status', error);
          setHosts(prevHosts);
      }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className={styles.header}>
        <h1>Hosts Management</h1>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
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
            {hosts.map(host => (
              <tr key={host.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e3f2fd', color: '#2196f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserCheck size={16} />
                     </div>
                     {host.name}
                  </div>
                </td>
                <td>{host.email}</td>
                <td>{host.isVerified ? <span style={{ color: 'green' }}>Yes</span> : <span style={{ color: 'orange' }}>Pending</span>}</td>
                <td>{host.propertiesCount || 0}</td>
                <td>
                   <span className={classNames(styles.status, styles[host.status])}>
                    {host.status}
                  </span>
                </td>
                <td className={styles.actions}>
                  <button className={styles.btn} title="View Profile"><Eye size={16} /></button>
                   {host.status === 'active' ? (
                     <button 
                        className={classNames(styles.btn, styles.danger)} 
                        title="Ban Host"
                        onClick={() => handleStatusChange(host.id, 'banned')}
                    >
                        <Ban size={16} />
                    </button>
                  ) : (
                     <button 
                        className={classNames(styles.btn, styles.success)} 
                        title="Unban Host"
                        onClick={() => handleStatusChange(host.id, 'active')}
                    >
                        <CheckCircle size={16} />
                    </button>
                  )}
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
