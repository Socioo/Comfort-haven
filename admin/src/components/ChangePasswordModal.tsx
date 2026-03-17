import React, { useState } from 'react';
import { Eye, EyeOff, Key } from 'lucide-react';
import classNames from 'classnames';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/Pages.module.css';

const ChangePasswordModal = () => {
  const { user, updateUser } = useAuth();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user?.mustChangePassword) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/users/${user.id}/password`, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      // Clear the flag in the context
      updateUser({ mustChangePassword: false });
      alert('Password updated successfully! You can now access the dashboard.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: '450px' }}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'rgba(74, 144, 226, 0.1)', borderRadius: '8px', color: 'var(--primary-color)' }}>
              <Key size={20} />
            </div>
            <h2>Change Password Required</h2>
          </div>
        </div>

        <div className={styles.modalContent}>
          <p style={{ color: 'var(--text-light)', marginBottom: '24px', fontSize: '0.95rem' }}>
            For security reasons, you are required to change your temporary password before proceeding.
          </p>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Repeat new password"
              />
            </div>

            {error && (
              <div style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginBottom: '16px', background: 'rgba(231, 76, 60, 0.1)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <div className={styles.formActions} style={{ marginTop: '24px' }}>
              <button
                type="submit"
                className={classNames(styles.btn, styles.primary)}
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Password & Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
