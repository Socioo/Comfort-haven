import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import styles from "../styles/Pages.module.css";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  User,
  Star,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  ShieldCheck,
  ShieldOff,
  X
} from "lucide-react";
import classNames from "classnames";
import UserModal from "../components/UserModal";
import UserAvatar from "../components/UserAvatar";

interface Review {
  id: string;
  comment: string;
  rating: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    profileImage: string;
  };
}

interface PropertyDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  status: "active" | "pending" | "suspended";
  images: string[];
  owner: {
    id: string;
    name: string;
    email: string;
  } | null;
  rating: number;
  reviewCount: number;
  amenities: string[];
  createdAt: string;
}

const getImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  const baseUrl = 'http://localhost:3000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await api.get(`/properties/${id}`);
        const data = response.data;
        data.price = Number(data.price);
        setProperty(data);
      } catch (err) {
        console.error("Failed to fetch property details", err);
        setError("Failed to load property details.");
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await api.get(`/reviews/property/${id}`);
        setReviews(response.data);
      } catch (err) {
        console.error("Failed to fetch reviews", err);
      } finally {
        setReviewsLoading(false);
      }
    };

    if (id) {
      fetchProperty();
      fetchReviews();
    }
  }, [id]);

  const handleStatusChange = async (newStatus: PropertyDetail["status"]) => {
    if (!property) return;
    
    // Optimistic update
    const previousStatus = property.status;
    setProperty({ ...property, status: newStatus });

    try {
      await api.patch(`/properties/${id}`, { status: newStatus });
    } catch (err) {
      console.error("Failed to update property status", err);
      alert("Failed to update status. Please try again.");
      setProperty({ ...property, status: previousStatus });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!property) return <div>Property not found</div>;

  return (
    <div className={styles.container}>
      <button
        onClick={() => navigate(-1)}
        className={styles.backBtn}
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-light)",
        }}
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className={styles.card} style={{ padding: "0", overflow: "hidden" }}>
        <div
          style={{
            height: "300px",
            background: "var(--light-gray)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {property.images && property.images.length > 0 ? (
            <img
              src={getImageUrl(property.images[0])}
              alt={property.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
              onClick={() => setSelectedImage(property.images[0])}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "var(--text-light)",
              }}
            >
              <ImageIcon size={64} />
            </div>
          )}
          <div style={{ position: "absolute", zIndex: 0 }}>
            <ImageIcon size={64} color="var(--border-color)" />
          </div>
          <span
            className={classNames(styles.status, styles[property.status])}
            style={{ position: "absolute", top: "20px", right: "20px" }}
          >
            {property.status}
          </span>
        </div>

        {property.images && property.images.length > 1 && (
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            padding: '12px 32px', 
            background: 'var(--bg-color)',
            borderBottom: '1px solid var(--border-color)',
            overflowX: 'auto'
          }}>
            {property.images.map((img, index) => (
              <div 
                key={index}
                onClick={() => setSelectedImage(img)}
                style={{
                  width: '80px',
                  height: '60px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <img 
                  src={getImageUrl(img)} 
                  alt={`${property.title} ${index + 1}`} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: "32px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "24px",
            }}
          >
            <div>
              <h1 style={{ margin: "0 0 8px 0" }}>{property.title}</h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "var(--text-light)",
                }}
              >
                <MapPin size={18} />
                <span>{property.location}</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "var(--text-main)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <DollarSign size={20} />
                {property.price}
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "normal",
                    color: "var(--text-light)",
                  }}
                >
                  /night
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  justifyContent: "flex-end",
                  marginTop: "4px",
                  color: "var(--warning-color)",
                }}
              >
                <Star size={16} fill="#f59e0b" />
                <span style={{ fontWeight: "bold" }}>
                  {property.rating?.toFixed(1) || "N/A"}
                </span>
                <span style={{ color: "var(--text-light)" }}>
                  ({property.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "32px",
            }}
          >
            <div>
              <h3>Description</h3>
              <p style={{ lineHeight: "1.6", color: "var(--text-main)" }}>
                {property.description}
              </p>

              <h3 style={{ marginTop: "32px" }}>Amenities</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {property.amenities?.map((amenity, index) => (
                  <span
                    key={index}
                    style={{
                      background: "var(--bg-color)",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      color: "var(--text-main)",
                    }}
                  >
                    {amenity}
                  </span>
                ))}
              </div>

              <h3 style={{ marginTop: "32px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                Guest Reviews 
                <span style={{ fontSize: "14px", fontWeight: "normal", color: "var(--text-light)" }}>
                  ({reviews.length})
                </span>
              </h3>

              {reviewsLoading ? (
                <div style={{ color: "var(--text-light)", fontStyle: "italic" }}>Loading reviews...</div>
              ) : reviews.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {reviews.map((review) => (
                    <div 
                      key={review.id} 
                      style={{ 
                        padding: "16px", 
                        background: "var(--card-bg)", 
                        borderRadius: "12px", 
                        border: "1px solid var(--border-color)" 
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                        <div 
                          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                          onClick={() => setSelectedUserId(review.user.id)}
                        >
                          <UserAvatar 
                            name={review.user.name} 
                            image={review.user.profileImage} 
                            size={32} 
                          />
                          <div>
                            <div style={{ fontWeight: "600", fontSize: "14px" }}>{review.user.name}</div>
                            <div style={{ fontSize: "12px", color: "var(--text-light)" }}>
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "2px", color: "#f59e0b" }}>
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={14} 
                              fill={i < review.rating ? "#f59e0b" : "none"} 
                              stroke={i < review.rating ? "#f59e0b" : "currentColor"} 
                            />
                          ))}
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5", color: "var(--text-main)" }}>
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  padding: "24px", 
                  textAlign: "center", 
                  background: "var(--bg-color)", 
                  borderRadius: "12px", 
                  color: "var(--text-light)",
                  border: "1px dashed var(--border-color)"
                }}>
                  No reviews yet for this property.
                </div>
              )}
            </div>

            <div
              style={{
                background: "var(--card-bg)",
                padding: "24px",
                borderRadius: "12px",
                height: "fit-content",
                border: "1px solid var(--border-color)",
              }}
            >
              <h3 style={{ marginTop: "0" }}>Host Info</h3>
              {property.owner ? (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "var(--border-color)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden"
                      }}
                    >
                      {(property.owner as any)?.profileImage ? (
                        <img 
                          src={getImageUrl((property.owner as any).profileImage)} 
                          alt={property.owner.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold" }}>
                        {property.owner.name}
                      </div>
                      <div style={{ fontSize: "14px", color: "var(--text-light)" }}>
                        {property.owner.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => property.owner?.id && setSelectedUserId(property.owner.id)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "var(--card-bg)",
                      color: "var(--text-main)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      marginBottom: "16px"
                    }}
                  >
                    View Host Profile
                  </button>
                </div>
              ) : (
                <div style={{ color: "var(--text-light)", fontStyle: "italic", marginBottom: "16px" }}>
                  Unknown Host
                </div>
              )}

              {/* Administrative Actions */}
              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-light)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Administrative actions
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {property.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('active')}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'var(--success-bg)',
                          color: 'var(--success-color)',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <ShieldCheck size={18} /> Approve Property
                      </button>
                      <button
                        onClick={() => handleStatusChange('suspended')}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'var(--error-bg)',
                          color: 'var(--error-color)',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <ShieldOff size={18} /> Reject Property
                      </button>
                    </>
                  )}
                  {property.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange('suspended')}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'var(--warning-bg)',
                        color: 'var(--warning-color)',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <AlertTriangle size={18} /> Suspend Property
                    </button>
                  )}
                  {property.status === 'suspended' && (
                    <button
                      onClick={() => handleStatusChange('active')}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'var(--success-bg)',
                        color: 'var(--success-color)',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Check size={18} /> Activate Property
                    </button>
                  )}
                </div>
              </div>

              <div
                style={{
                  marginTop: "24px",
                  paddingTop: "24px",
                  borderTop: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text-light)",
                    marginBottom: "8px",
                  }}
                >
                  Listed on
                </div>
                <div>{new Date(property.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {selectedUserId && (
        <UserModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}

      {selectedImage && (
        <div 
          className={styles.modalOverlay} 
          onClick={() => setSelectedImage(null)}
          style={{ cursor: 'zoom-out' }}
        >
          <div 
            className={styles.modal} 
            style={{ 
              padding: 0, 
              background: 'none', 
              border: 'none', 
              boxShadow: 'none',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={getImageUrl(selectedImage)} 
              alt="Preview" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)'
              }} 
            />
            <button 
              onClick={() => setSelectedImage(null)}
              className={styles.closeBtn}
              style={{
                position: 'absolute',
                top: '-50px',
                right: '0',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(4px)',
                width: '40px',
                height: '40px'
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;
