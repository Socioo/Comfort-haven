import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Star, MapPin, Send, AlertCircle } from "lucide-react-native";
import Colors from "@/constants/Colors";
import { useTheme } from "@/contexts/theme";
import { API_BASE_URL, propertiesAPI, usersAPI } from "@/services/api";
import UserAvatar from "@/components/UserAvatar";

const getImageUrl = (url: string | undefined | null) => {
  if (!url) return undefined;
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};
import { Property } from "@/types";
import { User } from "@/types/user";
import * as Haptics from "expo-haptics";

export default function HostDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const styles = createStyles(themeColors);
  
  const [hostInfo, setHostInfo] = useState<User | null>(null);
  const [hostProperties, setHostProperties] = useState<Property[]>([]);
  const [showAllProperties, setShowAllProperties] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [userResponse, propertiesResponse] = await Promise.all([
        usersAPI.getById(id),
        propertiesAPI.getByHost(id),
      ]);

      setHostInfo(userResponse.data);
      setHostProperties(propertiesResponse.data);
    } catch (err) {
      console.error("Error loading host data:", err);
      setError("Failed to load host information");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !hostInfo) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle
          color={Colors.textLight}
          size={48}
          style={{ marginBottom: 16 }}
        />
        <Text style={styles.errorText}>{error || "Host not found"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hostName = hostInfo.name || hostInfo.firstName || "Host";

  const hostPhoto = hostInfo.profileImage || hostInfo.photoUrl;

  const totalReviews = hostProperties.reduce(
    (sum, p) => sum + (p.reviewCount || 0),
    0,
  );
  const averageRating =
    totalReviews > 0
      ? (
          hostProperties.reduce(
            (sum, p) => sum + (p.rating || 0) * (p.reviewCount || 0),
            0,
          ) / totalReviews
        ).toFixed(1)
      : "New";

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Stack.Screen
        options={{
          title: "Host Details",
          headerBackTitle: "Back",
        }}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hostHeader}>
          <UserAvatar 
            name={hostName} 
            image={hostPhoto} 
            size={100} 
            style={styles.hostAvatar}
          />
          <Text style={styles.hostName}>{hostName}</Text>
          <Text style={styles.hostLabel}>Property Host</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{hostProperties.length}</Text>
              <Text style={styles.statLabel}>Properties</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{averageRating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalReviews}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Host</Text>
          <Text style={styles.aboutText}>
            Professional property host with years of experience in hospitality.
            Dedicated to providing exceptional stays and ensuring guest
            satisfaction. Quick to respond and always available to assist with
            any needs.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
              Properties ({hostProperties.length})
            </Text>
            {hostProperties.length > 3 && (
              <TouchableOpacity onPress={() => setShowAllProperties(!showAllProperties)}>
                <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 14 }}>
                  {showAllProperties ? "Show Less" : "See All"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.propertiesList}>
            {(showAllProperties ? hostProperties : hostProperties.slice(0, 3)).map((property) => (
              <TouchableOpacity
                key={property.id}
                style={[styles.propertyCard, { backgroundColor: themeColors.card }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/property/${property.id}` as any);
                }}
              >
                <Image
                  source={{ uri: property.images[0] }}
                  style={styles.propertyImage}
                  contentFit="cover"
                />
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyTitle} numberOfLines={1}>
                    {property.title}
                  </Text>
                  <View style={styles.propertyLocation}>
                    <MapPin color={themeColors.textLight} size={12} />
                    <Text style={styles.propertyLocationText} numberOfLines={1}>
                      {property.location}, {property.lga}
                    </Text>
                  </View>
                  <View style={styles.propertyFooter}>
                    <View style={styles.propertyRating}>
                      <Star
                        color={Colors.accent}
                        fill={Colors.accent}
                        size={12}
                      />
                      <Text style={styles.ratingText}>{property.rating}</Text>
                    </View>
                    <Text style={styles.propertyPrice}>
                      ₦{property.price.toLocaleString()}/night
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  hostHeader: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  hostAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  hostName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
    color: themeColors.text,
  },
  hostLabel: {
    fontSize: 16,
    marginBottom: 24,
    color: themeColors.textLight,
  },
  statsContainer: {
    flexDirection: "row",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 24,
    backgroundColor: themeColors.card,
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: themeColors.textLight,
  },
  statDivider: {
    width: 1,
    backgroundColor: themeColors.border,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: themeColors.text,
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.text,
  },
  propertiesList: {
    gap: 12,
  },
  propertyCard: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  propertyImage: {
    width: 100,
    height: 100,
  },
  propertyInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: themeColors.text,
  },
  propertyLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  propertyLocationText: {
    fontSize: 13,
    flex: 1,
    color: themeColors.textLight,
  },
  propertyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  propertyRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.text,
  },
  propertyPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.primary,
  },
  chatContainer: {
    gap: 12,
    paddingBottom: 16,
  },
  chatBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  hostBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  chatText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  userText: {
    color: "#FFFFFF",
  },
  hostText: {
    color: themeColors.text,
  },
  chatTime: {
    fontSize: 11,
  },
  userTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  hostTime: {
    color: themeColors.textLight,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: themeColors.background,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    color: themeColors.text,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
