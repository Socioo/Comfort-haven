import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import styles from './DashboardLayout.module.css';

const DashboardLayout = () => {
  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>
        <Suspense fallback={<div>Loading...</div>}>
          <div className={styles.content}>
            <Outlet />
          </div>
        </Suspense>
      </main>
    </div>
  );
};

export default DashboardLayout;
