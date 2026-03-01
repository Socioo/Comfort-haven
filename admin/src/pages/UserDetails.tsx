import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import styles from "../styles/Pages.module.css"; // Reusing existing styles or create new specific ones if needed
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Calendar,
  Clock,
  CheckCircle,
  Ban,
} from "lucide-react";
import classNames from "classnames";

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: "user" | "host" | "admin";
  status: "active" | "suspended" | "banned";
  isVerified: boolean;
  profileImage?: string;
  createdAt: string;
  lastActiveAt?: string;
  phone?: string;
}

const UserDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get(`/users/${id}`);
        setUser(response.data);
      } catch (err) {
        console.error("Failed to fetch user details", err);
        setError("Failed to load user details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUser();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className={styles.container}>
      <button
        onClick={() => navigate(-1)}
        className={styles.backBtn}
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#666",
        }}
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className={styles.card} style={{ padding: "32px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "24px" }}>
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  // Could forcefully show icon via state or DOM, but simplistic approach:
                  // Since we can't easily swap to the icon component here without state,
                  // let's try a reliable placeholder service if the original fails, or hide it.
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                }}
              />
            ) : (
              <User size={48} color="#ccc" />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <h1 style={{ margin: "0 0 8px 0" }}>{user.name}</h1>
                <div
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <span
                    className={classNames(styles.status, styles[user.status])}
                  >
                    {user.status}
                  </span>
                  <span
                    style={{
                      background: "#eee",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      textTransform: "uppercase",
                    }}
                  >
                    {user.role}
                  </span>
                  {user.isVerified && (
                    <span
                      style={{
                        color: "green",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "14px",
                      }}
                    >
                      <CheckCircle size={14} /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "32px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "24px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    color: "#666",
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Email
                </label>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Mail size={16} color="#666" />
                  <span>{user.email}</span>
                </div>
              </div>

              {user.phone && (
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#666",
                      marginBottom: "4px",
                      fontSize: "14px",
                    }}
                  >
                    Phone
                  </label>
                  <span>{user.phone}</span>
                </div>
              )}

              <div>
                <label
                  style={{
                    display: "block",
                    color: "#666",
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Joined
                </label>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Calendar size={16} color="#666" />
                  <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    color: "#666",
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  Last Active
                </label>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Clock size={16} color="#666" />
                  <span>
                    {user.lastActiveAt
                      ? new Date(user.lastActiveAt).toLocaleString()
                      : "Never"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
