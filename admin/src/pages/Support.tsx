import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronLeft, Send, Phone, Video, Info, Paperclip, Check } from "lucide-react";
import api from "../services/api";
import styles from "./Support.module.css";

type ViewState = "list" | "detail" | "messages";

interface SupportIssue {
  id: string;
  date: string;
  status: "Open" | "In progress" | "Successful" | "Pending";
  refundId: string;
  issuerName: string;
  role: string;
  summary: string;
}

const Support = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>("list");
  const [selectedIssue, setSelectedIssue] = useState<SupportIssue | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mockIssues: SupportIssue[] = [
    {
      id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653",
      date: "2026-03-01 7:30 AM",
      status: "Open",
      refundId: "#1484848",
      issuerName: "Adam Lukot",
      role: "Guest",
      summary: "Sink maintenance",
    },
    {
      id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653",
      date: "2026-03-01 8:15 AM",
      status: "In progress",
      refundId: "#1484849",
      issuerName: "Adam Lukot",
      role: "Guest",
      summary: "Refund request",
    },
    {
      id: "4d837313-d74d-4575-a0d7-0a2d54c67fae",
      date: "2026-03-01 9:00 AM",
      status: "Open",
      refundId: "#1484850",
      issuerName: "Host User",
      role: "Host",
      summary: "Payout delay",
    },
    {
      id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653",
      date: "2026-03-01 10:30 AM",
      status: "Successful",
      refundId: "#1484851",
      issuerName: "Adam Lukot",
      role: "Guest",
      summary: "Lease enquiry",
    },
    {
      id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653",
      date: "2026-03-01 11:20 AM",
      status: "Successful",
      refundId: "#1484852",
      issuerName: "Adam Lukot",
      role: "Guest",
      summary: "Security concern",
    },
    {
      id: "4d837313-d74d-4575-a0d7-0a2d54c67fae",
      date: "2026-03-01 12:45 PM",
      status: "Pending",
      refundId: "#1484853",
      issuerName: "Host User",
      role: "Host",
      summary: "Property listing error",
    },
    {
      id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653",
      date: "2026-03-02 8:00 AM",
      status: "Open",
      refundId: "#1484854",
      issuerName: "Adam Lukot",
      role: "Guest",
      summary: "Wifi not working",
    },
    {
      id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653",
      date: "2026-03-02 9:10 AM",
      status: "In progress",
      refundId: "#1484855",
      issuerName: "Adam Lukot",
      role: "Guest",
      summary: "Late check-in issue",
    },
    {
      id: "4d837313-d74d-4575-a0d7-0a2d54c67fae",
      date: "2026-03-02 10:00 AM",
      status: "Successful",
      refundId: "#1484856",
      issuerName: "Host User",
      role: "Host",
      summary: "Booking collision",
    },
    {
      id: "cfa52bc8-38d1-4b1c-b585-5f4d62af1653",
      date: "2026-03-02 11:30 AM",
      status: "Pending",
      refundId: "#1484857",
      issuerName: "Adam Lukot",
      role: "Guest",
      summary: "Broken appliance",
    },
  ];

  useEffect(() => {
    if (view === "messages" && selectedIssue) {
      fetchMessages(selectedIssue.id);
    }
  }, [view, selectedIssue]);

  const fetchMessages = async (issueId: string) => {
    try {
      const response = await api.get(`/support-messages/${issueId}`);
      setMessages(response.data);
    } catch (err) {
      console.error("Failed to fetch messages", err);
      // Fallback for demo if needed
      setMessages([
        { id: "1", sender: "user", content: "I would like to request a refund for my recent property booking as the sink in the kitchen is completely blocked.", timestamp: "9:00 PM" },
        { id: "2", sender: "admin", content: "I'm sorry to hear that. I'll check your booking details immediately.", timestamp: "9:02 PM" },
        { id: "3", sender: "user", content: "Thank you. Let me know if you need any photos.", timestamp: "9:05 PM" }
      ]);
    }
  };

  const handleCall = () => {
    alert(`Initiating voice call with ${selectedIssue?.issuerName}...`);
  };

  const handleVideoCall = () => {
    alert(`Initiating video call with ${selectedIssue?.issuerName}...`);
  };

  const handleInfo = () => {
    if (!selectedIssue) return;
    
    switch (selectedIssue.role.toLowerCase()) {
      case "guest":
        navigate(`/guests/${selectedIssue.id}`);
        break;
      case "host":
        navigate(`/hosts/${selectedIssue.id}`);
        break;
      default:
        navigate(`/team`);
        break;
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      alert(`File attached: ${file.name}`);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    try {
      const formData = new FormData();
      if (newMessage.trim()) formData.append("content", newMessage);
      if (selectedFile) formData.append("file", selectedFile);

      const response = await api.post(`/support-messages/${selectedIssue?.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setMessages([...messages, response.data]);
      setNewMessage("");
      setSelectedFile(null);
    } catch (err) {
      console.error("Failed to send message", err);
      // Mock update for UI verification
      const msg = { 
        id: Date.now().toString(), 
        sender: "admin", 
        content: newMessage || (selectedFile ? `📎 Attached: ${selectedFile.name}` : ""), 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages([...messages, msg]);
      setNewMessage("");
      setSelectedFile(null);
    }
  };

  const handleViewIssue = (issue: SupportIssue) => {
    setSelectedIssue(issue);
    setView("detail");
  };

  const handleViewMessage = () => {
    setView("messages");
  };

  const renderList = () => (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <h1 className={styles.pageTitle}>Support record</h1>
          <div className={styles.searchBar}>
            <Search size={18} color="var(--text-light)" />
            <input type="text" placeholder="Search records" className={styles.searchInput} />
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date issued</th>
              <th>Status</th>
              <th>Refund ID</th>
              <th>Issuer name</th>
              <th>Role</th>
              <th>Issue summary</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mockIssues.map((issue) => (
              <tr key={issue.id}>
                <td>{issue.date}</td>
                <td>
                  <span className={`${styles.status} ${styles[issue.status.toLowerCase().replace(" ", "")]}`}>
                    {issue.status}
                  </span>
                </td>
                <td>{issue.refundId}</td>
                <td>{issue.issuerName}</td>
                <td>{issue.role}</td>
                <td>{issue.summary}</td>
                <td>
                  <button 
                    className={styles.viewBtn}
                    onClick={() => handleViewIssue(issue)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDetail = () => (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => setView("list")}>
            <ChevronLeft size={20} />
          </button>
        </div>
      </header>

      <div className={styles.detailCard}>
        <h2 className={styles.detailSectionTitle}>Support</h2>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Ticket ID:</span>
          <span className={styles.detailValue}>{selectedIssue?.refundId}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Submitted date:</span>
          <span className={styles.detailValue}>{selectedIssue?.date}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Issue category:</span>
          <span className={styles.detailValue}>{selectedIssue?.summary}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Refund amount requested:</span>
          <span className={styles.detailValue} style={{ color: 'var(--primary-color)' }}>₦50,000.00</span>
        </div>
      </div>

      <div className={styles.detailCard}>
        <h2 className={styles.detailSectionTitle}>User information</h2>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>User name:</span>
          <span className={styles.detailValue}>{selectedIssue?.issuerName}</span>
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

      <div className={styles.actionCard}>
        <div className={styles.bottomSection}>
          <div className={styles.messageBtnContainer}>
            <span className={styles.badge}>4</span>
            <button className={styles.viewMessagesBtn} onClick={handleViewMessage}>
              <Send size={20} /> View user messages
            </button>
          </div>
          <div className={styles.chatPreviewContainer}>
            <div className={styles.chatAvatar}>AL</div>
            <div className={styles.chatSnippet}>
              <p>I would like to request a refund for my recent property booking as the sink in the kitchen is completely blocked.</p>
              <span className={styles.chatSnippetTime}>9:00 PM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  const renderMessages = () => (
    <div className={styles.chatContainer}>
      <header className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => setView("detail")}>
            <ChevronLeft size={20} />
          </button>
          <div className={styles.chatInfo}>
            <div className={styles.chatAvatar}>AL</div>
            <div className={styles.chatUserMeta}>
              <h3 className={styles.chatUserName}>{selectedIssue?.issuerName}</h3>
              <p className={styles.chatTicketId}>{selectedIssue?.refundId}</p>
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={handleCall}><Phone size={20} /></button>
          <button className={styles.iconBtn} onClick={handleVideoCall}><Video size={20} /></button>
          <button className={styles.iconBtn} onClick={handleInfo}><Info size={20} /></button>
        </div>
      </header>

      <div className={styles.messageList}>
        {messages.map((msg) => (
          <div key={msg.id} className={msg.sender === "user" ? styles.messageWrapper : styles.messageWrapperSent}>
            {msg.sender === "user" && <div className={styles.receivedAvatar}>OP</div>}
            <div className={`${styles.message} ${msg.sender === "user" ? styles.received : styles.sent}`}>
              <p>{msg.content}</p>
              <span className={msg.sender === "user" ? styles.messageTime : styles.messageTimeSent}>{msg.timestamp}</span>
            </div>
            {msg.sender === "admin" && <div className={styles.sentAvatar}>AD</div>}
          </div>
        ))}
      </div>

      <div className={styles.chatInputArea}>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
        />
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
            <button className={styles.sendIconBtn} onClick={handleSendMessage}><Send size={18} /></button>
            <button 
              className={`${styles.inputIconBtn} ${selectedFile ? styles.activeAttachment : ""}`} 
              onClick={handleFileClick}
            >
              <Paperclip size={18} />
            </button>
            <button className={styles.inputIconBtn}><Check size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );

  switch (view) {
    case "detail": return renderDetail();
    case "messages": return renderMessages();
    default: return renderList();
  }
};

export default Support;
