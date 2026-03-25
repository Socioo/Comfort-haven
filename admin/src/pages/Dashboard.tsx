import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Users, 
    Home, 
    TrendingUp, 
    Clock, 
    UserCheck, 
    PlusCircle
} from "lucide-react";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import api from "../services/api";
import classNames from "classnames";
import styles from "../styles/Dashboard.module.css";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import UserModal from "../components/UserModal";

const Dashboard = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState('7d');
    const [revenueStart, setRevenueStart] = useState('');
    const [revenueEnd, setRevenueEnd] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, [period, revenueStart, revenueEnd]);

    const fetchStats = async () => {
        try {
            let url = `/stats?period=${period}`;
            if (revenueStart) url += `&revenueStart=${revenueStart}`;
            if (revenueEnd) url += `&revenueEnd=${revenueEnd}`;
            
            const response = await api.get(url);
            setStats(response.data);
            setError(null);
        } catch (error) {
            console.error("Failed to fetch stats", error);
            setError("Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loader">Loading Dashboard...</div>
        </div>
    );

    if (error) return <div style={{ color: "var(--error-color)", padding: 40, textAlign: 'center', fontWeight: '500' }}>{error}</div>;

    const summaryCards = [
        { label: "Total Guests", value: stats.summary.totalGuests, icon: Users, color: "var(--primary-color)", bg: "rgba(47, 149, 220, 0.15)" },
        { label: "Total Hosts", value: stats.summary.totalHosts, icon: UserCheck, color: "var(--success-color)", bg: "rgba(76, 175, 80, 0.15)" },
        { label: "Active Properties", value: stats.summary.activeProperties, icon: Home, color: "var(--warning-color)", bg: "rgba(255, 160, 0, 0.15)" },
        { label: "Active Guests", value: stats.summary.activeGuests, icon: TrendingUp, color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)" },
        { label: "Active Hosts", value: stats.summary.activeHosts, icon: UserCheck, color: "#BF5AF2", bg: "rgba(191, 90, 242, 0.15)" },
    ];

    const handleAcceptUser = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.patch(`/users/${id}/verify`);
            fetchStats(); // Refresh dashboard
        } catch (err: any) {
            console.error("Failed to verify host", err);
            const msg = err.response?.data?.message || err.message || "Unknown error";
            alert(`Failed to verify host: ${msg}`);
        }
    };

    const handleAcceptProperty = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.patch(`/properties/${id}`, { status: "active" });
            fetchStats(); // Refresh dashboard
        } catch (err) {
            console.error("Failed to accept property", err);
            alert("Failed to accept property.");
        }
    };

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <h1>Welcome, {user?.name ? user.name.split(' ')[0] : 'Admin'} 👋</h1>
                <p>Here's what's happening at Comfort Haven today.</p>
            </header>

            <div className={styles.statsGrid}>
                {summaryCards.map((card, i) => (
                    <div key={i} className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <div className={styles.statIcon} style={{ background: card.bg, color: card.color }}>
                                <card.icon size={20} />
                            </div>
                        </div>
                        <div className={styles.statValue}>{card.value}</div>
                        <div className={styles.statLabel}>{card.label}</div>
                    </div>
                ))}
            </div>

            <div className={styles.mainGrid}>
                <div className={styles.content}>
                    <div className={styles.revenueCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                            <div>
                                <div className={styles.revenueLabel}>Total Revenue (NGN)</div>
                                <div className={styles.revenueValue}>₦{stats.summary.totalRevenue.toLocaleString()}</div>
                            </div>
                            <div className={styles.revenueFilters}>
                                <div className={styles.dateField}>
                                    <label>From</label>
                                    <input 
                                        type="date" 
                                        value={revenueStart} 
                                        onChange={(e) => setRevenueStart(e.target.value)}
                                        className={styles.dateInput}
                                    />
                                </div>
                                <div className={styles.dateField}>
                                    <label>To</label>
                                    <input 
                                        type="date" 
                                        value={revenueEnd} 
                                        onChange={(e) => setRevenueEnd(e.target.value)}
                                        className={styles.dateInput}
                                    />
                                </div>
                            </div>
                        </div>
                        <div style={{ height: 200, marginTop: 20 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.activityData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={theme === 'dark' ? 'var(--primary-color)' : '#ffffff'} stopOpacity={theme === 'dark' ? 0.3 : 0.4}/>
                                            <stop offset="95%" stopColor={theme === 'dark' ? 'var(--primary-color)' : '#ffffff'} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="properties" stroke="#ffffff" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={styles.chartContainer}>
                        <div className={styles.chartHeader}>
                            <div className={styles.chartTitle}>New Visitors</div>
                            <select 
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className={styles.themeSelect}
                                style={{ 
                                    padding: '8px 12px', 
                                    borderRadius: 8, 
                                    border: '1px solid var(--border-color)', 
                                    outline: 'none', 
                                    backgroundColor: 'var(--bg-color)', 
                                    color: 'var(--text-main)', 
                                    fontWeight: 500, 
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                                <option value="3m">Last 3 Months</option>
                                <option value="6m">Last 6 Months</option>
                                <option value="9m">Last 9 Months</option>
                                <option value="1y">Last Year</option>
                            </select>
                        </div>
                        <div style={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--text-light)" }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--text-light)" }} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            borderRadius: 12, 
                                            border: 'none', 
                                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                                            backgroundColor: 'var(--card-bg)',
                                            color: 'var(--text-main)'
                                        }}
                                        itemStyle={{ color: 'var(--text-main)' }}
                                        cursor={{ fill: 'var(--bg-color)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                                    <Bar dataKey="guests" name="New Guests" fill="#3B82F6" radius={[4, 4, 4, 4]} barSize={12} />
                                    <Bar dataKey="hosts" name="New Hosts" fill="#10B981" radius={[4, 4, 4, 4]} barSize={12} />
                                    <Bar dataKey="properties" name="New Properties" fill="#F59E0B" radius={[4, 4, 4, 4]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <aside className={styles.sidebar}>
                    {(user?.role === 'super-admin' || user?.role === 'manager') && (
                        <>
                            <div className={styles.activityCard}>
                                <div className={styles.sectionTitle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Clock size={20} />
                                        Activities
                                    </div>
                                    <span style={{ fontSize: '1.25rem', color: 'var(--text-light)' }}>•••</span>
                                </div>
                                <div className={styles.activityList}>
                                    {stats.recentHosts && stats.recentHosts.length > 0 ? (
                                        stats.recentHosts.slice(0, 3).map((activity: any) => (
                                            <div key={activity.id} className={styles.hostCardContainer}>
                                                <div className={styles.hostAvatar} style={{ backgroundColor: 'var(--success-color)' }}>
                                                    {activity.name.charAt(0)}
                                                </div>
                                                <div className={styles.hostCardInfo}>
                                                    <div className={styles.hostCardName}>{activity.name}</div>
                                                    <div className={styles.hostCardMeta}>
                                                        <span style={{ textTransform: 'capitalize' }}>Role: {activity.role}</span>
                                                        <span style={{ color: 'var(--text-light)' }}>•</span>
                                                        <span>{activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : 'Just now'}</span>
                                                    </div>
                                                    <div className={styles.hostCardActions}>
                                                        <button 
                                                            className={styles.btnLight}
                                                            onClick={() => setSelectedUserId(activity.id)}
                                                        >
                                                            View
                                                        </button>
                                                        <button 
                                                            className={styles.btnPrimary}
                                                            style={{ 
                                                                padding: '6px 16px',
                                                                background: 'var(--primary-color)',
                                                                color: 'white',
                                                                borderRadius: '10px',
                                                                border: 'none',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                fontSize: '0.8rem',
                                                                flex: 1
                                                            }}
                                                            onClick={(e) => handleAcceptUser(activity.id, e)}
                                                        >
                                                            Verify
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>
                                            no new host
                                        </div>
                                    )}
                                </div>
                                <a href="/hosts" className={styles.viewAllLink}>View all</a>
                            </div>

                            <div className={styles.activityCard}>
                                <div className={styles.sectionTitle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <PlusCircle size={20} />
                                        Property submission
                                    </div>
                                    <span style={{ fontSize: '1.25rem', color: 'var(--text-light)' }}>•••</span>
                                </div>
                                <div className={styles.activityList}>
                                    {stats.recentProperties && stats.recentProperties.length > 0 ? (
                                        stats.recentProperties.slice(0, 3).map((prop: any) => (
                                            <div key={prop.id} className={styles.propCardContainer}>
                                                <div 
                                                    className={styles.propCardTop}
                                                    onClick={() => navigate(`/properties/${prop.id}`)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className={styles.propAvatar}>
                                                        <Home size={32} />
                                                    </div>
                                                    <div className={styles.propCardInfo}>
                                                        <div className={styles.propCardTitle}>Property host</div>
                                                        <div className={styles.propCardSubtitle}>{prop.title}</div>
                                                        <div className={styles.propCardTime}>
                                                            {prop.createdAt ? new Date(prop.createdAt).toLocaleDateString() : 'Just now'}
                                                        </div>
                                                        <span className={classNames(styles.tag, styles[prop.status] || styles.pending)}>
                                                            {prop.status || 'pending'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <hr className={styles.cardDivider} />
                                                <div className={styles.propCardActions}>
                                                    <button 
                                                        className={styles.btnLightFull}
                                                        onClick={(e) => { e.stopPropagation(); handleAcceptProperty(prop.id, e) }}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        className={styles.btnDangerFull}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            alert("Property rejection will be processed.");
                                                        }}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>
                                            no new property
                                        </div>
                                    )}
                                </div>
                                <a href="/properties" className={styles.viewAllLink}>View all</a>
                            </div>
                        </>
                    )}
                </aside>
            </div>
            {selectedUserId && (
                <UserModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
            )}
        </div>
    );
};

export default Dashboard;
