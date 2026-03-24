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
  ShieldOff
} from "lucide-react";
import classNames from "classnames";
import UserModal from "../components/UserModal";

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
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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

    if (id) fetchProperty();
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
          color: "#666",
        }}
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className={styles.card} style={{ padding: "0", overflow: "hidden" }}>
        <div
          style={{
            height: "300px",
            background: "#eee",
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
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                color: "#999",
              }}
            >
              <ImageIcon size={64} />
            </div>
          )}
          <div style={{ position: "absolute", zIndex: 0 }}>
            <ImageIcon size={64} color="#ccc" />
          </div>
          <span
            className={classNames(styles.status, styles[property.status])}
            style={{ position: "absolute", top: "20px", right: "20px" }}
          >
            {property.status}
          </span>
        </div>

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
                  color: "#666",
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
                  color: "#2c3e50",
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
                    color: "#666",
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
                  color: "#f59e0b",
                }}
              >
                <Star size={16} fill="#f59e0b" />
                <span style={{ fontWeight: "bold" }}>
                  {property.rating?.toFixed(1) || "N/A"}
                </span>
                <span style={{ color: "#666" }}>
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
              <p style={{ lineHeight: "1.6", color: "#444" }}>
                {property.description}
              </p>

              <h3 style={{ marginTop: "32px" }}>Amenities</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {property.amenities?.map((amenity, index) => (
                  <span
                    key={index}
                    style={{
                      background: "#f0f4f8",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      color: "#333",
                    }}
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "#f8f9fa",
                padding: "24px",
                borderRadius: "12px",
                height: "fit-content",
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
                        background: "#ddd",
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
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        {property.owner.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => property.owner?.id && setSelectedUserId(property.owner.id)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "white",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      cursor: "pointer",
                      marginBottom: "16px"
                    }}
                  >
                    View Host Profile
                  </button>
                </div>
              ) : (
                <div style={{ color: "#666", fontStyle: "italic", marginBottom: "16px" }}>
                  Unknown Host
                </div>
              )}

              {/* Administrative Actions */}
              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #eee' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                          background: '#dcfce7',
                          color: '#16a34a',
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
                          background: '#fee2e2',
                          color: '#ef4444',
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
                        background: '#fef3c7',
                        color: '#d97706',
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
                        background: '#dcfce7',
                        color: '#16a34a',
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
                  borderTop: "1px solid #ddd",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    color: "#666",
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
    </div>
  );
};

export default PropertyDetails;
