import { useState, useEffect } from "react";
import { Search, Loader2, Save, Globe, Mail } from "lucide-react";
import { settingsAPI } from "../services/api";
import listStyles from "../styles/Guests.module.css";
import styles from "./AppSettings.module.css";

const FEATURE_KEYS = [
  "bookingTimeout",
  "autoApproveHosts",
  "autoApproveProperties",
  "serviceAvailability",
  "emailNotifications",
  "smsAlerts",
  "pushMessages",
];

const FEATURE_LABELS: Record<string, string> = {
  bookingTimeout: "Booking Timeout (auto-cancel unpaid after 10 mins)",
  autoApproveHosts: "Auto-approval for hosts",
  autoApproveProperties: "Auto-approval for properties",
  serviceAvailability: "Service Availability Settings (Business hours)",
  emailNotifications: "Email notifications",
  smsAlerts: "SMS alerts",
  pushMessages: "In-app push messages",
};

const AppSettings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<any>({
    // Feature Toggles
    bookingTimeout: true,
    autoApproveHosts: false,
    autoApproveProperties: true,
    serviceAvailability: false,
    emailNotifications: true,
    smsAlerts: false,
    pushMessages: true,
    // Global Config
    app_name: "",
    support_email: "",
    maintenance_mode: "false",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allSettings] = await Promise.all([settingsAPI.getAll()]);
      const data: { key: string; value: string }[] = allSettings.data;

      const newSettings = { ...settings };
      data.forEach((item) => {
        if (
          item.key === "app_name" ||
          item.key === "support_email" ||
          item.key === "maintenance_mode"
        ) {
          newSettings[item.key] = item.value;
        } else if (Object.prototype.hasOwnProperty.call(newSettings, item.key)) {
          newSettings[item.key] = item.value === "true";
        }
      });
      setSettings(newSettings);
    } catch (err) {
      console.error("Failed to fetch app settings", err);
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
        { key: "app_name", value: settings.app_name },
        { key: "support_email", value: settings.support_email },
        { key: "maintenance_mode", value: settings.maintenance_mode },
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
          <h1 className={listStyles.pageTitle}>App Configuration</h1>
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
          {saving ? "Saving..." : "Save Changes"}
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
          ✓ App configurations saved successfully!
        </div>
      )}

      <div className={listStyles.tableContainer} style={{ padding: "0", position: "relative" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "100px", color: "var(--text-light)" }}>
            <Loader2 className={styles.spinner} size={40} />
            <p style={{ marginTop: "16px", fontSize: "18px" }}>Loading application configurations...</p>
          </div>
        ) : (
          <div className={styles.settingsList}>
            {/* Global Identity Section */}
            <div className={styles.settingsSection}>
              <h3>Global Identity</h3>
              <div className={styles.gridContainer}>
                <div className={styles.formGroup}>
                  <label>Application Name</label>
                  <div className={styles.inputWithIcon}>
                    <Globe size={18} />
                    <input
                      type="text"
                      className={styles.textInput}
                      value={settings.app_name}
                      onChange={(e) =>
                        setSettings({ ...settings, app_name: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Support Email</label>
                  <div className={styles.inputWithIcon}>
                    <Mail size={18} />
                    <input
                      type="email"
                      className={styles.textInput}
                      value={settings.support_email}
                      onChange={(e) =>
                        setSettings({ ...settings, support_email: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className={styles.divider}></div>

              <div className={styles.settingItem} style={{ border: "none", padding: "12px 0" }}>
                <div className={styles.settingInfo}>
                  <h4 className={styles.settingTitle}>Maintenance Mode</h4>
                  <p className={styles.settingDesc}>
                    When enabled, users will see a maintenance screen on the mobile app.
                  </p>
                </div>
                <div
                  className={`${styles.toggleSwitch} ${settings.maintenance_mode === "true" ? styles.toggleActive : ""}`}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      maintenance_mode:
                        settings.maintenance_mode === "true" ? "false" : "true",
                    })
                  }
                >
                  <div className={styles.toggleThumb} />
                </div>
              </div>
            </div>

            {/* System Features Section */}
            <div className={styles.settingsSection}>
              <h3>System Features</h3>
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

export default AppSettings;
