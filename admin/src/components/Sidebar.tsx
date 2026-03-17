import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import styles from "./Sidebar.module.css";

const Sidebar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  
  // Group activation logic
  const isManagementActive = ["/guests", "/hosts", "/properties", "/team"].some(p => pathname.startsWith(p));
  const isFinanceActive = ["/bookings", "/payouts", "/refunds"].some(p => pathname.startsWith(p));
  const isConfigurationActive = ["/settings", "/admin-settings", "/payment-settings"].some(p => pathname.startsWith(p));

  // Dropdown states
  const [openMenus, setOpenMenus] = useState({
    management: isManagementActive,
    finance: isFinanceActive,
    configuration: isConfigurationActive,
  });

  // Automatically sync open menus with active route
  useEffect(() => {
    if (isManagementActive) {
      setOpenMenus({ management: true, finance: false, configuration: false });
    } else if (isFinanceActive) {
      setOpenMenus({ management: false, finance: true, configuration: false });
    } else if (isConfigurationActive) {
      setOpenMenus({ management: false, finance: false, configuration: true });
    } else {
      setOpenMenus({ management: false, finance: false, configuration: false });
    }
  }, [pathname, isManagementActive, isFinanceActive, isConfigurationActive]);

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => {
      const newState = {
        management: false,
        finance: false,
        configuration: false,
        [menu as keyof typeof openMenus]: !prev[menu as keyof typeof openMenus]
      };
      return newState;
    });
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <h2>Comfort <span>Haven</span></h2>
      </div>
      <nav className={styles.nav}>
        <NavLink
          to="/"
          className={({ isActive }: any) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        {/* Management Group */}
        <div 
          className={`${styles.menuHeader} ${isManagementActive ? styles.active : ''}`} 
          onClick={() => toggleMenu('management')}
        >
          <div className={styles.headerLeft}>
            <ClipboardList size={20} />
            <span>Management</span>
          </div>
          {openMenus.management ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        
        {openMenus.management && (
          <div className={styles.subMenu}>
            <NavLink to="/guests" className={styles.subLink}>Guests</NavLink>
            <NavLink to="/hosts" className={styles.subLink}>Hosts</NavLink>
            <NavLink to="/properties" className={styles.subLink}>Properties</NavLink>
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <NavLink to="/team" className={styles.subLink}>Team</NavLink>
            )}
          </div>
        )}

        {/* Finance Group */}
        <div 
          className={`${styles.menuHeader} ${isFinanceActive ? styles.active : ''}`} 
          onClick={() => toggleMenu('finance')}
        >
          <div className={styles.headerLeft}>
            <BarChart3 size={20} />
            <span>Finance</span>
          </div>
          {openMenus.finance ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        
        {openMenus.finance && (
          <div className={styles.subMenu}>
            <NavLink to="/bookings" className={styles.subLink}>Bookings</NavLink>
            <NavLink to="/payouts" className={styles.subLink}>Payouts</NavLink>
            <NavLink to="/refunds" className={styles.subLink}>Refunds</NavLink>
          </div>
        )}

        {/* Support Section (Direct Link) */}
        <NavLink
          to="/support"
          className={({ isActive }: any) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <MessageSquare size={20} />
          <span>Support</span>
        </NavLink>

        {/* Configuration Group */}
        <div 
          className={`${styles.menuHeader} ${isConfigurationActive ? styles.active : ''}`} 
          onClick={() => toggleMenu('configuration')}
        >
          <div className={styles.headerLeft}>
            <Settings size={20} />
            <span>Configuration</span>
          </div>
          {openMenus.configuration ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        
        {openMenus.configuration && (
          <div className={styles.subMenu}>
            <NavLink to="/settings" className={styles.subLink}>App settings</NavLink>
            <NavLink to="/admin-settings" className={styles.subLink}>Admin settings</NavLink>
            <NavLink to="/payment-settings" className={styles.subLink}>Payment settings</NavLink>
          </div>
        )}
      </nav>

      <div className={styles.bottomSection}>
        <button onClick={logout} className={styles.logoutBtn}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
