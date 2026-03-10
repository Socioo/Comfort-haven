import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Home,
  Calendar,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import styles from "./Sidebar.module.css";

const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <h2>Comfort Haven</h2>
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
        <NavLink
          to="/guests"
          className={({ isActive }: any) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <Users size={20} />
          <span>Guests</span>
        </NavLink>
        <NavLink
          to="/hosts"
          className={({ isActive }: any) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <UserCheck size={20} />
          <span>Hosts</span>
        </NavLink>
        <NavLink
          to="/properties"
          className={({ isActive }: any) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <Home size={20} />
          <span>Properties</span>
        </NavLink>
        <NavLink
          to="/bookings"
          className={({ isActive }: any) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <Calendar size={20} />
          <span>Bookings</span>
        </NavLink>
        <NavLink
          to="/team"
          className={({ isActive }: any) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <Users size={20} />
          <span>Team</span>
        </NavLink>
        <div className={styles.divider} />
        <NavLink
          to="/settings"
          className={({ isActive }: any) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div
        style={{ marginTop: "auto", padding: "0 20px", marginBottom: "24px" }}
      >
        <button
          onClick={logout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "#ef4444",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "500",
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            transition: "background-color 0.2s ease",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#fef2f2")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
