import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import styles from "../styles/Pages.module.css";
import listStyles from "../styles/Guests.module.css";
import {
  X,
  Search,
  Image as ImageIcon,
  Upload,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import classNames from "classnames";
import Pagination from "../components/Pagination";
import NotificationModal from "../components/NotificationModal";
import type { NotificationType } from "../components/NotificationModal";

interface Property {
  id: string;
  title: string;
  location: string;
  host: string;
  price: number;
  status: "active" | "pending" | "suspended";
  createdAt: string;
  images?: string[];
}

const getImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  const baseUrl = 'http://localhost:3000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? 'N/A' : d.toISOString().split('T')[0];
};

const formatTime = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Properties = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [hosts, setHosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Media
  const [media, setMedia] = useState<{ url: string; type: string }[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    price: "",
    ownerId: "",
    status: "pending" as Property["status"],
    amenities: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [notification, setNotification] = useState<{ isOpen: boolean; type: NotificationType; title: string; message: string }>({
    isOpen: false,
    type: "info",
    title: "",
    message: ""
  });

  useEffect(() => {
    fetchProperties();
    fetchHosts();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await api.get("/properties");
      const mappedProperties = response.data.map((p: any) => ({
        ...p,
        host: p.owner?.name || "Unknown",
        price: Number(p.price),
      }));
      setProperties(mappedProperties);
    } catch (error) {
      console.error("Failed to fetch properties", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHosts = async () => {
    try {
      const response = await api.get("/users?role=host");
      setHosts(response.data);
    } catch (error) {
      console.error("Failed to fetch hosts", error);
    }
  };



  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      setSubmitting(true);
      const response = await api.post("/properties/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMedia((prev) => [...prev, ...response.data]);
    } catch (error) {
      console.error("Upload failed", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Upload Failed",
        message: "Failed to upload media. Please try again."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        images: media.filter((m) => m.type === "image").map((m) => m.url),
        videos: media.filter((m) => m.type === "video").map((m) => m.url),
        amenities: formData.amenities.split(",").map((s) => s.trim()),
      };

      await api.post("/properties", payload);
      resetForm();
      fetchProperties();
    } catch (error) {
      console.error("Failed to add property", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Save Failed",
        message: "Failed to add property. Please check all fields and try again."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setStep(1);
    setMedia([]);
    setFormData({
      title: "",
      description: "",
      location: "",
      price: "",
      ownerId: "",
      status: "pending",
      amenities: "",
    });
  };

  const filteredProperties = useMemo(() => {
    return properties.filter(p => 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.host.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [properties, searchTerm]);

  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProperties.slice(start, start + itemsPerPage);
  }, [filteredProperties, currentPage]);

  const stats = useMemo(() => {
    const total = properties.length;
    const active = properties.filter(p => p.status === 'active').length;
    const suspended = properties.filter(p => p.status === 'suspended').length;
    const pending = properties.filter(p => p.status === 'pending').length;
    return { total, active, suspended, pending };
  }, [properties]);

  // Reset to first page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className={listStyles.container}>
      <div className={listStyles.pageHeader}>
        <div className={listStyles.headerLeft}>
          <h1 className={listStyles.pageTitle}>Property record</h1>
          <div className={listStyles.searchBar}>
              <Search size={18} color="var(--text-light)" />
              <input 
                  type="text" 
                  placeholder="search menu" 
                  className={listStyles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
        </div>
        <button
            className={listStyles.viewBtn}
            style={{ padding: '8px 24px', display: 'flex', alignItems: 'center' }}
            onClick={() => setIsModalOpen(true)}
        >
            <Plus size={18} style={{ marginRight: "8px" }} />
            Add Property
        </button>
      </div>

      <div className={listStyles.statsGrid}>
          <div className={listStyles.statCardSolid}>
              <span className={listStyles.statLabel}>Total properties</span>
              <span className={listStyles.statValue}>{stats.total}</span>
          </div>
          <div className={listStyles.statCardLight}>
              <span className={listStyles.statLabel}>Active properties</span>
              <span className={listStyles.statValue}>{stats.active}</span>
          </div>
          <div className={listStyles.statCardLight}>
              <span className={listStyles.statLabel}>Suspended properties</span>
              <span className={listStyles.statValue}>{stats.suspended}</span>
          </div>
          <div className={listStyles.statCardSolid}>
              <span className={listStyles.statLabel}>Pending approvals</span>
              <span className={listStyles.statValue}>{stats.pending}</span>
          </div>
      </div>

      <div className={listStyles.tableContainer}>
        <table className={listStyles.customTable}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Location</th>
              <th>Host</th>
              <th>Price/Night</th>
              <th>Status</th>
              <th>Date Listed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProperties.map((property) => (
              <tr key={property.id}>
                <td>
                  <div
                    style={{
                      width: 60,
                      height: 40,
                      background: "var(--bg-color)",
                      borderRadius: "4px",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={getImageUrl(property.images[0])}
                        alt={property.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <ImageIcon size={16} color="var(--dark-gray)" />
                    )}
                  </div>
                </td>
                <td>{property.title}</td>
                <td>{property.location}</td>
                <td>{property.host}</td>
                <td>₦{property.price}</td>
                <td>
                  <span
                    className={classNames(
                      listStyles.statusBadge,
                      listStyles[property.status === 'pending' ? 'suspended' : property.status],
                    )}
                  >
                    {property.status}
                  </span>
                </td>
                <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{formatDate(property.createdAt)}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                            {formatTime(property.createdAt)}
                        </span>
                    </div>
                </td>
                <td style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '100%', minHeight: '80px' }}>
                  <button
                    className={listStyles.viewBtn}
                    title="View Details"
                    onClick={() => navigate(`/properties/${property.id}`)}
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
          totalItems={filteredProperties.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={resetForm}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2>{step === 1 ? "Add New Property" : "Upload Media"}</h2>
                <p style={{ margin: "4px 0 0 0", color: "var(--text-light)", fontSize: "0.9rem" }}>
                  Step {step} of 2: {step === 1 ? "Property Details" : "Images & Videos"}
                </p>
              </div>
              <button className={styles.closeBtn} onClick={resetForm}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {step === 1 ? (
                <div className={styles.formGrid}>
                  <div className={classNames(styles.formGroup, styles.fullWidth)}>
                    <label>Property Title</label>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Luxury Apartment in Lekki"
                    />
                  </div>
                  <div className={classNames(styles.formGroup, styles.fullWidth)}>
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      placeholder="Describe the property, its features, and why guests should stay here..."
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Location (City, State)</label>
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Lagos, Nigeria"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Price per Night (₦)</label>
                    <input
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      placeholder="50000"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Owner/Host</label>
                    <select
                      name="ownerId"
                      value={formData.ownerId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a host</option>
                      {hosts.map((host) => (
                        <option key={host.id} value={host.id}>
                          {host.name} ({host.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                    </select>
                  </div>
                  <div className={classNames(styles.formGroup, styles.fullWidth)}>
                    <label>Amenities (Comma separated)</label>
                    <input
                      name="amenities"
                      value={formData.amenities}
                      onChange={handleInputChange}
                      placeholder="Wifi, Pool, Gym, Kitchen..."
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.mediaSection}>
                  <p style={{ marginBottom: "16px", color: "var(--text-light)" }}>
                    Add high-quality photos and at least one video to attract more guests.
                  </p>
                  <div className={styles.mediaGrid}>
                    {media.map((item, index) => (
                      <div key={index} className={styles.mediaItem}>
                        {item.type === "image" ? (
                          <img src={getImageUrl(item.url)} alt="Uploaded" />
                        ) : (
                          <video src={item.url} />
                        )}
                        <button
                          type="button"
                          className={styles.removeMedia}
                          onClick={() => removeMedia(index)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <div
                      className={styles.uploadPlaceholder}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={24} />
                      <span style={{ fontSize: "0.8rem", marginTop: "8px" }}>
                        Upload
                      </span>
                    </div>
                  </div>
                  <input
                    type="file"
                    multiple
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,video/*"
                  />
                </div>
              )}

              <div className={styles.formActions}>
                {step === 2 && (
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() => setStep(1)}
                  >
                    <ChevronLeft size={18} style={{ marginRight: "8px" }} />
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  className={classNames(styles.btn, styles.primary)}
                  disabled={submitting}
                >
                  {step === 1 ? (
                    <>
                      Next
                      <ChevronRight size={18} style={{ marginLeft: "8px" }} />
                    </>
                  ) : submitting ? (
                    "Adding Property..."
                  ) : (
                    "Complete & Add Property"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification.isOpen && (
        <NotificationModal 
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification({ ...notification, isOpen: false })}
        />
      )}
    </div>
  );
};

export default Properties;
