import { useState, useEffect } from 'react';
import api from '../services/api';
import styles from '../styles/Pages.module.css';
import classNames from 'classnames';

const Bookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      // Map response to match table structure if needed
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className={styles.header}>
        <h1>Bookings Management</h1>
      </div>
      <div className={styles.tableContainer}>
         <table className={styles.table}>
            <thead>
                <tr>
                    <th>Property</th>
                    <th>Guest</th>
                    <th>Dates</th>
                    <th>Total</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {bookings.map(b => (
                    <tr key={b.id}>
                        <td>{b.property?.title || 'Unknown'}</td>
                        <td>{b.guest?.name || 'Unknown'}</td>
                        <td>{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</td>
                        <td>${b.totalPrice}</td>
                        <td>
                            <span className={classNames(styles.status, b.status === 'confirmed' || b.status === 'completed' ? styles.success : b.status === 'cancelled' ? styles.danger : styles.warning)}>
                                {b.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default Bookings;
