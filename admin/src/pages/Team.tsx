import React, { useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Edit2, Trash2, Mail, X, Key, UserPlus, Search } from "lucide-react";
import classNames from "classnames";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import UserAvatar from "../components/UserAvatar";
import styles from "../styles/Pages.module.css";
import listStyles from "../styles/Guests.module.css";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  profileImage?: string;
  createdAt: string;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? 'N/A' : d.toISOString().split('T')[0];
};

const formatTime = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Team = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "sub-admin",
    message: "",
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      message: "", // Message is not editable
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const submissionData = editingMember
        ? formData
        : { ...formData, isInvitation: true };

      if (editingMember) {
        await api.patch(`/users/${editingMember.id}/profile`, submissionData);
      } else {
        await api.post("/users", submissionData);
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
    setFormData({ name: "", email: "", role: "sub-admin", message: "" });
  };

  const handleResetPassword = async (member: TeamMember) => {
    const newPassword = window.prompt(`Enter new password for ${member.name}:`, "Password123!");
    if (!newPassword) return;

    try {
      await api.patch(`/users/${member.id}/admin-reset-password`, { newPassword });
      alert(`Password for ${member.name} has been reset successfully.`);
    } catch (error) {
      console.error("Failed to reset password", error);
      alert("Failed to reset password. Please try again.");
    }
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

  const stats = useMemo(() => {
    const total = members.length;
    const fullAdmins = members.filter(m => m.role === 'admin').length;
    const subAdmins = members.filter(m => m.role === 'sub-admin').length;
    return { total, fullAdmins, subAdmins };
  }, [members]);

  if (loading) return <div>Loading...</div>;

  if (user?.role !== "admin" && user?.role !== "superadmin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={listStyles.container}>
      <div className={listStyles.pageHeader}>
        <div className={listStyles.headerLeft}>
          <h1 className={listStyles.pageTitle}>Team Records</h1>
          <div className={listStyles.searchBar}>
              <Search size={18} color="#94a3b8" />
              <input 
                  type="text" 
                  placeholder="search menu" 
                  className={listStyles.searchInput}
              />
          </div>
        </div>
        <button
          className={listStyles.viewBtn}
          style={{ padding: '8px 24px', display: 'flex', alignItems: 'center' }}
          onClick={() => setIsModalOpen(true)}
        >
          <UserPlus size={18} style={{ marginRight: "8px" }} />
          Invite Sub-Admin
        </button>
      </div>

      <div className={listStyles.statsGrid}>
          <div className={listStyles.statCardSolid}>
              <span className={listStyles.statLabel}>Total members</span>
              <span className={listStyles.statValue}>{stats.total}</span>
          </div>
          <div className={listStyles.statCardLight}>
              <span className={listStyles.statLabel}>Full Admins</span>
              <span className={listStyles.statValue}>{stats.fullAdmins}</span>
          </div>
          <div className={listStyles.statCardLight}>
              <span className={listStyles.statLabel}>Sub Admins</span>
              <span className={listStyles.statValue}>{stats.subAdmins}</span>
          </div>
          <div className={listStyles.statCardSolid}>
              <span className={listStyles.statLabel}>Team roles</span>
              <span className={listStyles.statValue}>2</span>
          </div>
      </div>

      <div className={listStyles.tableContainer}>
        <table className={listStyles.customTable}>
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
                      <UserAvatar 
                        name={member.name} 
                        image={member.profileImage} 
                        size={32} 
                      />
                      {member.name}
                    </div>
                  </td>
                  <td>{member.email}</td>
                  <td>
                    <span className={classNames(listStyles.statusBadge, listStyles.active)}>
                      {member.role}
                    </span>
                  </td>
                  <td>
                    <span className={classNames(listStyles.statusBadge, listStyles.active)}>
                      Active
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{formatDate(member.createdAt)}</span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{formatTime(member.createdAt)}</span>
                    </div>
                  </td>
                  <td style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '100%', minHeight: '60px' }}>
                    <button
                      className={listStyles.viewBtn}
                      style={{ padding: '6px 12px' }}
                      onClick={() => handleEdit(member)}
                      title="Edit Member"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className={listStyles.viewBtn}
                      style={{ background: '#fef3c7', color: '#d97706', padding: '6px 12px' }}
                      onClick={() => handleResetPassword(member)}
                      title="Reset Password"
                    >
                      <Key size={16} />
                    </button>
                    <button
                      className={listStyles.viewBtn}
                      style={{ background: '#fee2e2', color: '#ef4444', padding: '6px 12px' }}
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
                <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
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
                {!editingMember && (
                  <div className={classNames(styles.formGroup, styles.fullWidth)}>
                    <label>Personal Message (Optional)</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="e.g. Welcome to the team! Here are your credentials to get started."
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        minHeight: '100px',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                )}
              </div>

              {!editingMember && (
                <p style={{ fontSize: "0.80rem", color: "var(--text-light)", margin: "16px 0 24px 0", display: "flex", alignItems: "center" }}>
                  <Mail size={14} style={{ marginRight: "8px" }} />
                  An invitation will be sent to this email address.
                </p>
              )}

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
