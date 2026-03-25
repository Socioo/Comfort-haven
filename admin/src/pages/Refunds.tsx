import { useState, useEffect, useMemo } from "react";

import api from "../services/api";
import styles from "../styles/Finance.module.css";
import { Search, User } from "lucide-react";
import classNames from "classnames";
import RefundModal from "../components/RefundModal";

interface Refund {
  id: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  booking?: {
    id: string;
    guest?: {
      name: string;
    };
    property?: {
      title: string;
    };
  };
}

const Refunds = () => {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRefundId, setSelectedRefundId] = useState<string | null>(null);

  const sampleRefunds: Refund[] = [
    {
      id: "REF-99228102",
      amount: 15400,
      reason: "Booking cancellation",
      status: "Successful",
      createdAt: new Date().toISOString(),
      booking: {
        id: "BK-1001",
        guest: { name: "Adam Lukot" },
        property: { title: "Luxury Villa" }
      }
    },
    {
      id: "REF-99228103",
      amount: 4500,
      reason: "Host unavailable",
      status: "Pending",
      createdAt: new Date().toISOString(),
      booking: {
        id: "BK-1002",
        guest: { name: "Adam Lukot" },
        property: { title: "Beach Front House" }
      }
    },
    {
      id: "REF-99228104",
      amount: 22000,
      reason: "Property damage",
      status: "Successful",
      createdAt: new Date().toISOString(),
      booking: {
        id: "BK-1003",
        guest: { name: "Adam Lukot" },
        property: { title: "Downtown Apartment" }
      }
    },
    {
      id: "REF-99228105",
      amount: 8000,
      reason: "Check-in issues",
      status: "Processing",
      createdAt: new Date().toISOString(),
      booking: {
        id: "BK-1004",
        guest: { name: "Adam Lukot" },
        property: { title: "Cozy Studio" }
      }
    },
    {
      id: "REF-99228106",
      amount: 12000,
      reason: "Maintenance issue",
      status: "Failed",
      createdAt: new Date().toISOString(),
      booking: {
        id: "BK-1005",
        guest: { name: "Adam Lukot" },
        property: { title: "Mountain Cabin" }
      }
    },
    {
      id: "REF-99228107",
      amount: 35000,
      reason: "Booking collision",
      status: "Successful",
      createdAt: new Date().toISOString(),
      booking: {
        id: "BK-1006",
        guest: { name: "Adam Lukot" },
        property: { title: "Penthouse Suite" }
      }
    },
    {
      id: "REF-99228108",
      amount: 5000,
      reason: "Cleaning error",
      status: "Pending",
      createdAt: new Date().toISOString(),
      booking: {
        id: "BK-1007",
        guest: { name: "Adam Lukot" },
        property: { title: "Lakeside Cottage" }
      }
    },
    {
      id: "REF-99228109",
      amount: 25000,
      reason: "Host cancellation",
      status: "Successful",
      createdAt: new Date().toISOString(),
      booking: {
        id: "BK-1008",
        guest: { name: "Adam Lukot" },
        property: { title: "Urban Loft" }
      }
    },
    {
      id: "REF-99228110",
      amount: 11000,
      reason: "Service failure",
      status: "Processing",
      createdAt: new Date().toISOString(),
      booking: {
        id: "BK-1009",
        guest: { name: "Adam Lukot" },
        property: { title: "Modern Villa" }
      }
    },
    {
      id: "REF-99228111",
      amount: 42000,
      reason: "Amenities missing",
      status: "Successful",
      createdAt: new Date().toISOString(),
      booking: {
        id: "BK-1010",
        guest: { name: "Adam Lukot" },
        property: { title: "Safari Lodge" }
      }
    }
  ];

  const fetchRefunds = async () => {
    try {
      const response = await api.get("/finance/refunds");
      setRefunds(response.data.length > 0 ? response.data : sampleRefunds);
    } catch (error) {
      console.error("Error fetching refunds:", error);
      setRefunds(sampleRefunds);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const filteredRefunds = useMemo(() => {
    return refunds.filter(r => 
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.booking?.guest?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [refunds, searchTerm]);

  const stats = useMemo(() => {
    const total = refunds.length;
    const successful = refunds.filter(r => r.status.toLowerCase() === 'successful' || r.status.toLowerCase() === 'completed').length;
    const pending = refunds.filter(r => r.status.toLowerCase() === 'pending').length;
    const failed = refunds.filter(r => r.status.toLowerCase() === 'failed' || r.status.toLowerCase() === 'rejected').length;
    return { total, successful, pending, failed };
  }, [refunds]);

  if (loading) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 className={styles.pageTitle}>Refunds record</h1>
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
          <span className={styles.statLabel}>Total Refunds</span>
          <span className={styles.statValue}>{stats.total}</span>
        </div>
        <div className={styles.statCardLight}>
          <span className={styles.statLabel}>Successful refunds</span>
          <span className={styles.statValue}>{stats.successful}</span>
        </div>
        <div className={styles.statCardLight}>
          <span className={styles.statLabel}>Pending refunds</span>
          <span className={styles.statValue}>{stats.pending}</span>
        </div>
        <div className={styles.statCardSolid}>
          <span className={styles.statLabel}>Failed refunds</span>
          <span className={styles.statValue}>{stats.failed}</span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.customTable}>
          <thead>
            <tr>
              <th>Refund time</th>
              <th>Status</th>
              <th>Property</th>
              <th>Guest</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRefunds.map((r) => (
              <tr key={r.id}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </td>
                <td>
                  <span className={classNames(
                    styles.statusBadge,
                    (r.status.toLowerCase() === 'successful' || r.status.toLowerCase() === 'completed') ? styles.active : 
                    (r.status.toLowerCase() === 'failed' || r.status.toLowerCase() === 'rejected') ? styles.failed : styles.suspended
                  )}>
                    {r.status}
                  </span>
                </td>
                <td>{r.booking?.property?.title || "Unknown"}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className={styles.avatarContainer}>
                      <User size={16} color="#94a3b8" />
                    </div>
                    <span style={{ fontWeight: 500 }}>{r.booking?.guest?.name || "Unknown"}</span>
                  </div>
                </td>
                <td>₦{r.amount.toLocaleString()}</td>
                <td>
                  <button 
                    className={styles.viewBtn}
                    onClick={() => setSelectedRefundId(r.id)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedRefundId && (
        <RefundModal 
          refundId={selectedRefundId} 
          onClose={() => setSelectedRefundId(null)} 
          onUpdate={fetchRefunds}
        />
      )}
    </div>
  );
};

export default Refunds;
