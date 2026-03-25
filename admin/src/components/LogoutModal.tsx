import ReactDOM from "react-dom";
import { LogOut } from "lucide-react";
import pageStyles from "../styles/Pages.module.css";

interface LogoutModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const LogoutModal = ({ onConfirm, onCancel }: LogoutModalProps) => {
  return ReactDOM.createPortal(
    <div className={pageStyles.modalOverlay} onClick={onCancel} style={{ zIndex: 2000 }}>
      <div 
        className={pageStyles.modal} 
        onClick={(e) => e.stopPropagation()}
        style={{ width: "400px", padding: "32px", textAlign: "center", borderRadius: "20px", background: "var(--card-bg)" }}
      >
        <div 
          style={{ 
            width: "64px", 
            height: "64px", 
            backgroundColor: "var(--bg-color)", 
            borderRadius: "50%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            margin: "0 auto 20px auto",
            border: "1px solid var(--border-color)"
          }}
        >
          <LogOut size={32} color="var(--error-color)" />
        </div>
        
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--text-main)", marginBottom: "12px" }}>
          Log Out
        </h2>
        
        <p style={{ color: "var(--text-light)", marginBottom: "32px", lineHeight: "1.5" }}>
          Are you sure you want to log out of the admin dashboard? You will need to sign back in to access your account.
        </p>
        
        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <button 
            type="button" 
            onClick={onCancel}
            style={{
              padding: "12px 24px",
              background: "var(--bg-color)",
              color: "var(--text-main)",
              border: "none",
              borderRadius: "10px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background 0.2s",
              flex: 1
            }}
          >
            Cancel
          </button>
          
          <button 
            type="button" 
            onClick={onConfirm}
            style={{
              padding: "12px 24px",
              background: "var(--error-color)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background 0.2s",
              flex: 1
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LogoutModal;
