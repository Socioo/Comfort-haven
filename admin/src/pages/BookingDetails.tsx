import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import listStyles from "../styles/Guests.module.css";
import { ArrowLeft, User } from "lucide-react";
import classNames from "classnames";

interface BookingDetail {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  guest: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  } | null;
  property: {
    id: string;
    title: string;
    location: string;
    owner: {
      name: string;
      email: string;
      phoneNumber?: string;
    } | null;
  } | null;
}

const BookingDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await api.get(`/bookings/${id}`);
        setBooking(response.data);
      } catch (err) {
        console.error("Failed to fetch booking details", err);
        setBooking(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBooking();
  }, [id]);

  if (loading) return <div className={listStyles.container}>Loading...</div>;
  if (!booking) return <div className={listStyles.container}>Booking not found</div>;

  const isSuccessful = booking.status === "confirmed" || booking.status === "completed";
  const themeBlue = "#2f95dc";

  return (
    <div className={listStyles.container}>
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

      <h1 className={listStyles.pageTitle} style={{ marginBottom: '24px', fontSize: '1.5rem' }}>Booking detail</h1>

      <div className={listStyles.detailCard}>
        <div className={listStyles.detailSection}>
          <h2 className={listStyles.pageTitle} style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Booking transaction</h2>
          <div className={listStyles.detailList}>
            <div className={listStyles.detailRow}>
              <span className={listStyles.detailLabel}>Booking ID:</span>
              <span className={listStyles.detailValue}>#{booking.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className={listStyles.detailRow}>
              <span className={listStyles.detailLabel}>Time of transaction:</span>
              <span className={listStyles.detailValue}>
                 {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className={listStyles.detailRow}>
              <span className={listStyles.detailLabel}>Transaction status:</span>
              <span className={classNames(
                listStyles.statusBadge,
                isSuccessful ? listStyles.active : listStyles.failed
              )}>
                {isSuccessful ? "Successful" : "Failed"}
              </span>
            </div>
            <div className={listStyles.detailRow}>
              <span className={listStyles.detailLabel}>Payment status:</span>
              <span className={listStyles.detailValue}>Paid</span>
            </div>
            <div className={listStyles.detailRow}>
              <span className={listStyles.detailLabel}>Payment method:</span>
              <span className={listStyles.detailValue}>Transfer</span>
            </div>
            <div className={listStyles.detailRow}>
              <span className={listStyles.detailLabel}>Stay period:</span>
              <span className={listStyles.detailValue}>
                {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className={listStyles.detailRow}>
              <span className={listStyles.detailLabel}>Duration of stay:</span>
              <span className={listStyles.detailValue}>
                {(() => {
                  const start = new Date(booking.startDate);
                  const end = new Date(booking.endDate);
                  const diffTime = Math.abs(end.getTime() - start.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return `${diffDays} ${diffDays === 1 ? 'night' : 'nights'}`;
                })()}
              </span>
            </div>
            <div className={listStyles.detailRow}>
              <span className={listStyles.detailLabel}>Amount:</span>
              <span className={listStyles.detailValue} style={{ color: themeBlue, fontWeight: '700' }}>
                ₦{booking.totalPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={listStyles.detailCard}>
        <div className={listStyles.detailSection}>
          <h2 className={listStyles.pageTitle} style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Guest information</h2>
          <div className={listStyles.detailAvatar}>
             <User size={32} color="#94a3b8" />
          </div>
          <div className={listStyles.detailList}>
            <div className={listStyles.detailRow}>
              <span className={listStyles.detailLabel}>Guest name:</span>
              <span className={listStyles.detailValue}>{booking.guest?.name || "N/A"}</span>
            </div>
            <div className={listStyles.detailRow}>
              <span className={listStyles.detailLabel}>Phone number:</span>
              <span className={listStyles.detailValue}>{booking.guest?.phoneNumber || "N/A"}</span>
            </div>
            <div className={listStyles.detailRow}>
              <span className={listStyles.detailLabel}>Email:</span>
              <span className={listStyles.detailValue}>{booking.guest?.email || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={listStyles.detailCard}>
        <div className={listStyles.detailSection}>
          <h2 className={listStyles.pageTitle} style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Property & Host information</h2>
          <div className={listStyles.detailAvatar}>
             <User size={32} color="#94a3b8" />
          </div>
          <div className={listStyles.detailList}>
            <div className={listStyles.detailRow}>
              <span className={listStyles.detailLabel}>Property title:</span>
              <span className={listStyles.detailValue}>{booking.property?.title || "N/A"}</span>
            </div>
            <div className={listStyles.detailRow}>
              <span className={listStyles.detailLabel}>Host name:</span>
              <span className={listStyles.detailValue}>{booking.property?.owner?.name || "N/A"}</span>
            </div>
            <div className={listStyles.detailRow}>
              <span className={listStyles.detailLabel}>Host email:</span>
              <span className={listStyles.detailValue}>{booking.property?.owner?.email || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
