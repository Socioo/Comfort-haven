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
} from "lucide-react";
import classNames from "classnames";

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

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await api.get(`/properties/${id}`);
        // Ensure price is a number
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
        {/* Image Gallery Preview - Just showing first image largely for now */}
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
              src={property.images[0]}
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
          {/* Fallback Icon that shows up if img is hidden */}
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
                      }}
                    >
                      <User size={20} />
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
                    onClick={() => navigate(`/hosts/${property.owner?.id}`)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "white",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    View Host Profile
                  </button>
                </div>
              ) : (
                <div style={{ color: "#666", fontStyle: "italic" }}>
                  Unknown Host
                </div>
              )}

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
    </div>
  );
};

export default PropertyDetails;
