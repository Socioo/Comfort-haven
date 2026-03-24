import { useState, useEffect, useRef } from "react";
import { ChevronLeft, Send, Phone, Video, Info, Paperclip, Check, X } from "lucide-react";
import api from "../services/api";
import styles from "./Support.module.css";
import pageStyles from "../styles/Pages.module.css";
import UserModal from "./UserModal";
import NotificationModal from "./NotificationModal";
import type { NotificationType } from "./NotificationModal";

interface SupportIssue {
  id: string;
  date: string;
  status: "Open" | "In progress" | "Successful" | "Pending";
  refundId: string;
  issuerName: string;
  role: string;
  summary: string;
}

interface SupportModalProps {
  issue: SupportIssue;
  onClose: () => void;
  onUpdate?: () => void;
}

const SupportModal = ({ issue, onClose, onUpdate }: SupportModalProps) => {
  const [view, setView] = useState<"detail" | "messages">("detail");
  const [updating, setUpdating] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ isOpen: boolean; type: NotificationType; title: string; message: string }>({
    isOpen: false,
    type: "info",
    title: "",
    message: ""
  });

  useEffect(() => {
    if (view === "messages") {
      fetchMessages(issue.id);
    }
  }, [view, issue.id]);

  const fetchMessages = async (issueId: string) => {
    try {
      const response = await api.get(`/support-messages/${issueId}`);
      setMessages(response.data);
    } catch (err) {
      console.error("Failed to fetch messages", err);
      setMessages([
        { id: "1", sender: "user", content: "I would like to request a refund for my recent property booking as the sink in the kitchen is completely blocked.", timestamp: "9:00 PM" },
        { id: "2", sender: "admin", content: "I'm sorry to hear that. I'll check your booking details immediately.", timestamp: "9:02 PM" },
        { id: "3", sender: "user", content: "Thank you. Let me know if you need any photos.", timestamp: "9:05 PM" }
      ]);
    }
  };

  const handleCall = () => setNotification({
    isOpen: true,
    type: "info",
    title: "Voice Call",
    message: `Initiating voice call with ${issue.issuerName}...`
  });
  const handleVideoCall = () => setNotification({
    isOpen: true,
    type: "info",
    title: "Video Call",
    message: `Initiating video call with ${issue.issuerName}...`
  });
  const handleInfo = () => {
    if (issue.role.toLowerCase() === "guest" || issue.role.toLowerCase() === "host") {
      setSelectedUserId(issue.id);
    }
  };

  const handleFileClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNotification({
        isOpen: true,
        type: "success",
        title: "File Attached",
        message: `File attached: ${file.name}`
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    try {
      const formData = new FormData();
      if (newMessage.trim()) formData.append("content", newMessage);
      if (selectedFile) formData.append("file", selectedFile);
      const response = await api.post(`/support-messages/${issue.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMessages([...messages, response.data]);
      setNewMessage("");
      setSelectedFile(null);
    } catch (err) {
      const msg = { 
        id: Date.now().toString(), 
        sender: "admin", 
        content: newMessage || (selectedFile ? `📎 Attached: ${selectedFile.name}` : ""), 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages([...messages, msg]);
      setNewMessage("");
      setNewMessage("");
      setSelectedFile(null);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    setUpdating(true);
    try {
      await api.patch(`/support/${issue.id}/status`, { status });
      onUpdate?.();
      onClose();
    } catch (err) {
      console.error("Failed to update support status", err);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Update Failed",
        message: "Failed to update status. Please try again."
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRefundAction = async (status: string) => {
    setUpdating(true);
    try {
      const ticketStatus = status === 'successful' ? 'Successful' : 'Pending';
      await api.patch(`/support/${issue.id}/status`, { status: ticketStatus });
      
      if (issue.refundId && !issue.refundId.startsWith('#')) {
        await api.patch(`/finance/refunds/${issue.refundId}`, { status });
      }
      
      onUpdate?.();
      onClose();
    } catch (err) {
      console.error("Failed to process refund action", err);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Action Failed",
        message: "Failed to process action. Please try again."
      });
    } finally {
      setUpdating(false);
    }
  };

  const renderDetail = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className={styles.detailCard} style={{ margin: 0 }}>
        <h2 className={styles.detailSectionTitle}>Support</h2>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Ticket ID:</span>
          <span className={styles.detailValue}>{issue.refundId}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Submitted date:</span>
          <span className={styles.detailValue}>{issue.date}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Issue category:</span>
          <span className={styles.detailValue}>{issue.summary}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Refund amount requested:</span>
          <span className={styles.detailValue} style={{ color: 'var(--primary-color)' }}>₦50,000.00</span>
        </div>
      </div>

      <div className={styles.detailCard} style={{ margin: 0 }}>
        <h2 className={styles.detailSectionTitle}>User information</h2>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>User name:</span>
          <span className={styles.detailValue}>{issue.issuerName}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Phone number:</span>
          <span className={styles.detailValue}>+234 80377373</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Email:</span>
          <span className={styles.detailValue}>adamlukot@gmail.com</span>
        </div>
      </div>

      <div className={styles.actionCard} style={{ margin: 0 }}>
        <div className={styles.bottomSection} style={{ marginBottom: '24px' }}>
          <div className={styles.messageBtnContainer}>
            <span className={styles.badge}>4</span>
            <button className={styles.viewMessagesBtn} onClick={() => setView("messages")}>
              <Send size={20} /> View user messages
            </button>
          </div>
          <div className={styles.chatPreviewContainer}>
            <div className={styles.chatAvatar}>{issue.issuerName.substring(0, 2).toUpperCase()}</div>
            <div className={styles.chatSnippet}>
              <p>I would like to request a refund for my recent property booking as the sink in the kitchen is completely blocked.</p>
              <span className={styles.chatSnippetTime}>9:00 PM</span>
            </div>
          </div>
        </div>

        {(issue.summary.toLowerCase().includes('refund') || issue.summary.toLowerCase().includes('payout')) && issue.status !== 'Successful' && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: updating ? 'not-allowed' : 'pointer', flex: 1, transition: 'background 0.2s', opacity: updating ? 0.7 : 1 }}
              onClick={() => handleRefundAction('successful')}
              disabled={updating}
            >
              {updating ? "Processing..." : "Approve Refund"}
            </button>
            <button 
              style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: updating ? 'not-allowed' : 'pointer', flex: 1, transition: 'background 0.2s', opacity: updating ? 0.7 : 1 }}
              onClick={() => handleRefundAction('rejected')}
              disabled={updating}
            >
              {updating ? "Processing..." : "Deny Refund"}
            </button>
          </div>
        )}

        {issue.status !== 'Successful' && !issue.summary.toLowerCase().includes('refund') && !issue.summary.toLowerCase().includes('payout') && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: updating ? 'not-allowed' : 'pointer', flex: 1, transition: 'background 0.2s', opacity: updating ? 0.7 : 1 }}
              onClick={() => handleStatusUpdate('Successful')}
              disabled={updating}
            >
              {updating ? "Processing..." : "Mark as Resolved"}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className={styles.chatContainer} style={{ height: '500px', margin: 0, border: 'none' }}>
      <header className={styles.chatHeader} style={{ background: 'var(--bg-color)', padding: '16px 20px', borderRadius: '12px 12px 0 0' }}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => setView("detail")}>
            <ChevronLeft size={20} />
          </button>
          <div className={styles.chatInfo}>
            <div className={styles.chatAvatar}>{issue.issuerName.substring(0, 2).toUpperCase()}</div>
            <div className={styles.chatUserMeta}>
              <h3 className={styles.chatUserName}>{issue.issuerName}</h3>
              <p className={styles.chatTicketId}>{issue.refundId}</p>
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={handleCall}><Phone size={20} /></button>
          <button className={styles.iconBtn} onClick={handleVideoCall}><Video size={20} /></button>
          <button className={styles.iconBtn} onClick={handleInfo}><Info size={20} /></button>
        </div>
      </header>

      <div className={styles.messageList} style={{ padding: '20px' }}>
        {messages.map((msg) => (
          <div key={msg.id} className={msg.sender === "user" ? styles.messageWrapper : styles.messageWrapperSent}>
            {msg.sender === "user" && <div className={styles.receivedAvatar}>{issue.issuerName.substring(0, 2).toUpperCase()}</div>}
            <div className={`${styles.message} ${msg.sender === "user" ? styles.received : styles.sent}`}>
              <p>{msg.content}</p>
              <span className={msg.sender === "user" ? styles.messageTime : styles.messageTimeSent}>{msg.timestamp}</span>
            </div>
            {msg.sender === "admin" && <div className={styles.sentAvatar}>AD</div>}
          </div>
        ))}
      </div>

      <div className={styles.chatInputArea} style={{ padding: '16px 20px', background: 'var(--bg-color)', borderRadius: '0 0 12px 12px' }}>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
        <div className={styles.inputContainer}>
          <input 
            type="text" 
            placeholder="Type message...." 
            className={styles.chatInput} 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <div className={styles.inputActions}>
            <button className={styles.sendIconBtn} onClick={handleSendMessage} disabled={updating}><Send size={18} /></button>
            <button className={`${styles.inputIconBtn} ${selectedFile ? styles.activeAttachment : ""}`} onClick={handleFileClick} disabled={updating}>
              <Paperclip size={18} />
            </button>
            <button className={styles.inputIconBtn} onClick={() => handleStatusUpdate('Successful')} disabled={updating}><Check size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={pageStyles.modalOverlay} onClick={onClose} style={{ zIndex: 1040 }}>
      <div 
        className={pageStyles.modal} 
        style={{ 
          maxWidth: '900px', 
          width: '95%', 
          maxHeight: '92vh', 
          overflowY: 'auto', 
          padding: '0', 
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className={pageStyles.modalHeader} style={{ padding: '20px 32px', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
            {view === "detail" ? "Support Ticket Details" : "Conversation"}
          </h2>
          <button className={pageStyles.closeBtn} onClick={onClose} style={{ background: 'var(--bg-color)', color: 'var(--text-light)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: view === "messages" ? '0' : '32px' }}>
          {view === "detail" ? renderDetail() : renderMessages()}
        </div>

        {selectedUserId && <UserModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
        
        {notification.isOpen && (
          <NotificationModal 
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => setNotification({ ...notification, isOpen: false })}
          />
        )}
      </div>
    </div>
  );
};

export default SupportModal;
