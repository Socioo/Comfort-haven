import { useState, useEffect, useMemo } from "react";

import api from "../services/api";
import listStyles from "../styles/Guests.module.css";
import { Search, User } from "lucide-react";
import classNames from "classnames";
import BookingModal from "../components/BookingModal";
import Pagination from "../components/Pagination";

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  guest: {
    id: string;
    name: string;
  } | null;
  property: {
    id: string;
    title: string;
  } | null;
}

const Bookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sampleBookings: Booking[] = [
    {
      id: "BK-88229101",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalPrice: 45000,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      guest: { id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653", name: "Adam Lukot" },
      property: { id: "prop-1", title: "Luxury Villa" }
    },
    {
      id: "BK-88229102",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalPrice: 12500,
      status: "pending",
      createdAt: new Date().toISOString(),
      guest: { id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653", name: "Adam Lukot" },
      property: { id: "prop-2", title: "Beach Front House" }
    },
    {
      id: "BK-88229103",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalPrice: 22000,
      status: "completed",
      createdAt: new Date().toISOString(),
      guest: { id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653", name: "Adam Lukot" },
      property: { id: "prop-3", title: "Downtown Apartment" }
    },
    {
      id: "BK-88229104",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalPrice: 18000,
      status: "cancelled",
      createdAt: new Date().toISOString(),
      guest: { id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653", name: "Adam Lukot" },
      property: { id: "prop-4", title: "Cozy Studio" }
    },
    {
      id: "BK-88229105",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalPrice: 35000,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      guest: { id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653", name: "Adam Lukot" },
      property: { id: "prop-5", title: "Mountain Cabin" }
    },
    {
      id: "BK-88229106",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalPrice: 55000,
      status: "pending",
      createdAt: new Date().toISOString(),
      guest: { id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653", name: "Adam Lukot" },
      property: { id: "prop-6", title: "Penthouse Suite" }
    },
    {
      id: "BK-88229107",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalPrice: 27500,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      guest: { id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653", name: "Adam Lukot" },
      property: { id: "prop-7", title: "Lakeside Cottage" }
    },
    {
      id: "BK-88229108",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalPrice: 9500,
      status: "completed",
      createdAt: new Date().toISOString(),
      guest: { id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653", name: "Adam Lukot" },
      property: { id: "prop-8", title: "Urban Loft" }
    },
    {
      id: "BK-88229109",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalPrice: 15000,
      status: "pending",
      createdAt: new Date().toISOString(),
      guest: { id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653", name: "Adam Lukot" },
      property: { id: "prop-9", title: "Modern Villa" }
    },
    {
      id: "BK-88229110",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalPrice: 42000,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      guest: { id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653", name: "Adam Lukot" },
      property: { id: "prop-10", title: "Safari Lodge" }
    }
  ];

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get("/bookings");
      setBookings(response.data.length > 0 ? response.data : sampleBookings);
    } catch (error) {
      console.error("Failed to fetch bookings", error);
      setBookings(sampleBookings);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => 
      b.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.guest?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bookings, searchTerm]);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(start, start + itemsPerPage);
  }, [filteredBookings, currentPage]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const successful = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
    const failed = bookings.filter(b => b.status === 'cancelled').length;
    const uncompleted = total - successful - failed;
    return { total, successful, uncompleted, failed };
  }, [bookings]);

  // Reset to first page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className={listStyles.container}>
      <div className={listStyles.pageHeader}>
        <div className={listStyles.headerLeft}>
          <h1 className={listStyles.pageTitle}>Booking records</h1>
          <div className={listStyles.searchBar}>
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="search menu" 
              className={listStyles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={listStyles.statsGrid}>
        <div className={listStyles.statCardSolid}>
          <span className={listStyles.statLabel}>Total bookings</span>
          <span className={listStyles.statValue}>{stats.total}</span>
        </div>
        <div className={listStyles.statCardLight}>
          <span className={listStyles.statLabel}>Successful bookings</span>
          <span className={listStyles.statValue}>{stats.successful}</span>
        </div>
        <div className={listStyles.statCardLight}>
          <span className={listStyles.statLabel}>Uncompleted bookings</span>
          <span className={listStyles.statValue}>{stats.uncompleted}</span>
        </div>
        <div className={listStyles.statCardSolid}>
          <span className={listStyles.statLabel}>Failed bookings</span>
          <span className={listStyles.statValue}>{stats.failed}</span>
        </div>
      </div>

      <div className={listStyles.tableContainer}>
        <table className={listStyles.customTable}>
          <thead>
            <tr>
              <th>Booking Time</th>
              <th>Status</th>
              <th>Property</th>
              <th>Guest</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBookings.map((b) => (
              <tr key={b.id}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </td>
                <td>
                  <span
                    className={classNames(
                      listStyles.statusBadge,
                      (b.status === "confirmed" || b.status === "completed") 
                        ? listStyles.active 
                        : b.status === "cancelled" 
                          ? listStyles.failed 
                          : listStyles.suspended
                    )}
                  >
                    {b.status}
                  </span>
                </td>
                <td>{b.property?.title || "Unknown"}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className={listStyles.avatarContainer}>
                      <User size={16} color="#94a3b8" />
                    </div>
                    <span style={{ fontWeight: 500 }}>{b.guest?.name || "Unknown"}</span>
                  </div>
                </td>
                <td>₦{b.totalPrice.toLocaleString()}</td>
                <td>
                  <button
                    className={listStyles.viewBtn}
                    onClick={() => setSelectedBookingId(b.id)}
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
          totalItems={filteredBookings.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
      {selectedBookingId && (
        <BookingModal bookingId={selectedBookingId} onClose={() => setSelectedBookingId(null)} />
      )}
    </div>
  );
};

export default Bookings;
