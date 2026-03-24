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
import { Text, View } from "@/components/Themed";
import { useRouter } from "expo-router";
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
} from "lucide-react-native";
import { Image } from "expo-image";
import { API_BASE_URL } from "@/services/api";
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
  const { user, signOut } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSignOut = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // We don't necessarily need to await the full background clearing here
    // as the state update inside signOut will trigger the UI change immediately.
    signOut();
  };

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <UserIcon color={Colors.textLight} size={64} />
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
      {showChevron && <ChevronRight color={Colors.textLight} size={20} />}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
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
        <View style={styles.group}>
          <MenuItem icon={UserIcon} label="Personal Info" onPress={() => router.push("/(tabs)/profile/personal-info" as any)} showChevron={true} />
          <View style={styles.divider} />
          <MenuItem icon={Lock} label="Change Password" onPress={() => router.push("/(tabs)/profile/change-password" as any)} showChevron={true} />
        </View>

        {/* Group 2: Activity */}
        <View style={styles.group}>
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
        </View>

        {/* Group 3: Support */}
        <View style={styles.group}>
          <MenuItem icon={CircleHelp} label="FAQs" onPress={() => router.push("/(tabs)/profile/faqs" as any)} showChevron={true} />
          <View style={styles.divider} />
          <MenuItem icon={MessageSquare} label="User Reviews" onPress={() => router.push("/(tabs)/profile/user-review" as any)} showChevron={true} />
          <View style={styles.divider} />
          <MenuItem icon={Globe} label="Contact & Social Info" onPress={() => router.push("/(tabs)/profile/contact-social" as any)} showChevron={true} />
        </View>

        {/* Group 4: Logout */}
        <View style={styles.group}>
          <MenuItem icon={LogOut} label="Log Out" onPress={handleSignOut} />
        </View>
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
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    shadowColor: "#000",
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
    backgroundColor: "#FFD1B9",
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
    color: Colors.text,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textLight,
  },
  group: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
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
    color: Colors.text,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: "center",
    marginBottom: 24,
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
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
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
    backgroundColor: Colors.card,
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
    color: Colors.primary, // Using primary blue instead of red/orange
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 28,
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
    color: Colors.white,
    fontSize: 18,
    fontWeight: "700",
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
