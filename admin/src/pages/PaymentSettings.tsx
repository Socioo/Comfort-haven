import { useState, useEffect } from "react";
import { Search, Loader2, Save, BadgePercent, Coins, Bell } from "lucide-react";
import { settingsAPI } from "../services/api";
import listStyles from "../styles/Guests.module.css";
import styles from "./PaymentSettings.module.css";

const FEATURE_KEYS = [
  "supportedGateways",
  "enableMethods",
  "minOrderPrice",
  "commissionSetup",
];

const FEATURE_LABELS: Record<string, string> = {
  supportedGateways: "Supported payment gateways (Stripe, Paystack, etc.)",
  enableMethods: "Enable/disable methods (Card / Wallet / Bank Transfer)",
  minOrderPrice: "Minimum order price or payout threshold",
  commissionSetup: "Commission percentage setup for each transaction",
};

const PaymentSettings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
      setError(null);
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
    } catch (err) {
      console.error("Failed to fetch payment settings", err);
      setError("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string) => {
    const newValue = !settings[key];
    setSettings((prev: any) => ({ ...prev, [key]: newValue }));
    
    try {
      setSaving(true);
      setError(null);
      await settingsAPI.updateMany([{ key, value: newValue.toString() }]);
    } catch (err) {
      console.error(`Failed to update setting ${key}`, err);
      setSettings((prev: any) => ({ ...prev, [key]: !newValue }));
      setError("Failed to update setting. Check your permissions.");
    } finally {
      setSaving(false);
    }
  };

  const handleGlobalSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      const settingsToUpdate = [
        { key: 'currency', value: settings.currency },
        { key: 'tax_rate', value: settings.tax_rate },
        { key: 'platform_fee', value: settings.platform_fee },
      ];
      await settingsAPI.updateMany(settingsToUpdate);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save global settings", err);
      setError("Failed to save changes. Check your permissions.");
    } finally {
      setSaving(false);
    }
  };

  const filteredFeatures = FEATURE_KEYS.filter((key) =>
    FEATURE_LABELS[key].toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={listStyles.container}>
      <div className={listStyles.pageHeader}>
        <div className={listStyles.headerLeft}>
          <h1 className={listStyles.pageTitle}>Payment Configuration</h1>
          <div className={listStyles.searchBar}>
            <Search size={18} color="#94a3b8" />
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
          className={styles.saveBtn}
          onClick={handleGlobalSave}
          disabled={saving}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Status banners */}
      {error && (
        <div className={styles.errorBanner}>
          {error}
        </div>
      )}
      {success && (
        <div className={styles.successBanner}>
          ✓ Payment configurations saved successfully!
        </div>
      )}

      <div style={{ position: 'relative', marginTop: '24px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '100px', color: 'var(--text-light)', background: 'var(--card-bg)', borderRadius: '16px' }}>
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

            {/* Feature Toggles Section */}
            <div className={styles.settingsSection}>
              <h3>Transaction Controls</h3>
              {filteredFeatures.length === 0 ? (
                <p className={styles.noResults}>No features match your search.</p>
              ) : (
                filteredFeatures.map((key) => (
                  <div className={styles.settingItem} key={key}>
                    <div className={styles.settingInfo}>
                      <p className={styles.settingLabel}>{FEATURE_LABELS[key]}</p>
                    </div>
                    <div
                      className={`${styles.toggleSwitch} ${settings[key] ? styles.toggleActive : ""}`}
                      onClick={() => handleToggle(key)}
                    >
                      <div className={styles.toggleThumb} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSettings;
