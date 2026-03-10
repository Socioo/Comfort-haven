import { useState, useEffect } from "react";
import api from "../services/api";
import styles from "../styles/Pages.module.css";
import { UserPlus, Shield, Mail, Trash2, X, Edit2 } from "lucide-react";
import classNames from "classnames";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

const Team = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "Password123!",
    role: "sub-admin",
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      // Fetch both admins and sub-admins for team management
      const [subs, admins] = await Promise.all([
        api.get("/users?role=sub-admin"),
        api.get("/users?role=admin")
      ]);
      setMembers([...subs.data, ...admins.data]);
    } catch (error) {
      console.error("Failed to fetch team members", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      password: "", // Don't send password on edit
      role: member.role,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingMember) {
        const { password, ...updateData } = formData;
        await api.patch(`/users/${editingMember.id}/profile`, updateData);
      } else {
        await api.post("/users", formData);
      }
      resetForm();
      fetchMembers();
    } catch (error) {
      console.error("Failed to save team member", error);
      alert("Failed to save team member. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setFormData({ name: "", email: "", password: "Password123!", role: "sub-admin" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this team member?")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchMembers();
    } catch (error) {
      console.error("Failed to delete member", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className={styles.header}>
        <h1>Team Management</h1>
        <div className={styles.controls}>
          <button
            className={classNames(styles.btn, styles.primary)}
            onClick={() => setIsModalOpen(true)}
          >
            <UserPlus size={18} style={{ marginRight: "8px" }} />
            Invite Sub-Admin
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length > 0 ? (
              members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "rgba(74, 144, 226, 0.1)",
                        color: "var(--primary-color)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <Shield size={16} />
                      </div>
                      {member.name}
                    </div>
                  </td>
                  <td>{member.email}</td>
                  <td>
                    <span className={styles.status} style={{ background: "var(--bg-color)" }}>
                      {member.role}
                    </span>
                  </td>
                  <td>
                    <span className={classNames(styles.status, styles.active)}>
                      Active
                    </span>
                  </td>
                  <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                  <td className={styles.actions}>
                    <button
                      className={styles.btn}
                      onClick={() => handleEdit(member)}
                      title="Edit Member"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className={classNames(styles.btn, styles.danger)}
                      onClick={() => handleDelete(member.id)}
                      title="Remove Member"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-light)" }}>
                  No sub-admins found. Click "Invite Sub-Admin" to add team members.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={resetForm}>
          <div className={styles.modal} style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingMember ? "Edit Team Member" : "Invite Team Member"}</h2>
              <button className={styles.closeBtn} onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={classNames(styles.formGroup, styles.fullWidth)}>
                  <label>Full Name</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="john@example.com"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Privilege Level</label>
                  <select name="role" value={formData.role} onChange={handleInputChange}>
                    <option value="sub-admin">Sub-Admin</option>
                    <option value="admin">Full Admin</option>
                  </select>
                </div>
              </div>

              <p style={{ fontSize: "0.80rem", color: "var(--text-light)", margin: "16px 0 24px 0", display: "flex", alignItems: "center" }}>
                <Mail size={14} style={{ marginRight: "8px" }} />
                An invitation will be sent to this email address.
              </p>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={classNames(styles.btn, styles.primary)}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : editingMember ? "Update Member" : "Invite Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
