import { useState } from "react";
import { Search } from "lucide-react";
import listStyles from "../styles/Guests.module.css";
import styles from "./PaymentSettings.module.css";

const PaymentSettings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [settings, setSettings] = useState({
    supportedGateways: true,
    enableMethods: false,
    minOrderPrice: true,
    commissionSetup: false,
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
            <Search size={18} color="var(--text-light)" />
            <input
              type="text"
              placeholder="Search menu"
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
            <p className={styles.settingLabel}>Supported payment gateways (Stripe, Paystack, etc.)</p>
            <div 
              className={`${styles.customToggle} ${settings.supportedGateways ? styles.active : ""}`}
              onClick={() => handleToggle("supportedGateways")}
            >
              <div className={styles.innerDot} />
            </div>
          </div>

          <div className={styles.settingItem}>
            <p className={styles.settingLabel}>Enable/disable methods (Card / Wallet / Bank Transfer)</p>
            <div 
              className={`${styles.customToggle} ${settings.enableMethods ? styles.active : ""}`}
              onClick={() => handleToggle("enableMethods")}
            >
              <div className={styles.innerDot} />
            </div>
          </div>

          <div className={styles.settingItem}>
            <p className={styles.settingLabel}>Minimum order price or payout threshold</p>
            <div 
              className={`${styles.customToggle} ${settings.minOrderPrice ? styles.active : ""}`}
              onClick={() => handleToggle("minOrderPrice")}
            >
              <div className={styles.innerDot} />
            </div>
          </div>

          <div className={styles.settingItem}>
            <p className={styles.settingLabel}>Commission percentage setup for each transaction</p>
            <div 
              className={`${styles.customToggle} ${settings.commissionSetup ? styles.active : ""}`}
              onClick={() => handleToggle("commissionSetup")}
            >
              <div className={styles.innerDot} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettings;
