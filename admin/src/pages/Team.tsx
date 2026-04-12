import React, { useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Mail, X, UserPlus, Search } from "lucide-react";
import classNames from "classnames";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import UserAvatar from "../components/UserAvatar";
import styles from "../styles/Pages.module.css";
import listStyles from "../styles/Guests.module.css";
import ResetPasswordModal from "../components/ResetPasswordModal";
import Pagination from "../components/Pagination";
import NotificationModal from "../components/NotificationModal";
import type { NotificationType } from "../components/NotificationModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import TeamMemberModal from "../components/TeamMemberModal";

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
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? "N/A" : d.toISOString().split("T")[0];
};

const formatTime = (dateString?: string) => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  return isNaN(d.getTime())
    ? "N/A"
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
    role: "manager",
    message: "",
  });
  const [resetMember, setResetMember] = useState<TeamMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: NotificationType;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    memberId: string;
    memberName: string;
  }>({
    isOpen: false,
    memberId: "",
    memberName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      // Fetch all administrative roles
      const [superAdmins, managers, finance, support] = await Promise.all([
        api.get("/users?role=super-admin"),
        api.get("/users?role=manager"),
        api.get("/users?role=finance"),
        api.get("/users?role=support"),
      ]);
      setMembers([
        ...superAdmins.data,
        ...managers.data,
        ...finance.data,
        ...support.data,
      ]);
    } catch (error) {
      console.error("Failed to fetch team members", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
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
        // Strip out 'message' as it's not a field on the User entity
        const { message, ...updatePayload } = formData;
        await api.patch(`/users/${editingMember.id}/profile`, updatePayload);
      } else {
        await api.post("/users", { ...formData, isInvitation: true });
      }
      resetForm();
      fetchMembers();
    } catch (error) {
      console.error("Failed to save team member", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Save Failed",
        message: "Failed to save team member. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setFormData({ name: "", email: "", role: "manager", message: "" });
  };

  const handleResetPassword = (member: TeamMember) => {
    setResetMember(member);
  };

  const handleToggleSuspend = async (member: TeamMember) => {
    const newStatus = member.status === "active" ? "suspended" : "active";
    try {
      await api.patch(`/users/${member.id}/status`, { status: newStatus });
      fetchMembers();
      setNotification({
        isOpen: true,
        type: "success",
        title: newStatus === "suspended" ? "Admin Suspended" : "Admin Restored",
        message: `${member.name} has been successfully ${newStatus === "suspended" ? "suspended" : "restored"}.`,
      });
    } catch (error) {
      console.error("Failed to update status", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Update Failed",
        message: `Failed to ${newStatus === "suspended" ? "suspend" : "restore"} admin. Please try again.`,
      });
    }
  };

  const handleDeleteClick = (member: TeamMember) => {
    setDeleteModal({
      isOpen: true,
      memberId: member.id,
      memberName: member.name,
    });
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/users/${deleteModal.memberId}`);
      setDeleteModal({ isOpen: false, memberId: "", memberName: "" });
      fetchMembers();
      setNotification({
        isOpen: true,
        type: "success",
        title: "Member Removed",
        message: `${deleteModal.memberName} has been successfully removed from the team.`,
      });
    } catch (error) {
      console.error("Failed to delete member", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Delete Failed",
        message: "Failed to remove team member. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [members, searchTerm]);

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(start, start + itemsPerPage);
  }, [filteredMembers, currentPage]);

  const stats = useMemo(() => {
    return {
      total: members.length,
      superAdmins: members.filter((m) => m.role === "super-admin").length,
      managers: members.filter((m) => m.role === "manager").length,
      finance: members.filter((m) => m.role === "finance").length,
      support: members.filter((m) => m.role === "support").length,
      totalRoles: 4,
    };
  }, [members]);

  // Reset to first page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) return <div>Loading...</div>;

  if (user?.role !== "super-admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={listStyles.container}>
      <div className={listStyles.pageHeader}>
        <div className={listStyles.headerLeft}>
          <h1 className={listStyles.pageTitle}>Team Records</h1>
          <div className={listStyles.searchBar}>
            <Search size={18} color="var(--text-light)" />
            <input
              type="text"
              placeholder="search menu"
              className={listStyles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button
          className={listStyles.viewBtn}
          style={{ padding: "8px 24px", display: "flex", alignItems: "center" }}
          onClick={() => setIsModalOpen(true)}
        >
          <UserPlus size={18} style={{ marginRight: "8px" }} />
          Invite Team Member
        </button>
      </div>

      <div className={listStyles.statsGrid}>
        <div className={listStyles.statCardSolid}>
          <span className={listStyles.statLabel}>Total members</span>
          <span className={listStyles.statValue}>{stats.total}</span>
        </div>
        <div className={listStyles.statCardLight}>
          <span className={listStyles.statLabel}>Super Admins</span>
          <span className={listStyles.statValue}>{stats.superAdmins}</span>
        </div>
        <div className={listStyles.statCardLight}>
          <span className={listStyles.statLabel}>Managers</span>
          <span className={listStyles.statValue}>{stats.managers}</span>
        </div>
        <div className={listStyles.statCardLight}>
          <span className={listStyles.statLabel}>Finance</span>
          <span className={listStyles.statValue}>{stats.finance}</span>
        </div>
        <div className={listStyles.statCardLight}>
          <span className={listStyles.statLabel}>Support</span>
          <span className={listStyles.statValue}>{stats.support}</span>
        </div>
        <div className={listStyles.statCardSolid}>
          <span className={listStyles.statLabel}>Total Roles</span>
          <span className={listStyles.statValue}>{stats.totalRoles}</span>
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
            {paginatedMembers.length > 0 ? (
              paginatedMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
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
                    <span
                      className={classNames(
                        listStyles.statusBadge,
                        listStyles.active,
                      )}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={classNames(
                        listStyles.statusBadge,
                        listStyles[member.status] || listStyles.active,
                      )}
                    >
                      {member.status
                        ? member.status.charAt(0).toUpperCase() +
                          member.status.slice(1)
                        : "Active"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>{formatDate(member.createdAt)}</span>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-light)",
                        }}
                      >
                        {formatTime(member.createdAt)}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      className={listStyles.viewBtn}
                      onClick={() => setSelectedMember(member)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "var(--text-light)",
                  }}
                >
                  No team members found. Click "Invite Team Member" to add
                  staff.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalItems={filteredMembers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={resetForm}>
          <div
            className={styles.modal}
            style={{ maxWidth: "500px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>
                {editingMember ? "Edit Team Member" : "Invite Team Member"}
              </h2>
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
                  <label>Assign Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="super-admin">Super Admin</option>
                    <option value="manager">Manager</option>
                    <option value="finance">Finance</option>
                    <option value="support">Support</option>
                  </select>
                </div>
                {!editingMember && (
                  <div
                    className={classNames(styles.formGroup, styles.fullWidth)}
                  >
                    <label>Personal Message (Optional)</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="e.g. Welcome to the team! Here are your credentials to get started."
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color)",
                        minHeight: "100px",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                )}
              </div>

              {!editingMember && (
                <p
                  style={{
                    fontSize: "0.80rem",
                    color: "var(--text-light)",
                    margin: "16px 0 24px 0",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
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
                  {submitting
                    ? "Saving..."
                    : editingMember
                      ? "Update Member"
                      : "Invite Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {resetMember && (
        <ResetPasswordModal
          member={resetMember}
          onClose={() => setResetMember(null)}
          onSuccess={() => {
            const memberName = resetMember.name;
            setResetMember(null);
            setNotification({
              isOpen: true,
              type: "success",
              title: "Password Reset",
              message: `Password for ${memberName} has been reset successfully.`,
            });
          }}
        />
      )}

      {selectedMember && (
        <TeamMemberModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onEdit={handleEdit}
          onResetPassword={handleResetPassword}
          onToggleSuspend={handleToggleSuspend}
          onDelete={handleDeleteClick}
        />
      )}

      {notification.isOpen && (
        <NotificationModal
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification({ ...notification, isOpen: false })}
        />
      )}

      {deleteModal.isOpen && (
        <DeleteConfirmationModal
          title="Remove Team Member"
          message={`Are you sure you want to remove ${deleteModal.memberName} from the team? This action will revoke their access to the admin dashboard.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ ...deleteModal, isOpen: false })}
          isDeleting={isDeleting}
          confirmText="Remove Member"
        />
      )}
    </div>
  );
};

export default Team;
