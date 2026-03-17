import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import styles from "../styles/Finance.module.css";
import { Search, User } from "lucide-react";
import classNames from "classnames";

interface Payout {
  id: string;
  createdAt: string;
  amount: number;
  status: string;
  method: string;
  booking?: {
    property?: {
      title: string;
      owner?: {
        name: string;
      };
    };
  };
}

const Payouts = () => {
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const samplePayouts: Payout[] = [
    {
      id: "PAY-88229201",
      amount: 45000,
      status: "Paid",
      createdAt: new Date().toISOString(),
      method: "Bank Transfer",
      booking: { property: { title: "Luxury Villa", owner: { name: "Host User" } } }
    },
    {
      id: "PAY-88229202",
      amount: 12500,
      status: "Pending",
      createdAt: new Date().toISOString(),
      method: "Wallet",
      booking: { property: { title: "Downtown Apartment", owner: { name: "Host User" } } }
    },
    {
      id: "PAY-88229203",
      amount: 32000,
      status: "Processing",
      createdAt: new Date().toISOString(),
      method: "Bank Transfer",
      booking: { property: { title: "Beach Front House", owner: { name: "Host User" } } }
    },
    {
      id: "PAY-88229204",
      amount: 15000,
      status: "Paid",
      createdAt: new Date().toISOString(),
      method: "Bank Transfer",
      booking: { property: { title: "Cozy Studio", owner: { name: "Host User" } } }
    },
    {
      id: "PAY-88229205",
      amount: 22500,
      status: "Failed",
      createdAt: new Date().toISOString(),
      method: "Wallet",
      booking: { property: { title: "Mountain Cabin", owner: { name: "Host User" } } }
    },
    {
      id: "PAY-88229206",
      amount: 41000,
      status: "Paid",
      createdAt: new Date().toISOString(),
      method: "Bank Transfer",
      booking: { property: { title: "Penthouse Suite", owner: { name: "Host User" } } }
    },
    {
      id: "PAY-88229207",
      amount: 18500,
      status: "Pending",
      createdAt: new Date().toISOString(),
      method: "Bank Transfer",
      booking: { property: { title: "Lakeside Cottage", owner: { name: "Host User" } } }
    },
    {
      id: "PAY-88229208",
      amount: 55000,
      status: "Paid",
      createdAt: new Date().toISOString(),
      method: "Wallet",
      booking: { property: { title: "Urban Loft", owner: { name: "Host User" } } }
    },
    {
      id: "PAY-88229209",
      amount: 27000,
      status: "Processing",
      createdAt: new Date().toISOString(),
      method: "Bank Transfer",
      booking: { property: { title: "Modern Villa", owner: { name: "Host User" } } }
    },
    {
      id: "PAY-88229210",
      amount: 12000,
      status: "Paid",
      createdAt: new Date().toISOString(),
      method: "Bank Transfer",
      booking: { property: { title: "Safari Lodge", owner: { name: "Host User" } } }
    }
  ];

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        const response = await api.get("/finance/payouts");
        setPayouts(response.data.length > 0 ? response.data : samplePayouts);
      } catch (error) {
        console.error("Failed to fetch payouts", error);
        setPayouts(samplePayouts);
      } finally {
        setLoading(false);
      }
    };

    fetchPayouts();
  }, [samplePayouts]);

  const filteredPayouts = useMemo(() => {
    return payouts.filter(p => 
      p.booking?.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.booking?.property?.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [payouts, searchTerm]);

  const stats = useMemo(() => {
    const total = payouts.length;
    const uniqueHosts = new Set(payouts.map(p => p.booking?.property?.owner?.name)).size;
    const completed = payouts.filter(p => p.status.toLowerCase() === 'paid' || p.status.toLowerCase() === 'completed').length;
    const failed = payouts.filter(p => p.status.toLowerCase() === 'failed' || p.status.toLowerCase() === 'rejected').length;
    return { total, uniqueHosts, completed, failed };
  }, [payouts]);

  if (loading) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 className={styles.pageTitle}>Payouts record</h1>
          <div className={styles.searchBar}>
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="search records" 
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCardSolid}>
          <span className={styles.statLabel}>Total Payouts</span>
          <span className={styles.statValue}>{stats.total}</span>
        </div>
        <div className={styles.statCardLight}>
          <span className={styles.statLabel}>Total hosts with payouts</span>
          <span className={styles.statValue}>{stats.uniqueHosts}</span>
        </div>
        <div className={styles.statCardLight}>
          <span className={styles.statLabel}>Completed payouts</span>
          <span className={styles.statValue}>{stats.completed}</span>
        </div>
        <div className={styles.statCardSolid}>
          <span className={styles.statLabel}>Failed payouts</span>
          <span className={styles.statValue}>{stats.failed}</span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.customTable}>
          <thead>
            <tr>
              <th>Payout time</th>
              <th>Status</th>
              <th>Property</th>
              <th>Host</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayouts.map((p) => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </td>
                <td>
                  <span className={classNames(
                    styles.statusBadge,
                    (p.status.toLowerCase() === 'paid' || p.status.toLowerCase() === 'completed') ? styles.active : 
                    (p.status.toLowerCase() === 'failed' || p.status.toLowerCase() === 'rejected') ? styles.failed : styles.suspended
                  )}>
                    {p.status}
                  </span>
                </td>
                <td>{p.booking?.property?.title || "Unknown"}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className={styles.avatarContainer}>
                      <User size={16} color="#94a3b8" />
                    </div>
                    <span style={{ fontWeight: 500 }}>{p.booking?.property?.owner?.name || "Unknown"}</span>
                  </div>
                </td>
                <td>₦{p.amount.toLocaleString()}</td>
                <td>
                  <button 
                    className={styles.viewBtn}
                    onClick={() => navigate(`/payouts/${p.id}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payouts;
