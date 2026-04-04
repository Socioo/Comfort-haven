import { X, User, Edit2, Key, Ban, Trash2 } from 'lucide-react';
import classNames from 'classnames';
import styles from '../styles/Guests.module.css';
import pageStyles from '../styles/Pages.module.css';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  profileImage?: string;
  createdAt: string;
}

interface TeamMemberModalProps {
  member: TeamMember;
  onClose: () => void;
  onEdit: (member: TeamMember) => void;
  onResetPassword: (member: TeamMember) => void;
  onToggleSuspend: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
}

const getImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
};

const TeamMemberModal = ({ 
  member, 
  onClose, 
  onEdit, 
  onResetPassword, 
  onToggleSuspend, 
  onDelete 
}: TeamMemberModalProps) => {
  return (
    <div className={pageStyles.modalOverlay} onClick={onClose} style={{ zIndex: 1050 }}>
      <div className={pageStyles.modalWrapper} onClick={(e) => e.stopPropagation()}>
        <div className={pageStyles.modalDetailCard}>
          <div 
            className={pageStyles.modalHeader} 
            style={{ 
              padding: '24px 32px 20px', 
              borderBottom: '1px solid var(--border-color)', 
              margin: '0',
              position: 'sticky',
              top: 0,
              background: 'var(--card-bg)',
              zIndex: 10
            }}
          >
             <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div 
                  style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    background: 'var(--bg-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '2px solid var(--border-color)'
                  }}
                >
                    {member.profileImage ? (
                        <img 
                          src={getImageUrl(member.profileImage)} 
                          alt={member.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          crossOrigin="anonymous"
                        />
                    ) : (
                        <User size={32} color="var(--text-light)" />
                    )}
                </div>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 'bold' }}>{member.name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', textTransform: 'capitalize' }}>{member.role}</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-color)' }} />
                    <span className={classNames(styles.statusBadge, styles[member.status] || styles.active)} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                      {member.status || 'Active'}
                    </span>
                  </div>
                </div>
            </div>
            <button 
              className={pageStyles.closeBtn} 
              onClick={onClose} 
              style={{ 
                alignSelf: 'flex-start', 
                background: 'var(--bg-color)', 
                color: 'var(--text-light)',
                marginTop: '8px'
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '32px', overflowY: 'auto' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '24px',
              background: 'var(--bg-color)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: '500' }}>Email</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>{member.email}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: '500' }}>Date joined</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>{formatDate(member.createdAt)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: '500' }}>Role</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500', textTransform: 'capitalize' }}>{member.role}</span>
                </div>
            </div>
          </div>
        </div>

        <div className={pageStyles.modalActionCard}>
          <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '800px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button 
                  onClick={() => { onClose(); onEdit(member); }}
                  style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
              >
                  <Edit2 size={16} /> Edit Profile
              </button>
              <button 
                  onClick={() => { onClose(); onResetPassword(member); }}
                  style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
              >
                  <Key size={16} /> Reset Password
              </button>
              <button 
                  onClick={() => onToggleSuspend(member)}
                  style={{ background: member.status === 'suspended' ? '#10b981' : '#ef4444', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
              >
                  <Ban size={16} /> {member.status === 'suspended' ? 'Restore Account' : 'Suspend Account'}
              </button>
              <button 
                  onClick={() => { onClose(); onDelete(member); }}
                  style={{ background: '#7f1d1d', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
              >
                  <Trash2 size={16} /> Remove Member
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberModal;
