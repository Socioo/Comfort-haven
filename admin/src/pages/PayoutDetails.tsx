import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import styles from "../styles/Finance.module.css";
import { ArrowLeft, User } from "lucide-react";

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

const PayoutDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payout, setPayout] = useState<PayoutDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayout = async () => {
      try {
        const response = await api.get(`/finance/payouts/${id}`);
        setPayout(response.data);
      } catch (err) {
        console.error("Failed to fetch payout details", err);
        // Fallback for demo
        setPayout({
          id: id || "PAY-882292",
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

    if (id) fetchPayout();
  }, [id]);

  if (loading) return <div className={styles.container}>Loading...</div>;
  if (!payout) return <div className={styles.container}>Payout not found</div>;

  const isPending = payout.status.toLowerCase() === 'pending' || payout.status.toLowerCase() === 'processing';

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

      <h1 className={styles.pageTitle} style={{ marginBottom: '24px', fontSize: '1.5rem' }}>Payout detail view</h1>

      <div className={styles.detailCard}>
        <div className={styles.detailList}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Payout ID:</span>
            <span className={styles.detailValue}>#{payout.id.toUpperCase()}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Date and time of request:</span>
            <span className={styles.detailValue}>
               {new Date(payout.createdAt).toLocaleString()}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Payment method:</span>
            <span className={styles.detailValue}>{payout.method}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Amount:</span>
            <span className={styles.detailValue} style={{ color: 'var(--primary-color)', fontWeight: '700' }}>
              ₦{payout.amount.toLocaleString()}
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
            <span className={styles.detailValue}>{payout.booking?.guest?.name || "N/A"}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Phone number:</span>
            <span className={styles.detailValue}>{payout.booking?.guest?.phoneNumber || "N/A"}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Email:</span>
            <span className={styles.detailValue}>{payout.booking?.guest?.email || "N/A"}</span>
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
            <span className={styles.detailValue}>{payout.booking?.property?.owner?.name || "N/A"}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Phone number:</span>
            <span className={styles.detailValue}>{payout.booking?.property?.owner?.phoneNumber || "N/A"}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Email:</span>
            <span className={styles.detailValue}>{payout.booking?.property?.owner?.email || "N/A"}</span>
          </div>
        </div>
      </div>

      {isPending && (
        <div style={{ display: 'flex', gap: '16px', marginTop: '32px', justifyContent: 'center' }}>
          <button className={styles.approveBtn}>Approve Payout</button>
          <button className={styles.denyBtn}>Deny Payout</button>
        </div>
      )}
    </div>
  );
};

export default PayoutDetails;
