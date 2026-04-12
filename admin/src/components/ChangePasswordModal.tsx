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
    <div className={styles.modalOverlay} style={{ zIndex: 2000 }}>
      <div 
        className={styles.modal} 
        style={{ 
          maxWidth: '450px', 
          borderRadius: '24px', 
          padding: '0',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div 
          className={styles.modalHeader} 
          style={{ 
            padding: '32px 32px 24px', 
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--card-bg)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              padding: '12px', 
              background: 'rgba(47, 149, 220, 0.1)', 
              borderRadius: '16px', 
              color: '#2f95dc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Key size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
                Secure Your Account
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: '500' }}>
                Password change required
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: '32px' }}>
          <div style={{ 
            background: 'var(--info-bg, rgba(47, 149, 220, 0.1))', 
            padding: '16px 20px', 
            borderRadius: '16px', 
            marginBottom: '32px', 
            border: '1px solid var(--primary-color)',
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.6', fontWeight: '500' }}>
              For your security, you must update your temporary password before you can access the dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                Current Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter current password"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    outline: 'none',
                    background: 'var(--input-bg)',
                    color: 'var(--text-main)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    background: 'none', 
                    border: 'none', 
                    color: '#94a3b8', 
                    cursor: 'pointer',
                    padding: '8px'
                  }}
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="At least 8 characters"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    outline: 'none',
                    background: 'var(--input-bg)',
                    color: 'var(--text-main)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    background: 'none', 
                    border: 'none', 
                    color: '#94a3b8', 
                    cursor: 'pointer',
                    padding: '8px'
                  }}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Repeat new password"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  outline: 'none',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)'
                }}
              />
            </div>

            {error && (
              <div style={{ 
                color: 'var(--error-color)', 
                fontSize: '0.875rem', 
                marginBottom: '24px', 
                background: 'var(--error-bg)', 
                padding: '12px 16px', 
                borderRadius: '12px', 
                textAlign: 'center',
                border: '1px solid var(--error-color)',
                fontWeight: '500'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className={classNames(styles.btn, styles.primary)}
              style={{ 
                width: '100%', 
                padding: '16px', 
                borderRadius: '14px', 
                fontSize: '1rem', 
                fontWeight: '700',
                background: '#2f95dc',
                color: 'white',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgba(47, 149, 220, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              disabled={loading}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {loading ? 'Updating Security...' : 'Update Password & Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
