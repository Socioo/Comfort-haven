import { useState, useEffect } from "react";
import { User, Bell, Shield, Palette, Save, Camera } from "lucide-react";
import styles from "./Settings.module.css";
import UserAvatar from "../components/UserAvatar";
import { jwtDecode } from "jwt-decode";
import api, { adminAPI } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

const AdminSettings = () => {
  const { theme, setTheme } = useTheme();
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Profile State
  const [profile, setProfile] = useState({ name: "", email: "", role: "", profileImage: "" });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Notifications State
  const [notifications, setNotifications] = useState({
    newUsers: true,
    newProperties: true,
    newBookings: false,
    marketing: false,
  });

  // Security State
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Appearance State
  const [appearance, setAppearance] = useState({
    theme: theme,
    language: "en",
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      let id: string | null = null;
      if (token) {
        const decoded: any = jwtDecode(token);
        id = decoded.sub;
      } else {
        // Fallback for development: Fetch first admin user
        const adminRes = await api.get("/users?role=admin");
        const admins = adminRes.data;
        if (admins && admins.length > 0) {
          id = admins[0].id;
        } else {
          console.error("No admin user found in database!");
          setLoading(false);
          return;
        }
      }

      setUserId(id);
      if (!id) {
        setLoading(false);
        return;
      }

      const response = await adminAPI.getProfile(id);
      const user = response.data;

      setProfile({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "",
        profileImage: user.profileImage || "",
      });
      setImagePreview(user.profileImage || null);

      if (user.notifications) {
        setNotifications(user.notifications);
      }

      if (user.appearance) {
        setAppearance({
          theme: theme, // The UI theme is the single source of truth
          language: user.appearance.language || "en"
        });
      }
    } catch (error) {
      console.error("Failed to fetch user settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      if (activeTab === "profile") {
        console.log("Starting profile update sequence...");
        // 1. Update name and email
        await adminAPI.updateProfile(userId, {
          name: profile.name,
          email: profile.email,
        });

        // 2. Upload the selected image if present
        if (selectedFile) {
          console.log(`Uploading selected image: ${selectedFile.name}`);
          await adminAPI.uploadProfileImage(userId, selectedFile);
        }

        // 3. Refresh the global auth state and get the updated user back
        const updatedUser = await refreshUser();
        
        // 4. Update the local component state with the fresh data from the server
        if (updatedUser) {
          setProfile({
            name: updatedUser.name || "",
            email: updatedUser.email || "",
            role: updatedUser.role || "",
            profileImage: updatedUser.profileImage || "",
          });
          setImagePreview(updatedUser.profileImage || null);
          console.log("Local state updated with fresh user data:", updatedUser.profileImage);
        }

        alert("Success: Profile information and image updated!");
        setSelectedFile(null);
      } else if (activeTab === "notifications") {
        await adminAPI.updateNotifications(userId, notifications);
        alert("Success: Notification preferences updated!");
      } else if (activeTab === "appearance") {
        await adminAPI.updateAppearance(userId, appearance);
        await refreshUser();
        alert("Success: Appearance settings saved!");
      } else if (activeTab === "security") {
        if (!security.currentPassword || !security.newPassword) {
          alert("Error: Please enter both current and new passwords.");
          setSaving(false);
          return;
        }
        if (security.newPassword !== security.confirmPassword) {
          alert("Error: New passwords do not match.");
          setSaving(false);
          return;
        }
        if (security.newPassword.length < 6) {
          alert("Error: New password must be at least 6 characters long.");
          setSaving(false);
          return;
        }
        await adminAPI.updatePassword(userId, {
          currentPassword: security.currentPassword,
          newPassword: security.newPassword,
        });
        alert("Success: Your password has been updated securely!");
        setSecurity({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      const message = error.response?.data?.message || "An unexpected error occurred. Please try again.";
      alert(`Update Failed: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.settingsPage}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>
            Manage your admin preferences and system configurations.
          </p>
        </div>
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </header>

      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <button
              className={
                activeTab === "profile"
                  ? `${styles.navItem} ${styles.active}`
                  : styles.navItem
              }
              onClick={() => setActiveTab("profile")}
            >
              <User size={18} />
              Profile
            </button>
            <button
              className={
                activeTab === "notifications"
                  ? `${styles.navItem} ${styles.active}`
                  : styles.navItem
              }
              onClick={() => setActiveTab("notifications")}
            >
              <Bell size={18} />
              Notifications
            </button>
            <button
              className={
                activeTab === "security"
                  ? `${styles.navItem} ${styles.active}`
                  : styles.navItem
              }
              onClick={() => setActiveTab("security")}
            >
              <Shield size={18} />
              Security
            </button>
            <button
              className={
                activeTab === "appearance"
                  ? `${styles.navItem} ${styles.active}`
                  : styles.navItem
              }
              onClick={() => setActiveTab("appearance")}
            >
              <Palette size={18} />
              Appearance
            </button>
          </nav>
        </aside>

        <main className={styles.content}>
          {activeTab === "profile" && (
            <section className={styles.section}>
              <h2>Profile Information</h2>
              <div className={styles.card}>
                <div className={styles.avatarSection}>
                  <div className={styles.avatarContainer}>
                    <UserAvatar 
                      name={profile.name} 
                      image={imagePreview || undefined} 
                      size={120} 
                    />
                    <label className={styles.uploadOverlay} htmlFor="avatar-upload">
                      <Camera size={24} />
                      <span className={styles.uploadText}>Change</span>
                    </label>
                  </div>
                  <input 
                    type="file" 
                    id="avatar-upload" 
                    className={styles.fileInput} 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImagePreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className={styles.avatarActions}>
                    <p>Click to upload a new profile picture</p>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Role</label>
                  <input type="text" value={profile.role} disabled />
                </div>
              </div>
            </section>
          )}

          {activeTab === "notifications" && (
            <section className={styles.section}>
              <h2>Notification Preferences</h2>
              <div className={styles.card}>
                <div className={styles.toggleRow}>
                  <div className={styles.toggleInfo}>
                    <h4>New User Signups</h4>
                    <p>Receive an email when a new user registers.</p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={notifications.newUsers}
                      onChange={() => handleNotificationToggle("newUsers")}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <div className={styles.divider}></div>
                <div className={styles.toggleRow}>
                  <div className={styles.toggleInfo}>
                    <h4>New Properties</h4>
                    <p>Receive an email when a host lists a new property.</p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={notifications.newProperties}
                      onChange={() => handleNotificationToggle("newProperties")}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <div className={styles.divider}></div>
                <div className={styles.toggleRow}>
                  <div className={styles.toggleInfo}>
                    <h4>New Bookings</h4>
                    <p>Receive an email for every successful booking.</p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={notifications.newBookings}
                      onChange={() => handleNotificationToggle("newBookings")}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </section>
          )}

          {activeTab === "security" && (
            <section className={styles.section}>
              <h2>Security Settings</h2>
              <div className={styles.card}>
                <div className={styles.formGroup}>
                  <label>Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={security.currentPassword}
                    onChange={(e) =>
                      setSecurity({
                        ...security,
                        currentPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={security.newPassword}
                    onChange={(e) =>
                      setSecurity({ ...security, newPassword: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={security.confirmPassword}
                    onChange={(e) =>
                      setSecurity({
                        ...security,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <button
                  className={styles.btnPrimary}
                  style={{ marginTop: "16px" }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Updating..." : "Update Password"}
                </button>
              </div>

              <h2 style={{ marginTop: "32px" }}>Two-Factor Authentication</h2>
              <div className={styles.card}>
                <div className={styles.toggleRow} style={{ marginBottom: 0 }}>
                  <div className={styles.toggleInfo}>
                    <h4>Enable 2FA</h4>
                    <p>
                      Protect your admin account with an extra layer of
                      security.
                    </p>
                  </div>
                  <label className={styles.switch}>
                    <input type="checkbox" disabled />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </section>
          )}

          {activeTab === "appearance" && (
            <section className={styles.section}>
              <h2>Appearance</h2>
              <div className={styles.card}>
                <div className={styles.formGroup}>
                  <label>Dashboard Theme</label>
                  <select
                    value={appearance.theme}
                    onChange={(e) => {
                      const newTheme = e.target.value as any;
                      setAppearance({ ...appearance, theme: newTheme });
                      setTheme(newTheme);
                    }}
                  >
                    <option value="light">Light Theme (Default)</option>
                    <option value="dark">Dark Theme</option>
                    <option value="system">System Preference</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Language</label>
                  <select
                    value={appearance.language}
                    onChange={(e) =>
                      setAppearance({ ...appearance, language: e.target.value })
                    }
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminSettings;
