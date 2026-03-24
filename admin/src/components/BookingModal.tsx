import { useState, useEffect } from "react";
import api from "../services/api";
import listStyles from "../styles/Guests.module.css";
import pageStyles from "../styles/Pages.module.css";
import { User, X, CheckCircle, XCircle, Clock } from "lucide-react";
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

interface BookingModalProps {
  bookingId: string;
  onClose: () => void;
}

const BookingModal = ({ bookingId, onClose }: BookingModalProps) => {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState("");

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await api.get(`/bookings/${bookingId}`);
        setBooking(response.data);
      } catch (err) {
        console.error("Failed to fetch booking details", err);
        // Fallback for demo
        setBooking({
          id: bookingId || "BK-88229",
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          totalPrice: 45000,
          status: "confirmed",
          createdAt: new Date().toISOString(),
          guest: {
            id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653",
            name: "Adam Lukot",
            email: "adamlukat@gmail.com",
            phoneNumber: "+234 8107775573"
          },
          property: {
            id: "prop-1",
            title: "Luxury Villa",
            location: "Lekki, Lagos",
            owner: {
              name: "Host User",
              email: "host@example.com",
              phoneNumber: "+234 9033344422"
            }
          }
        });
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) fetchBooking();
  }, [bookingId]);

  if (loading) return null;

  if (error || !booking) {
    return (
      <div className={pageStyles.modalOverlay} onClick={onClose} style={{ zIndex: 1050 }}>
        <div className={pageStyles.modal} onClick={(e) => e.stopPropagation()} style={{ borderRadius: '16px' }}>
          <div className={pageStyles.modalHeader}>
            <h2 style={{ color: 'red' }}>{error || "Booking not found"}</h2>
            <button className={pageStyles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSuccessful = booking.status === "confirmed" || booking.status === "completed";
  const getStatusIcon = () => {
    if (booking.status === "confirmed" || booking.status === "completed") return <CheckCircle size={16} />;
    if (booking.status === "cancelled") return <XCircle size={16} />;
    return <Clock size={16} />;
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
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className={pageStyles.modalHeader} 
          style={{ 
            padding: '24px 32px 20px', 
            background: 'var(--card-bg)',
            zIndex: 10
          }}
        >
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 'bold' }}>
              Booking #{booking.id.substring(0, 8).toUpperCase()}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={classNames(listStyles.statusBadge, isSuccessful ? listStyles.active : booking.status === 'cancelled' ? listStyles.failed : listStyles.suspended)} style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {getStatusIcon()}
                {booking.status.toUpperCase()}
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                Placed on {new Date(booking.createdAt).toLocaleDateString()}
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
          
          {/* Transaction Info Grid */}
          <div style={{ background: 'var(--bg-color)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>Transaction Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Amount</span>
                <span style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 'bold' }}>₦{booking.totalPrice.toLocaleString()}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Stay Period</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Duration</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                  {(() => {
                    const start = new Date(booking.startDate);
                    const end = new Date(booking.endDate);
                    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    return `${diffDays} ${diffDays === 1 ? 'night' : 'nights'}`;
                  })()}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Payment Method</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Transfer</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
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
                  <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>{booking.guest?.name || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '2px' }}>Email</span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{booking.guest?.email || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '2px' }}>Phone</span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{booking.guest?.phoneNumber || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Host & Property Info */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="#d97706" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Host & Property</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '2px' }}>Property Title</span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>{booking.property?.title || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '2px' }}>Host Name</span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{booking.property?.owner?.name || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block', marginBottom: '2px' }}>Host Email</span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{booking.property?.owner?.email || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BookingModal;
