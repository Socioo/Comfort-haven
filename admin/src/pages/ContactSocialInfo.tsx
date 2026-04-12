import { useState, useEffect } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Instagram,
  Music2,
  ChevronRight,
  X,
} from "lucide-react";
import listStyles from "../styles/Guests.module.css";
import styles from "./ContactSocialInfo.module.css";
import api from "../services/api";

interface InfoField {
  id: string;
  label: string;
  value: string;
  icon: any;
  type: "contact" | "social";
}

const ContactSocialInfo = () => {
  const [fields, setFields] = useState<InfoField[]>([
    {
      id: "whatsapp",
      label: "WhatsApp",
      value: "44 028278212",
      icon: Phone,
      type: "contact",
    },
    {
      id: "email",
      label: "Email address",
      value: "crystalclaire@gmail.com",
      icon: Mail,
      type: "contact",
    },
    {
      id: "address",
      label: "Address",
      value: "Non",
      icon: MapPin,
      type: "contact",
    },
    {
      id: "instagram",
      label: "Instagram",
      value: "@aprosphere",
      icon: Instagram,
      type: "social",
    },
    {
      id: "tiktok",
      label: "Tiktok",
      value: "@aprosphere",
      icon: Music2,
      type: "social",
    },
    { id: "x", label: "X", value: "@aprosphere", icon: X, type: "social" },
  ]);

  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<InfoField | null>(null);
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get("/settings");
        const settings = response.data;

        if (settings && settings.length > 0) {
          setFields((prevFields) =>
            prevFields.map((field) => {
              const setting = settings.find((s: any) => s.key === field.id);
              return setting ? { ...field, value: setting.value } : field;
            }),
          );
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleEdit = (field: InfoField) => {
    setEditingField(field);
    setNewValue(field.value);
  };

  const handleSave = async () => {
    if (editingField) {
      try {
        await api.patch(`/settings/${editingField.id}`, { value: newValue });
        setFields(
          fields.map((f) =>
            f.id === editingField.id ? { ...f, value: newValue } : f,
          ),
        );
        setEditingField(null);
      } catch (error) {
        console.error("Failed to save setting", error);
        alert("Failed to save setting. Please try again.");
      }
    }
  };

  const contactFields = fields.filter((f) => f.type === "contact");
  const socialFields = fields.filter((f) => f.type === "social");

  if (loading)
    return (
      <div
        className={listStyles.container}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <div className="loader">Loading information...</div>
      </div>
    );

  return (
    <div className={listStyles.container}>
      <div className={styles.container}>
        <div className={listStyles.pageHeader}>
          <div className={listStyles.headerLeft}>
            <h1
              className={listStyles.pageTitle}
              style={{ color: "var(--text-main)" }}
            >
              Contact & Social Info
            </h1>
          </div>
        </div>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Contact Info</h2>
          <div className={styles.grid}>
            {contactFields.map((field) => (
              <div
                key={field.id}
                className={styles.card}
                onClick={() => handleEdit(field)}
              >
                <div className={styles.iconWrapper}>
                  <field.icon size={24} className={styles.icon} />
                </div>
                <p className={styles.label}>{field.label}</p>
                <p className={styles.value}>{field.value}</p>
                <button className={styles.editButton}>
                  Edit <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Social Info</h2>
          <div className={styles.grid}>
            {socialFields.map((field) => (
              <div
                key={field.id}
                className={styles.card}
                onClick={() => handleEdit(field)}
              >
                <div className={styles.iconWrapper}>
                  <field.icon size={24} className={styles.icon} />
                </div>
                <p className={styles.label}>{field.label}</p>
                <p className={styles.value}>{field.value}</p>
                <button className={styles.editButton}>
                  Edit <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {editingField && (
        <div
          className={styles.modalOverlay}
          onClick={() => setEditingField(null)}
        >
          <div
            className={styles.modalWrapper}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalDetailCard}>
              <button
                className={styles.closeButton}
                onClick={() => setEditingField(null)}
              >
                <X size={20} />
              </button>
              <div className={styles.modalHeader}>
                <div className={styles.modalIconWrapper}>
                  <editingField.icon size={30} />
                </div>
                <h3 className={styles.modalTitle}>
                  Update {editingField.label}
                </h3>
                <p
                  style={{
                    color: "var(--text-light)",
                    marginTop: "8px",
                    fontSize: "0.95rem",
                  }}
                >
                  Enter the new information for your{" "}
                  {editingField.label.toLowerCase()}.
                </p>
              </div>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  className={styles.input}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={`Enter ${editingField.label.toLowerCase()}...`}
                  autoFocus
                />
              </div>
            </div>

            <div className={styles.modalActionCard}>
              <button className={styles.saveButton} onClick={handleSave}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactSocialInfo;
