import ReactDOM from "react-dom";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import pageStyles from "../styles/Pages.module.css";

export type NotificationType = "success" | "error" | "info";

interface NotificationModalProps {
  type: NotificationType;
  title: string;
  message: string;
  onClose: () => void;
}

const NotificationModal = ({ type, title, message, onClose }: NotificationModalProps) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={40} color="#10b981" />;
      case "error":
        return <AlertCircle size={40} color="#ef4444" />;
      case "info":
        return <Info size={40} color="var(--primary-color)" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case "success":
        return "rgba(16, 185, 129, 0.1)";
      case "error":
        return "rgba(239, 68, 68, 0.1)";
      case "info":
        return "rgba(47, 149, 220, 0.1)";
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "success":
        return "rgba(16, 185, 129, 0.2)";
      case "error":
        return "rgba(239, 68, 68, 0.2)";
      case "info":
        return "rgba(47, 149, 220, 0.2)";
    }
  };

  return ReactDOM.createPortal(
    <div className={pageStyles.modalOverlay} onClick={onClose} style={{ zIndex: 2000 }}>
      <div 
        className={pageStyles.modal} 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          width: "440px", 
          padding: "32px", 
          textAlign: "center", 
          borderRadius: "24px", 
          background: "var(--card-bg)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          position: "relative"
        }}
      >
        <button 
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-light)",
            padding: "8px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--bg-color)"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <X size={20} />
        </button>

        <div 
          style={{ 
            width: "80px", 
            height: "80px", 
            backgroundColor: getIconBg(), 
            borderRadius: "50%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            margin: "8px auto 24px auto",
            border: `1px solid ${getBorderColor()}`
          }}
        >
          {getIcon()}
        </div>
        
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--text-main)", marginBottom: "16px" }}>
          {title}
        </h2>
        
        <p style={{ color: "var(--text-light)", marginBottom: "32px", lineHeight: "1.6", fontSize: "1rem" }}>
          {message}
        </p>
        
        <button 
          type="button" 
          onClick={onClose}
          style={{
            width: "100%",
            padding: "14px 24px",
            background: "var(--primary-color)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
            fontSize: "0.95rem"
          }}
        >
          OK
        </button>
      </div>
    </div>,
    document.body
  );
};

export default NotificationModal;
