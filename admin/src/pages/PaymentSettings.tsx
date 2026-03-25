import { useState, useEffect } from "react";
import { Search, Loader2, Save, BadgePercent, Coins, Bell } from "lucide-react";
import api, { settingsAPI } from "../services/api";
import listStyles from "../styles/Guests.module.css";
import styles from "./PaymentSettings.module.css";

const PaymentSettings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    // Transaction feature toggles
    supportedGateways: true,
    enableMethods: false,
    minOrderPrice: true,
    commissionSetup: false,
    // Global fields
    currency: "NGN",
    tax_rate: "0",
    platform_fee: "0",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getByGroup("payment");
      const data = response.data;
      
      const newSettings = { ...settings };
      data.forEach((item: { key: string; value: string }) => {
        if (item.key === 'currency' || item.key === 'tax_rate' || item.key === 'platform_fee') {
          newSettings[item.key] = item.value;
        } else if (Object.prototype.hasOwnProperty.call(newSettings, item.key)) {
          newSettings[item.key] = item.value === 'true';
        }
      });
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to fetch payment settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string) => {
    const newValue = !settings[key];
    setSettings((prev: any) => ({ ...prev, [key]: newValue }));
    
    try {
      setSaving(true);
      await api.patch(`/settings/${key}`, { value: newValue.toString() });
    } catch (error) {
      console.error(`Failed to update setting ${key}`, error);
      setSettings((prev: any) => ({ ...prev, [key]: !newValue }));
    } finally {
      setSaving(false);
    }
  };

  const handleGlobalSave = async () => {
    try {
      setSaving(true);
      const settingsToUpdate = [
        { key: 'currency', value: settings.currency },
        { key: 'tax_rate', value: settings.tax_rate },
        { key: 'platform_fee', value: settings.platform_fee },
      ];
      await settingsAPI.updateMany(settingsToUpdate);
      alert("Success: Payment configurations updated!");
    } catch (error) {
      console.error("Failed to save global settings", error);
      alert("Error: Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={listStyles.container}>
      <div className={listStyles.pageHeader}>
        <div className={listStyles.headerLeft}>
          <h1 className={listStyles.pageTitle}>Payment Configuration</h1>
          <div className={listStyles.searchBar}>
            <Search size={18} color="var(--text-light)" />
            <input
              type="text"
              placeholder="Search features..."
              className={listStyles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button 
          className={listStyles.viewBtn} 
          style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={handleGlobalSave}
          disabled={saving}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className={listStyles.tableContainer} style={{ padding: '0', position: 'relative' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '100px', color: 'var(--text-light)' }}>
            <Loader2 className={styles.spinner} size={40} />
            <p style={{ marginTop: '16px', fontSize: '18px' }}>Loading payment configurations...</p>
          </div>
        ) : (
          <div className={styles.settingsList}>
            {/* Global Pricing Context Section */}
            <div className={styles.settingsSection}>
              <h3>Pricing & Platform Strategy</h3>
              <div className={styles.gridContainer}>
                <div className={styles.formGroup}>
                  <label>Base Currency</label>
                  <div className={styles.inputWithIcon}>
                    <Coins size={18} />
                    <select
                      className={styles.selectInput}
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    >
                      <option value="NGN">Nigerian Naira (₦)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">British Pound (£)</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Tax Rate (%)</label>
                  <div className={styles.inputWithIcon}>
                    <BadgePercent size={18} />
                    <input
                      type="number"
                      step="0.1"
                      className={styles.textInput}
                      value={settings.tax_rate}
                      onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Platform Fee (%)</label>
                  <div className={styles.inputWithIcon}>
                    <BadgePercent size={18} />
                    <input
                      type="number"
                      step="0.1"
                      className={styles.textInput}
                      value={settings.platform_fee}
                      onChange={(e) => setSettings({ ...settings, platform_fee: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.alertCard} style={{ marginTop: '24px', display: 'flex', gap: '12px', background: 'rgba(245, 158, 11, 0.05)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <Bell size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#b45309' }}>
                  Important: Changes to currency, tax, and platform fees will only apply to new bookings created after these settings are saved.
                </p>
              </div>
            </div>

            <div className={styles.divider} style={{ margin: '20px 0 30px 0', height: '1.5px', background: 'var(--border-color)' }}></div>

            {/* Feature Toggles Section */}
            <h3 style={{ marginBottom: '20px' }}>Transaction Controls</h3>
            
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
        )}
      </div>
    </div>
  );
};

export default PaymentSettings;
