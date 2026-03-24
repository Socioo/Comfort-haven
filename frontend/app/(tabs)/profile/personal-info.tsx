import React, { useState, useLayoutEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/contexts/auth";
import Colors from "@/constants/Colors";
import { Text, View } from "@/components/Themed";
import { Image } from "expo-image";
import { Camera, ChevronLeft, FileText, Mail, Phone, User as UserIcon } from "lucide-react-native";
import { API_BASE_URL, authAPI, usersAPI } from "@/services/api";

const getImageUrl = (url: string | undefined) => {
  if (!url) return undefined;
  if (
    url.startsWith("http") ||
    url.startsWith("file://") ||
    url.startsWith("content://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  )
    return url;
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  if (cleanUrl.startsWith("/uploads")) return `${API_BASE_URL}${cleanUrl}`;
  return `${API_BASE_URL}/uploads${cleanUrl}`;
};

export default function PersonalInfoScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  
  // Import usersAPI if needed or use authAPI if it's there
  // Actually I need to import usersAPI
  
  // Hide parent tab header when this screen is open
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
  
  const getInitials = (name?: string, firstName?: string, lastName?: string) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (firstName || lastName) {
      return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
    }
    return "?";
  };

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
    email: user?.email || "",
    phone: user?.phone || "",
    bio: (user as any)?.bio || "",
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && user) {
      const uri = result.assets[0].uri;
      try {
        setIsSaving(true);
        
        // Prepare FormData for real upload
        const formData = new FormData();
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;
        
        formData.append('file', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name: filename,
          type,
        } as any);

        const response = await usersAPI.uploadProfileImage(user.id, formData);
        const updatedUser = response.data;
        
        updateUser(updatedUser);
        Alert.alert("Success", "Profile picture updated.");
      } catch (error) {
        console.error("Upload error:", error);
        Alert.alert("Error", "Failed to upload profile picture.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await authAPI.updateProfile({
        name: form.name,
        phone: form.phone,
        bio: form.bio,
      });
      updateUser({
        name: form.name,
        phone: form.phone,
        bio: form.bio,
      } as any);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      handleSave();
    } else {
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setForm({
      name: user?.name || `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
      email: user?.email || "",
      phone: user?.phone || "",
      bio: (user as any)?.bio || "",
    });
    setIsEditing(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (isEditing ? handleCancel() : router.back())}
          >
            <ChevronLeft color={Colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Info</Text>
          <TouchableOpacity onPress={handleEditToggle} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.editButton}>{isEditing ? "SAVE" : "EDIT"}</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar + Name */}
          <View style={styles.profileRow}>
            <View style={styles.avatarContainer}>
              {user?.profileImage || user?.photoUrl ? (
                <Image
                  source={{ uri: getImageUrl(user.profileImage || user.photoUrl) }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.initialsText}>
                    {getInitials(user?.name, user?.firstName, user?.lastName)}
                  </Text>
                </View>
              )}
              {isEditing && (
                <TouchableOpacity 
                  style={styles.editAvatarBadge}
                  onPress={pickImage}
                >
                  <Camera color={Colors.white} size={14} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName} numberOfLines={1}>{form.name || "—"}</Text>
              <Text style={styles.profileBio} numberOfLines={2}>{form.bio || "No bio yet"}</Text>
            </View>
          </View>

          {/* Fields */}
          <View style={styles.fieldsContainer}>
            {/* Full Name */}
            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <UserIcon color={Colors.primary} size={18} strokeWidth={1.5} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>FULL NAME</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={form.name}
                    onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                    placeholder="Your full name"
                    placeholderTextColor={Colors.textLight}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{form.name || "—"}</Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Email (read-only always) */}
            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <Mail color={Colors.primary} size={18} strokeWidth={1.5} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <Text style={[styles.fieldValue, styles.readOnly]}>{form.email || "—"}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Phone */}
            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <Phone color={Colors.primary} size={18} strokeWidth={1.5} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={form.phone}
                    onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
                    placeholder="Your phone number"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{form.phone || "—"}</Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Bio */}
            <View style={[styles.field, { alignItems: "flex-start" }]}>
              <View style={[styles.fieldIcon, { marginTop: 4 }]}>
                <FileText color={Colors.primary} size={18} strokeWidth={1.5} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>BIO</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.fieldInput, styles.bioInput]}
                    value={form.bio}
                    onChangeText={(v) => setForm((p) => ({ ...p, bio: v }))}
                    placeholder="Tell us a bit about yourself..."
                    placeholderTextColor={Colors.textLight}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{form.bio || "No bio yet. Tap EDIT to add one."}</Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
  },
  editButton: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20, // Increased gap for better spacing
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24, // More padding for premium feel
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    backgroundColor: "transparent",
    position: "relative",
    width: 70,
    height: 70,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 1,
  },
  profileMeta: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  profileBio: {
    fontSize: 13,
    color: Colors.textLight,
    lineHeight: 18,
  },
  editAvatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  fieldsContainer: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingVertical: 12, // Increased from 4
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24, // Increased from 20
    paddingVertical: 18, // Increased from 16
    gap: 16,
    backgroundColor: "transparent",
  },
  fieldIcon: {
    width: 32,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  fieldContent: {
    flex: 1,
    backgroundColor: "transparent",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textLight,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "500",
  },
  readOnly: {
    color: Colors.darkGray,
  },
  fieldInput: {
    fontSize: 15,
    color: Colors.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
    paddingVertical: 8, // More breathing room
    fontWeight: "500",
    // To fix 'too long line', we can add paddingRight if preferred
    paddingRight: 10,
  },
  bioInput: {
    minHeight: 100,
    borderBottomWidth: 1, // Changed from 0 to 1 to match others if they prefer lines
    borderRadius: 0, // Matching other fields better
    borderWidth: 0,
    padding: 0,
    paddingTop: 8,
    marginTop: 0,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 24, // Match horizontal padding
  },
});
