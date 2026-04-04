import React, { useState } from "react";

import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
} from "react-native";
import Colors from "@/constants/Colors";
import { Text, View, Card } from "@/components/Themed";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/theme";
import { useAuth } from "@/contexts/auth";
import * as Haptics from "expo-haptics";
import {
  Bell,
  CalendarCheck,
  ChevronRight,
  CircleHelp,
  Heart,
  LogOut,
  MessageSquare,
  User as UserIcon,
  Lock,
  Globe,
  Palette,
  Settings,
  UserX,
  AlertTriangle,
  ChevronDown,
  CheckCircle,
  Landmark,
} from "lucide-react-native";
import { Image } from "expo-image";
import { API_BASE_URL, usersAPI } from "@/services/api";
import UserAvatar from "@/components/UserAvatar";

const getImageUrl = (url: string | undefined) => {
  if (!url) return undefined;
  if (
    url.startsWith("http") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  )
    return url;
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  if (cleanUrl.startsWith("/uploads")) return `${API_BASE_URL}${cleanUrl}`;
  return `${API_BASE_URL}/uploads${cleanUrl}`;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, updateUser } = useAuth();
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAccountManagement, setShowAccountManagement] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const styles = createStyles(themeColors);

  const handleSignOut = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    signOut();
  };

  const confirmDeactivate = async () => {
    setIsProcessing(true);
    try {
      await usersAPI.deactivateAccount();
      setShowDeactivateModal(false);
      updateUser({ status: "inactive" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Account Deactivated", "Your account is now hidden, but you can reactivate it right here.");
    } catch (error) {
      console.error("Failed to deactivate", error);
      Alert.alert("Error", "Failed to deactivate account.");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmReactivate = () => {
    Alert.alert(
      "Reactivate Account",
      "Do you want to restore your account to fully active status?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Reactivate", 
          onPress: async () => {
            setIsProcessing(true);
            try {
              await usersAPI.reactivateAccount();
              updateUser({ status: "active" });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Welcome Back!", "Your account is now fully active.");
            } catch (error) {
              console.error("Failed to reactivate", error);
              Alert.alert("Error", "Failed to reactivate account.");
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const confirmDelete = async () => {
    setIsProcessing(true);
    try {
      await usersAPI.deleteAccount();
      setShowDeleteModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Account Deleted", "Your account and data have been permanently deleted.");
      signOut();
    } catch (error) {
      console.error("Failed to delete", error);
      Alert.alert("Error", "Failed to delete account.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: themeColors.background }]}>
        <UserIcon color={themeColors.textLight} size={64} />
        <Text style={styles.emptyTitle}>Not signed in</Text>
        <Text style={styles.emptyText}>
          Sign in to access your profile and bookings
        </Text>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => router.push("/auth/login" as any)}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() => router.push("/auth/signup" as any)}
        >
          <Text style={styles.signUpButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const MenuItem = ({
    icon: Icon,
    label,
    onPress,
    showChevron = true,
  }: {
    icon: any;
    label: string;
    onPress?: () => void;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Icon color={Colors.primary} size={22} strokeWidth={1.5} />
        <Text style={styles.menuItemText}>{label}</Text>
      </View>
      {showChevron && <ChevronRight color={themeColors.textLight} size={20} />}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header (Avatar & Info) */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <UserAvatar 
              name={user.name || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()} 
              image={user.profileImage || user.photoUrl} 
              size={80} 
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.name}>
              {user.name || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()}
            </Text>
            <Text style={styles.tagline} numberOfLines={2}>
              {(user as any).bio || "No bio yet. Tap Personal Info to add one."}
            </Text>
          </View>
        </View>

        {/* Group 1: Account */}
        <Card style={styles.group}>
          <MenuItem icon={UserIcon} label="Personal Info" onPress={() => router.push("/(tabs)/profile/personal-info" as any)} showChevron={true} />
          <View style={styles.divider} />
          <MenuItem icon={Palette} label="Appearance" onPress={() => router.push("/(tabs)/profile/appearance" as any)} showChevron={true} />
          <View style={styles.divider} />
          {user.role === "host" && (
            <>
              <MenuItem 
                icon={Landmark} 
                label="Payout Settings" 
                onPress={() => router.push("/host/payout-settings")} 
                showChevron={true} 
              />
              <View style={styles.divider} />
            </>
          )}
          <MenuItem icon={Lock} label="Change Password" onPress={() => router.push("/(tabs)/profile/change-password" as any)} showChevron={true} />
        </Card>

        {/* Group 2: Activity */}
        <Card style={styles.group}>
          <MenuItem 
            icon={CalendarCheck} 
            label={user.role === "host" ? "Booking History" : "Bookings"} 
            onPress={() => router.push(user.role === "host" ? "/(tabs)/profile/host-bookings" : "/(tabs)/profile/bookings")}
          />
          <View style={styles.divider} />
          <MenuItem 
            icon={Bell} 
            label="Notifications" 
            onPress={() => router.push("/(tabs)/profile/notifications")}
          />
        </Card>

        {/* Group 3: Support */}
        <Card style={styles.group}>
          <MenuItem icon={CircleHelp} label="FAQs" onPress={() => router.push("/(tabs)/profile/faqs" as any)} showChevron={true} />
          <View style={styles.divider} />
          <MenuItem icon={MessageSquare} label="User Reviews" onPress={() => router.push("/(tabs)/profile/user-review" as any)} showChevron={true} />
          <View style={styles.divider} />
          <MenuItem icon={Globe} label="Contact & Social Info" onPress={() => router.push("/(tabs)/profile/contact-social" as any)} showChevron={true} />
        </Card>

        {/* Group 4: Logout */}
        <Card style={styles.group}>
          <MenuItem icon={LogOut} label="Log Out" onPress={handleSignOut} />
        </Card>

        {/* Group 5: Account Management */}
        <Card style={styles.group}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => setShowAccountManagement(!showAccountManagement)}
          >
            <View style={styles.menuItemLeft}>
              <Settings color={Colors.primary} size={22} strokeWidth={1.5} />
              <Text style={styles.menuItemText}>Account Management</Text>
            </View>
            {showAccountManagement ? <ChevronDown color={themeColors.textLight} size={20} /> : <ChevronRight color={themeColors.textLight} size={20} />}
          </TouchableOpacity>
          
          {showAccountManagement && (
            <View style={styles.expandedContent}>
              <View style={styles.divider} />
              
              {user?.status === "inactive" ? (
                <TouchableOpacity 
                  style={[styles.menuItem, { paddingLeft: 40 }]} 
                  onPress={confirmReactivate}
                >
                  <View style={styles.menuItemLeft}>
                    <CheckCircle color="#10b981" size={20} strokeWidth={1.5} />
                    <Text style={[styles.menuItemText, { color: "#10b981" }]}>Reactivate Account</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.menuItem, { paddingLeft: 40 }]} 
                  onPress={() => setShowDeactivateModal(true)}
                >
                  <View style={styles.menuItemLeft}>
                    <UserX color="#f59e0b" size={20} strokeWidth={1.5} />
                    <Text style={[styles.menuItemText, { color: "#f59e0b" }]}>Deactivate Account</Text>
                  </View>
                </TouchableOpacity>
              )}

              <View style={styles.divider} />
              <TouchableOpacity 
                style={[styles.menuItem, { paddingLeft: 40 }]} 
                onPress={() => setShowDeleteModal(true)}
              >
                <View style={styles.menuItemLeft}>
                  <AlertTriangle color="#ef4444" size={20} strokeWidth={1.5} />
                  <Text style={[styles.menuItemText, { color: "#ef4444" }]}>Delete Account</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowLogoutModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={styles.modalTitle}>Are sure you want to logout?</Text>
            
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={confirmLogout}
            >
              <Text style={styles.confirmButtonText}>Yes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={styles.cancelButtonText}>No</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <Modal
        visible={showDeactivateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeactivateModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDeactivateModal(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: "#fef3c7" }]}>
              <UserX color="#d97706" size={32} />
            </View>
            <Text style={styles.modalTitle}>Deactivate Account</Text>
            <Text style={styles.modalSubTitle}>
              Your profile and properties will be hidden immediately. You will remain logged in and can tap "Reactivate" anytime to undo this. Do you wish to continue?
            </Text>
            
            <TouchableOpacity style={[styles.confirmButton, { backgroundColor: "#f59e0b" }]} onPress={confirmDeactivate} disabled={isProcessing}>
              <Text style={styles.confirmButtonText}>{isProcessing ? "Processing..." : "Yes, Deactivate"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelButton, { borderColor: "#f59e0b" }]} onPress={() => setShowDeactivateModal(false)} disabled={isProcessing}>
              <Text style={[styles.cancelButtonText, { color: "#f59e0b" }]}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDeleteModal(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: "#fee2e2" }]}>
              <AlertTriangle color="#dc2626" size={32} />
            </View>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalSubTitle}>
              This action is permanent and cannot be undone. All your data will be erased. Are you absolutely sure?
            </Text>
            
            <TouchableOpacity style={[styles.confirmButton, { backgroundColor: "#ef4444" }]} onPress={confirmDelete} disabled={isProcessing}>
              <Text style={styles.confirmButtonText}>{isProcessing ? "Processing..." : "Yes, Delete Permanently"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelButton, { borderColor: "#ef4444" }]} onPress={() => setShowDeleteModal(false)} disabled={isProcessing}>
              <Text style={[styles.cancelButtonText, { color: "#ef4444" }]}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "transparent",
  },
  avatarContainer: {
    marginRight: 20,
    backgroundColor: "transparent",
    shadowColor: themeColors.shadow || "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: themeColors.textLight,
  },
  group: {
    borderRadius: 20,
    paddingVertical: 4,
    shadowColor: themeColors.shadow || "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  expandedContent: {
    backgroundColor: "transparent",
  },
  divider: {
    height: 1,
    backgroundColor: themeColors.border,
    marginLeft: 58,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "transparent",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "transparent",
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold" as const,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center" as const,
    marginBottom: 24,
    color: themeColors.textLight,
  },
  signInButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  signUpButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  signUpButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  modalContent: {
    width: "100%",
    borderRadius: 30,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 28,
  },
  modalSubTitle: {
    fontSize: 15,
    color: themeColors.textLight,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  confirmButton: {
    width: "100%",
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  cancelButton: {
    width: "100%",
    backgroundColor: "transparent",
    height: 56,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  cancelButtonText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: "700",
  },
});
