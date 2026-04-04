import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Alert,
} from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth";
import Colors from "@/constants/Colors";
import { useTheme } from "@/contexts/theme";
import { Text, View } from "@/components/Themed";
import {
  ChevronLeft,
  Bell,
  Settings,
  CircleCheck,
  Clock,
  Trash2,
  CheckCheck,
} from "lucide-react-native";
import { notificationsAPI, authAPI } from "@/services/api";
import { useNotifications } from "@/contexts/notifications";

export default function NotificationsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, updateUser, isLoading: authLoading } = useAuth();
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const styles = createStyles(themeColors);
  const { refreshUnreadCount } = useNotifications();
  
  const [activeTab, setActiveTab] = useState<"alerts" | "settings">("alerts");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Notification Preferences State
  const [prefs, setPrefs] = useState({
    newProperties: user?.notifications?.newProperties ?? true,
    newBookings: user?.notifications?.newBookings ?? true,
    marketing: user?.notifications?.marketing ?? false,
    propertyApproval: user?.notifications?.propertyApproval ?? true,
    verificationStatus: user?.notifications?.verificationStatus ?? true,
  });

  // Early return if user is not loaded
  if (authLoading || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft color={themeColors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      </View>
    );
  }

  // Hide parent tab header
  useLayoutEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({ headerShown: false });
    }
    return () => {
      if (parent) {
        parent.setOptions({ headerShown: true });
      }
    };
  }, [navigation]);

  useEffect(() => {
    if (activeTab === "alerts") {
      fetchNotifications();
    }
  }, [activeTab]);

  const fetchNotifications = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await notificationsAPI.getAll();
      setNotifications(response.data);
      refreshUnreadCount();
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      refreshUnreadCount();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      refreshUnreadCount();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const clearAll = async () => {
    try {
      await notificationsAPI.clearAll();
      setNotifications([]);
      refreshUnreadCount();
    } catch (error) {
      Alert.alert("Error", "Failed to clear notifications.");
    }
  };

  const handleToggle = async (key: keyof typeof prefs) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    
    try {
      setIsSaving(true);
      await authAPI.updateProfile({ notifications: newPrefs });
      updateUser({ notifications: newPrefs });
    } catch (error) {
      Alert.alert("Error", "Failed to update notification preferences.");
      setPrefs(prefs); // Revert
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft color={themeColors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "alerts" && styles.activeTab]}
          onPress={() => setActiveTab("alerts")}
        >
          <Text style={[styles.tabText, activeTab === "alerts" && styles.activeTabText]}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "settings" && styles.activeTab]}
          onPress={() => setActiveTab("settings")}
        >
          <Text style={[styles.tabText, activeTab === "settings" && styles.activeTabText]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "alerts" ? (
        <View style={{ flex: 1 }}>
          <View style={styles.actionsBar}>
            <Text style={styles.resultsCount}>{notifications.length} notifications</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {notifications.some(n => !n.isRead) && (
                <TouchableOpacity style={styles.markAll} onPress={markAllAsRead}>
                  <CheckCheck size={16} color={Colors.primary} />
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              )}
              {notifications.length > 0 && (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert('Clear All', 'Remove all notifications?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Clear', style: 'destructive', onPress: clearAll },
                    ])
                  }
                >
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchNotifications(true)} />
            }
          >
            {isLoading ? (
              <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
            ) : notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Bell size={64} color={themeColors.textLight} strokeWidth={1} />
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptySubtitle}>We'll notify you when something important happens.</Text>
              </View>
            ) : (
              notifications.map((notification) => (
                <TouchableOpacity 
                  key={notification.id} 
                  style={[styles.notificationItem, !notification.isRead && styles.unreadItem]}
                  onPress={() => !notification.isRead && markAsRead(notification.id)}
                >
                  <View style={[styles.iconContainer, { 
                    backgroundColor:
                      (notification.type === 'booking_confirmed' || notification.type === 'success') ? '#4CAF5015' :
                      notification.type === 'warning' ? '#FF980015' :
                      notification.type === 'error' ? '#F4433615' :
                      Colors.primary + '15'
                  }]}>
                    <Bell size={20} color={
                      (notification.type === 'booking_confirmed' || notification.type === 'success') ? '#4CAF50' :
                      notification.type === 'warning' ? '#FF9800' :
                      notification.type === 'error' ? '#F44336' :
                      Colors.primary
                    } />
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      <Text style={styles.notificationTime}>{formatTime(notification.createdAt)}</Text>
                    </View>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>Activity Notifications</Text>
            
            {user.role === 'host' ? (
              <>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>New Reservations</Text>
                    <Text style={styles.settingDescription}>Get notified when a guest books your property</Text>
                  </View>
                  <Switch 
                    value={prefs.newBookings} 
                    onValueChange={() => handleToggle('newBookings')}
                    trackColor={{ false: themeColors.border, true: Colors.primary + '80' }}
                    thumbColor={prefs.newBookings ? Colors.primary : Colors.white}
                  />
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Property Approval</Text>
                    <Text style={styles.settingDescription}>Get notified when your property listing is approved</Text>
                  </View>
                  <Switch 
                    value={prefs.propertyApproval} 
                    onValueChange={() => handleToggle('propertyApproval')}
                    trackColor={{ false: themeColors.border, true: Colors.primary + '80' }}
                    thumbColor={prefs.propertyApproval ? Colors.primary : Colors.white}
                  />
                </View>

                <View style={styles.divider} />
                
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Verification Status</Text>
                    <Text style={styles.settingDescription}>Get notified when your host profile is verified</Text>
                  </View>
                  <Switch 
                    value={prefs.verificationStatus} 
                    onValueChange={() => handleToggle('verificationStatus')}
                    trackColor={{ false: themeColors.border, true: Colors.primary + '80' }}
                    thumbColor={prefs.verificationStatus ? Colors.primary : Colors.white}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>New Properties</Text>
                    <Text style={styles.settingDescription}>Receive alerts for newly listed properties</Text>
                  </View>
                  <Switch 
                    value={prefs.newProperties} 
                    onValueChange={() => handleToggle('newProperties')}
                    trackColor={{ false: themeColors.border, true: Colors.primary + '80' }}
                    thumbColor={prefs.newProperties ? Colors.primary : Colors.white}
                  />
                </View>

                <View style={styles.divider} />
                
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Booking Updates</Text>
                    <Text style={styles.settingDescription}>Get notified about your booking status changes</Text>
                  </View>
                  <Switch 
                    value={prefs.newBookings} 
                    onValueChange={() => handleToggle('newBookings')}
                    trackColor={{ false: themeColors.border, true: Colors.primary + '80' }}
                    thumbColor={prefs.newBookings ? Colors.primary : Colors.white}
                  />
                </View>
              </>
            )}
          </View>

          <View style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>Marketing</Text>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Promotions</Text>
                <Text style={styles.settingDescription}>Receive updates on special offers and discounts</Text>
              </View>
              <Switch 
                value={prefs.marketing} 
                onValueChange={() => handleToggle('marketing')}
                trackColor={{ false: themeColors.border, true: Colors.primary + '80' }}
                thumbColor={prefs.marketing ? Colors.primary : Colors.white}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: themeColors.card,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: themeColors.text,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: themeColors.card,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: themeColors.textLight,
  },
  activeTabText: {
    color: Colors.primary,
  },
  actionsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 13,
    color: themeColors.textLight,
    fontWeight: "500",
  },
  markAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  markAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loader: {
    marginTop: 100,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: themeColors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: themeColors.textLight,
    textAlign: "center",
    lineHeight: 20,
  },
  notificationItem: {
    flexDirection: "row",
    backgroundColor: themeColors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  unreadItem: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: themeColors.text,
    flex: 1,
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 11,
    color: themeColors.textLight,
  },
  notificationMessage: {
    fontSize: 13,
    color: themeColors.textLight,
    lineHeight: 18,
  },
  settingsGroup: {
    backgroundColor: themeColors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: "uppercase",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 16,
  },
  settingInfo: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.text,
  },
  settingDescription: {
    fontSize: 12,
    color: themeColors.textLight,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: themeColors.border,
    marginVertical: 4,
  },
});
