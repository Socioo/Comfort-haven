import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import styles from "../components/Support.module.css";
import SupportModal from "../components/SupportModal";
import Pagination from "../components/Pagination";

import api from "../services/api";

interface SupportIssue {
  id: string;
  date: string;
  status: "Open" | "In progress" | "Successful" | "Pending";
  refundId: string;
  issuerName: string;
  role: string;
  summary: string;
}

const Support = () => {
  const [selectedIssue, setSelectedIssue] = useState<SupportIssue | null>(null);
  const [issues, setIssues] = useState<SupportIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const transformTicket = (ticket: any): SupportIssue => ({
    id: ticket.id,
    date: ticket.createdAt
      ? new Date(ticket.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
      : ticket.date || '',
    status: ticket.status,
    refundId: ticket.refundId || `#${ticket.id?.slice(-6).toUpperCase()}`,
    issuerName: ticket.user
      ? `${ticket.user.firstName || ''} ${ticket.user.lastName || ''}`.trim() || ticket.user.email || 'Unknown'
      : ticket.issuerName || 'Unknown',
    role: ticket.user?.role
      ? ticket.user.role.charAt(0).toUpperCase() + ticket.user.role.slice(1).toLowerCase()
      : ticket.role || 'Guest',
    summary: ticket.summary || ticket.category || '',
  });

  const fetchIssues = async () => {
    try {
      const response = await api.get("/support");
      const data: SupportIssue[] = (response.data || []).map(transformTicket);
      setIssues(data);
    } catch (err) {
      console.error("Failed to fetch support issues", err);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => 
      issue.issuerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.refundId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [issues, searchTerm]);

  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredIssues.slice(start, start + itemsPerPage);
  }, [filteredIssues, currentPage]);

  // Reset to first page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container}>
      {/* ... existing markup ... */}
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <h1 className={styles.pageTitle}>Support record</h1>
          <div className={styles.searchBar}>
            <Search size={18} color="var(--text-light)" />
            <input 
              type="text" 
              placeholder="Search records" 
              className={styles.searchInput} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date issued</th>
              <th>Status</th>
              <th>Refund ID</th>
              <th>Issuer name</th>
              <th>Role</th>
              <th>Issue summary</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedIssues.map((issue, index) => (
              <tr key={`${issue.id}-${index}`}>
                <td>{issue.date}</td>
                <td>
                  <span className={`${styles.status} ${styles[issue.status.toLowerCase().replace(" ", "")]}`}>
                    {issue.status}
                  </span>
                </td>
                <td>{issue.refundId}</td>
                <td>{issue.issuerName}</td>
                <td>{issue.role}</td>
                <td>{issue.summary}</td>
                <td>
                  <button 
                    className={styles.viewBtn}
                    onClick={() => setSelectedIssue(issue)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination 
          currentPage={currentPage}
          totalItems={filteredIssues.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {selectedIssue && (
        <SupportModal 
          issue={selectedIssue} 
          onClose={() => setSelectedIssue(null)} 
          onUpdate={fetchIssues}
        />
      )}
    </div>
  );
};

export default Support;
