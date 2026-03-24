import ReactDOM from "react-dom";
import { Trash2 } from "lucide-react";
import pageStyles from "../styles/Pages.module.css";

interface DeleteConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  confirmText?: string;
  confirmColor?: string;
}

const DeleteConfirmationModal = ({ 
  title, 
  message, 
  onConfirm, 
  onCancel,
  isDeleting = false,
  confirmText = "Delete Now",
  confirmColor = "#dc2626"
}: DeleteConfirmationModalProps) => {
  return ReactDOM.createPortal(
    <div className={pageStyles.modalOverlay} onClick={onCancel} style={{ zIndex: 2000 }}>
      <div 
        className={pageStyles.modal} 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          width: "440px", 
          padding: "32px", 
          textAlign: "center", 
          borderRadius: "24px", 
          background: "var(--card-bg)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}
      >
        <div 
          style={{ 
            width: "80px", 
            height: "80px", 
            backgroundColor: `${confirmColor}1a`, // 10% opacity
            borderRadius: "50%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            margin: "0 auto 24px auto",
            border: `1px solid ${confirmColor}33` // 20% opacity
          }}
        >
          <Trash2 size={40} color={confirmColor} />
        </div>
        
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--text-main)", marginBottom: "16px" }}>
          {title}
        </h2>
        
        <p style={{ color: "var(--text-light)", marginBottom: "32px", lineHeight: "1.6", fontSize: "1rem" }}>
          {message}
        </p>
        
        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <button 
            type="button" 
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              padding: "14px 24px",
              background: "var(--bg-color)",
              color: "var(--text-main)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              fontWeight: "600",
              cursor: isDeleting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              flex: 1,
              fontSize: "0.95rem"
            }}
          >
            Cancel
          </button>
          
          <button 
            type="button" 
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              padding: "14px 24px",
              background: confirmColor,
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontWeight: "600",
              cursor: isDeleting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              flex: 1,
              fontSize: "0.95rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            {isDeleting ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteConfirmationModal;
