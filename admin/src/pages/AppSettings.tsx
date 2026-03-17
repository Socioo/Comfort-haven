import { useState } from "react";
import { Search } from "lucide-react";
import listStyles from "../styles/Guests.module.css";
import styles from "./AppSettings.module.css";

const AppSettings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [settings, setSettings] = useState({
    bookingTimeout: true,
    autoApproveHosts: false,
    autoApproveProperties: true,
    serviceAvailability: false,
    emailNotifications: true,
    smsAlerts: false,
    pushMessages: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={listStyles.container}>
      <div className={listStyles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 className={listStyles.pageTitle}>Configuration</h1>
          <div className={listStyles.searchBar}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="search menu"
              className={listStyles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={listStyles.tableContainer} style={{ padding: '0' }}>
        <div className={styles.settingsList}>
          <div className={styles.settingItem}>
            <p className={styles.settingLabel}>Booking Timeout (e.g., 10 mins auto-cancel if unpaid)</p>
            <div 
              className={`${styles.customToggle} ${settings.bookingTimeout ? styles.active : ""}`}
              onClick={() => handleToggle("bookingTimeout")}
            >
              <div className={styles.innerDot} />
            </div>
          </div>

          <div className={styles.settingItem}>
            <p className={styles.settingLabel}>Auto-approval toggles for hosts</p>
            <div 
              className={`${styles.customToggle} ${settings.autoApproveHosts ? styles.active : ""}`}
              onClick={() => handleToggle("autoApproveHosts")}
            >
              <div className={styles.innerDot} />
            </div>
          </div>

          <div className={styles.settingItem}>
            <p className={styles.settingLabel}>Auto-approval toggles for properties</p>
            <div 
              className={`${styles.customToggle} ${settings.autoApproveProperties ? styles.active : ""}`}
              onClick={() => handleToggle("autoApproveProperties")}
            >
              <div className={styles.innerDot} />
            </div>
          </div>

          <div className={styles.settingItem}>
            <p className={styles.settingLabel}>Service Availability Settings (Business hours)</p>
            <div 
              className={`${styles.customToggle} ${settings.serviceAvailability ? styles.active : ""}`}
              onClick={() => handleToggle("serviceAvailability")}
            >
              <div className={styles.innerDot} />
            </div>
          </div>

          <div className={styles.settingItem}>
            <p className={styles.settingLabel}>Email notifications</p>
            <div 
              className={`${styles.customToggle} ${settings.emailNotifications ? styles.active : ""}`}
              onClick={() => handleToggle("emailNotifications")}
            >
              <div className={styles.innerDot} />
            </div>
          </div>

          <div className={styles.settingItem}>
            <p className={styles.settingLabel}>SMS alerts</p>
            <div 
              className={`${styles.customToggle} ${settings.smsAlerts ? styles.active : ""}`}
              onClick={() => handleToggle("smsAlerts")}
            >
              <div className={styles.innerDot} />
            </div>
          </div>

          <div className={styles.settingItem}>
            <p className={styles.settingLabel}>In-app push messages</p>
            <div 
              className={`${styles.customToggle} ${settings.pushMessages ? styles.active : ""}`}
              onClick={() => handleToggle("pushMessages")}
            >
              <div className={styles.innerDot} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppSettings;
