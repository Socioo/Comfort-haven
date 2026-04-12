import React, { useState } from 'react';
import { X, Key, Eye, EyeOff, Shield } from 'lucide-react';
import classNames from 'classnames';
import api from '../services/api';
import styles from '../styles/Pages.module.css';

interface ResetPasswordModalProps {
  member: {
    id: string;
    name: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const ResetPasswordModal = ({ member, onClose, onSuccess }: ResetPasswordModalProps) => {
  const [newPassword, setNewPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setError('Password cannot be empty');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.patch(`/users/${member.id}/admin-reset-password`, { newPassword });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className={styles.modal} 
        style={{ 
          maxWidth: '450px', 
          borderRadius: '20px', 
          padding: '0',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          background: 'var(--card-bg)'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader} style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '10px', background: 'var(--warning-bg)', borderRadius: '12px', color: 'var(--warning-color)' }}>
              <Key size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>Reset Password</h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-light)' }}>For {member.name}</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} style={{ background: 'var(--bg-color)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '32px' }}>
          <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
            <Shield size={20} color="var(--text-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: '1.5' }}>
              Resetting this password will require the user to change it immediately upon their next login for security reasons.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-main)' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter temporary password"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-main)',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--text-light)', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--error-color)', fontSize: '0.875rem', marginBottom: '16px', background: 'var(--error-bg)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className={styles.btn}
                onClick={onClose}
                style={{ flex: 1, padding: '12px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={classNames(styles.btn, styles.primary)}
                style={{ flex: 1, padding: '12px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600' }}
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordModal;
