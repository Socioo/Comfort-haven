import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ChangePasswordModal from '../components/ChangePasswordModal';
import styles from './DashboardLayout.module.css';
import classNames from 'classnames';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className={styles.container}>
      <ChangePasswordModal />
      {isSidebarOpen && <div className={styles.overlay} onClick={closeSidebar} />}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <main className={classNames(styles.main, { [styles.shifted]: isSidebarOpen })}>
        <Header onMenuClick={toggleSidebar} />
        <div className={styles.content}>
          <Suspense fallback={<div>Loading...</div>}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
