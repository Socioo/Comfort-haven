import { useState, useEffect } from "react";
import api from "../services/api";
import styles from "../styles/Finance.module.css";
import pageStyles from "../styles/Pages.module.css";
import { User, X, CheckCircle, Clock, XCircle } from "lucide-react";
import classNames from "classnames";

interface PayoutDetail {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  method: string;
  booking?: {
    id: string;
    createdAt: string;
    property?: {
      title: string;
      owner?: {
        name: string;
        email: string;
        phoneNumber?: string;
      };
    };
    guest?: {
      name: string;
      email: string;
      phoneNumber?: string;
    };
  };
}

interface PayoutModalProps {
  payoutId: string;
  onClose: () => void;
  onUpdate?: () => void;
}

const PayoutModal = ({ payoutId, onClose, onUpdate }: PayoutModalProps) => {
  const [payout, setPayout] = useState<PayoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPayout = async () => {
      try {
        const response = await api.get(`/finance/payouts/${payoutId}`);
        setPayout(response.data);
      } catch (err) {
        console.error("Failed to fetch payout details", err);
        // Fallback for demo
        setPayout({
          id: payoutId || "PAY-882292",
          amount: 15500,
          status: "Pending",
          createdAt: new Date().toISOString(),
          method: "Bank Transfer",
          booking: {
            id: "BK-99221",
            createdAt: new Date().toISOString(),
            property: {
              title: "Serene Garden Villa",
              owner: {
                name: "Host User",
                email: "host@example.com",
                phoneNumber: "+234 9033344422"
              }
            },
            guest: {
              name: "Adam Lukot",
              email: "adamlukat@gmail.com",
              phoneNumber: "+234 8107775573"
            }
          }
        });
      } finally {
        setLoading(false);
      }
    };

    if (payoutId) fetchPayout();
  }, [payoutId]);

  const handleUpdateStatus = async (status: string) => {
    setUpdating(true);
    try {
      await api.patch(`/finance/payouts/${payoutId}`, { status });
      onUpdate?.();
      onClose();
    } catch (err) {
      console.error("Failed to update payout status", err);
      setError("Failed to update status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return null;

  if (error || !payout) {
    return (
      <div className={pageStyles.modalOverlay} onClick={onClose} style={{ zIndex: 1050 }}>
        <div className={pageStyles.modal} onClick={(e) => e.stopPropagation()} style={{ borderRadius: '16px' }}>
          <div className={pageStyles.modalHeader}>
            <h2 style={{ color: 'var(--error-color)', fontWeight: '600' }}>{error || "Payout not found"}</h2>
            <button className={pageStyles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPending = payout.status.toLowerCase() === 'pending' || payout.status.toLowerCase() === 'processing';
  const isSuccessful = payout.status.toLowerCase() === 'paid' || payout.status.toLowerCase() === 'completed';
  
  const getStatusIcon = () => {
    if (isSuccessful) return <CheckCircle size={16} />;
    if (isPending) return <Clock size={16} />;
    return <XCircle size={16} />;
  };

  return (
    <div className={pageStyles.modalOverlay} onClick={onClose} style={{ zIndex: 1050 }}>
      <div 
        className={pageStyles.modal} 
        style={{ 
          maxWidth: '700px', 
          width: '90%', 
          maxHeight: '85vh', 
          overflowY: 'auto', 
          padding: '0', 
          borderRadius: '16px', 
          boxShadow: 'var(--shadow-lg)' 
        }} 
        onClick={(e) => e.stopPropagation()}
      >
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
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 'bold' }}>
              Payout #{payout.id.toUpperCase()}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={classNames(styles.statusBadge, isSuccessful ? styles.active : isPending ? styles.suspended : styles.failed)} style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {getStatusIcon()}
                {payout.status.toUpperCase()}
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                Requested on {new Date(payout.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button 
            className={pageStyles.closeBtn} 
            onClick={onClose} 
            style={{ 
              alignSelf: 'flex-start', 
              background: 'var(--bg-color)', 
              color: 'var(--text-light)',
              marginTop: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ background: 'var(--bg-color)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>Payout Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Amount</span>
                <span style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 'bold' }}>₦{payout.amount.toLocaleString()}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Payment Method</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{payout.method}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Time of Request</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{new Date(payout.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Host Info */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="var(--warning-color)" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Host Information</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '2px' }}>Name</span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>{payout.booking?.property?.owner?.name || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '2px' }}>Email</span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{payout.booking?.property?.owner?.email || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '2px' }}>Phone</span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{payout.booking?.property?.owner?.phoneNumber || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Guest Info */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="var(--text-light)" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Guest Information</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '2px' }}>Name</span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>{payout.booking?.guest?.name || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '2px' }}>Email</span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{payout.booking?.guest?.email || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '2px' }}>Phone</span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{payout.booking?.guest?.phoneNumber || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {isPending && (
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
              <button 
                style={{ background: 'var(--success-color)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: updating ? 'not-allowed' : 'pointer', flex: 1, transition: 'filter 0.2s', opacity: updating ? 0.7 : 1 }}
                onMouseOver={(e) => !updating && (e.currentTarget.style.filter = 'brightness(0.9)')}
                onMouseOut={(e) => !updating && (e.currentTarget.style.filter = 'none')}
                onClick={() => handleUpdateStatus('paid')}
                disabled={updating}
              >
                {updating ? "Processing..." : "Approve Payout"}
              </button>
              <button 
                style={{ background: 'var(--error-color)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: updating ? 'not-allowed' : 'pointer', flex: 1, transition: 'filter 0.2s', opacity: updating ? 0.7 : 1 }}
                onMouseOver={(e) => !updating && (e.currentTarget.style.filter = 'brightness(0.9)')}
                onMouseOut={(e) => !updating && (e.currentTarget.style.filter = 'none')}
                onClick={() => handleUpdateStatus('rejected')}
                disabled={updating}
              >
                {updating ? "Processing..." : "Deny Payout"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayoutModal;
