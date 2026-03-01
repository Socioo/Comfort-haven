import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import styles from "../styles/Pages.module.css";
import { Ban, CheckCircle, Eye, User } from "lucide-react";
import classNames from "classnames";

interface Guest {
  id: string;
  name: string;
  email: string;
  status: "active" | "suspended" | "banned";
  profileImage?: string;
  lastActiveAt?: string;
  createdAt: string;
}

// Mock Data Removed

const Guests = () => {
  const navigate = useNavigate();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      const response = await api.get("/users?role=user");
      setGuests(response.data);
    } catch (error) {
      console.error("Failed to fetch guests", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Guest["status"]) => {
    // Optimistic
    const prevGuests = [...guests];
    setGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: newStatus } : g)),
    );

    try {
      await api.patch(`/users/${id}/status`, { status: newStatus });
    } catch (error) {
      console.error("Failed to update status", error);
      setGuests(prevGuests);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className={styles.header}>
        <h1>Guests Management</h1>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Last Active</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <tr key={guest.id}>
                <td>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "#eee",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {guest.profileImage ? (
                        <img
                          src={guest.profileImage}
                          alt={guest.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.setAttribute(
                              "style",
                              "display: flex",
                            );
                          }}
                        />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    {guest.name}
                  </div>
                </td>
                <td>{guest.email}</td>
                <td>
                  <span
                    className={classNames(styles.status, styles[guest.status])}
                  >
                    {guest.status}
                  </span>
                </td>
                <td>
                  {guest.lastActiveAt
                    ? new Date(guest.lastActiveAt).toLocaleString()
                    : "Never"}
                </td>
                <td>{new Date(guest.createdAt).toLocaleDateString()}</td>
                <td className={styles.actions}>
                  <button
                    className={styles.btn}
                    title="View Profile"
                    onClick={() => navigate(`/guests/${guest.id}`)}
                  >
                    <Eye size={16} />
                  </button>
                  {guest.status === "active" ? (
                    <button
                      className={classNames(styles.btn, styles.danger)}
                      title="Ban User"
                      onClick={() => handleStatusChange(guest.id, "banned")}
                    >
                      <Ban size={16} />
                    </button>
                  ) : (
                    <button
                      className={classNames(styles.btn, styles.success)}
                      title="Unban User"
                      onClick={() => handleStatusChange(guest.id, "active")}
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Guests;
