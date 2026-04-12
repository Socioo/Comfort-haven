import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import styles from "../styles/Finance.module.css";
import { ArrowLeft, User } from "lucide-react";

interface RefundDetail {
  id: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  booking?: {
    id: string;
    createdAt: string;
    guest?: {
      name: string;
      email: string;
      phoneNumber?: string;
    };
    property?: {
      title: string;
      owner?: {
        name: string;
        email: string;
        phoneNumber?: string;
      };
    };
  };
}

const RefundDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [refund, setRefund] = useState<RefundDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRefund = async () => {
      try {
        const response = await api.get(`/finance/refunds/${id}`);
        setRefund(response.data);
      } catch (err) {
        console.error("Failed to fetch refund details", err);
        setRefund(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchRefund();
  }, [id]);

  if (loading) return <div className={styles.container}>Loading...</div>;
  if (!refund) return <div className={styles.container}>Refund not found</div>;

  const isPending = refund.status.toLowerCase() === 'pending';

  return (
    <div className={styles.container}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#2f95dc",
          fontWeight: "600"
        }}
      >
        <ArrowLeft size={20} /> Back to records
      </button>

      {/* Header section as seen in screenshot */}
      <h1 className={styles.pageTitle} style={{ marginBottom: '24px', fontSize: '1.5rem' }}>Refund detail view</h1>

      <div className={styles.detailCard}>
        <div className={styles.detailList}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Request ID:</span>
            <span className={styles.detailValue}>#{refund.id.toUpperCase()}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Date and time of request:</span>
            <span className={styles.detailValue}>
               {new Date(refund.createdAt).toLocaleString()}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Refund reason:</span>
            <span className={styles.detailValue} style={{ color: 'var(--primary-color)', fontWeight: '500' }}>{refund.reason || "N/A"}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Total amount requested:</span>
            <span className={styles.detailValue} style={{ color: 'var(--primary-color)', fontWeight: '700' }}>
              ₦{refund.amount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.detailCard}>
        <h2 className={styles.detailCardTitle}>Guest information</h2>
        <div className={styles.detailAvatar}>
           <User size={32} color="#94a3b8" />
        </div>
        <div className={styles.detailList}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Guest name:</span>
            <span className={styles.detailValue}>{refund.booking?.guest?.name || "N/A"}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Phone number:</span>
            <span className={styles.detailValue}>{refund.booking?.guest?.phoneNumber || "N/A"}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Email:</span>
            <span className={styles.detailValue}>{refund.booking?.guest?.email || "N/A"}</span>
          </div>
        </div>
      </div>

      <div className={styles.detailCard}>
        <h2 className={styles.detailCardTitle}>Host information</h2>
        <div className={styles.detailAvatar}>
           <User size={32} color="#94a3b8" />
        </div>
        <div className={styles.detailList}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Host name:</span>
            <span className={styles.detailValue}>{refund.booking?.property?.owner?.name || "N/A"}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Phone number:</span>
            <span className={styles.detailValue}>{refund.booking?.property?.owner?.phoneNumber || "N/A"}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Email:</span>
            <span className={styles.detailValue}>{refund.booking?.property?.owner?.email || "N/A"}</span>
          </div>
        </div>
      </div>

      {isPending && (
        <div style={{ display: 'flex', gap: '16px', marginTop: '32px', justifyContent: 'center' }}>
          <button className={styles.approveBtn}>Approve Refund</button>
          <button className={styles.denyBtn}>Deny Refund</button>
        </div>
      )}
    </div>
  );
};

export default RefundDetails;
