import { useState, useEffect } from 'react';
import api from '../services/api';
import styles from '../styles/Pages.module.css';
import { Check, X, Eye, AlertTriangle } from 'lucide-react';
import classNames from 'classnames';

interface Property {
  id: string;
  title: string;
  location: string;
  host: string;
  price: number;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
}

// Mock Data Removed

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch properties on mount
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      // Map backend response if needed. Assuming backend returns array of Property with owner object.
      // We map owner.name to host for table display if interface requires it, or update interface.
      // Let's update the state directly assuming backend matches or we adjust below.
      // Backend Property: { ..., owner: { name: '...' } }
      // Frontend Property Interface: { ..., host: string }
      // So we need to map.
      const mappedProperties = response.data.map((p: any) => ({
        ...p,
        host: p.owner?.name || 'Unknown',
        price: Number(p.price), // Ensure number
      }));
      setProperties(mappedProperties);
    } catch (error) {
      console.error('Failed to fetch properties', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Property['status']) => {
    // Optimistic update
    const previousProperties = [...properties];
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));

    try {
      await api.patch(`/properties/${id}`, { status: newStatus });
    } catch (error) {
      console.error('Failed to update status', error);
      // Revert on failure
      setProperties(previousProperties);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className={styles.header}>
        <h1>Properties Management</h1>
        <div className={styles.controls}>
          <button className={classNames(styles.btn, styles.primary)}>Add Property (Admin)</button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Location</th>
              <th>Host</th>
              <th>Price/Night</th>
              <th>Status</th>
              <th>Date Listed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map(property => (
              <tr key={property.id}>
                <td>{property.title}</td>
                <td>{property.location}</td>
                <td>{property.host}</td>
                <td>${property.price}</td>
                <td>
                  <span className={classNames(styles.status, styles[property.status])}>
                    {property.status}
                  </span>
                </td>
                <td>{new Date(property.createdAt).toLocaleDateString()}</td>
                <td className={styles.actions}>
                  <button className={styles.btn} title="View Details"><Eye size={16} /></button>
                  {property.status === 'pending' && (
                    <>
                      <button 
                        className={classNames(styles.btn, styles.success)} 
                        onClick={() => handleStatusChange(property.id, 'active')}
                        title="Approve"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        className={classNames(styles.btn, styles.danger)}
                        onClick={() => handleStatusChange(property.id, 'suspended')} // Or rejected
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                  {property.status === 'active' && (
                    <button 
                      className={classNames(styles.btn, styles.danger)}
                      onClick={() => handleStatusChange(property.id, 'suspended')}
                      title="Suspend"
                    >
                      <AlertTriangle size={16} />
                    </button>
                  )}
                   {property.status === 'suspended' && (
                    <button 
                      className={classNames(styles.btn, styles.success)}
                      onClick={() => handleStatusChange(property.id, 'active')}
                      title="Activate"
                    >
                      <Check size={16} />
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

export default Properties;
