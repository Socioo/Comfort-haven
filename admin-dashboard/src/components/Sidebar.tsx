import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, Home, Calendar, Settings } from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <h2>Comfort Haven</h2>
      </div>
      <nav className={styles.nav}>
        <NavLink to="/" className={({ isActive }: any) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/guests" className={({ isActive }: any) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
          <Users size={20} />
          <span>Guests</span>
        </NavLink>
        <NavLink to="/hosts" className={({ isActive }: any) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
          <UserCheck size={20} />
          <span>Hosts</span>
        </NavLink>
        <NavLink to="/properties" className={({ isActive }: any) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
          <Home size={20} />
          <span>Properties</span>
        </NavLink>
        <NavLink to="/bookings" className={({ isActive }: any) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
          <Calendar size={20} />
          <span>Bookings</span>
        </NavLink>
        <div className={styles.divider} />
        <NavLink to="/settings" className={({ isActive }: any) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
