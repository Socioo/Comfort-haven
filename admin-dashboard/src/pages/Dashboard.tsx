import { useState, useEffect } from 'react';
import api from '../services/api';
import styles from '../styles/Dashboard.module.css';
import { Users, Home, Calendar, DollarSign } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProperties: 0,
        totalBookings: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Overview of system performance.</p>

      <div className={styles.grid}>
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Total Users</span>
                <Users className={styles.icon} size={24} />
            </div>
            <h3 className={styles.cardValue}>{stats.totalUsers}</h3>
            <span className={styles.cardTrend}>
                <span className={styles.trendUp}>+12%</span> from last month
            </span>
        </div>

        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Active Properties</span>
                <Home className={styles.icon} size={24} />
            </div>
            <h3 className={styles.cardValue}>{stats.totalProperties}</h3>
            <span className={styles.cardTrend}>
                <span className={styles.trendUp}>+5%</span> from last month
            </span>
        </div>

        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Active Bookings</span>
                <Calendar className={styles.icon} size={24} />
            </div>
            <h3 className={styles.cardValue}>{stats.totalBookings}</h3>
            <span className={styles.cardTrend}>
                <span className={styles.trendDown}>-2%</span> from last week
            </span>
        </div>

        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Total Revenue</span>
                <DollarSign className={styles.icon} size={24} />
            </div>
            <h3 className={styles.cardValue}>${stats.totalRevenue.toLocaleString()}</h3>
             <span className={styles.cardTrend}>
                <span className={styles.trendUp}>+18%</span> from last month
            </span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
