import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import Colors from "@/constants/Colors";
import { Image } from "expo-image";
import { Heart, MapPin, Search, Star } from "lucide-react-native";
import { Text, View, Card } from "@/components/Themed";
import { useRouter, Redirect } from "expo-router";
import { useTheme } from "@/contexts/theme";
import { useAuth } from "@/contexts/auth";
import { useFavorites } from "@/contexts/favorites";
import { Property } from "@/types";
import { propertiesAPI, API_BASE_URL } from "@/services/api";
import * as Haptics from "expo-haptics";
import { ResponsiveView } from "@/components/ResponsiveView";

const screen = Dimensions.get("window");
const SCREEN_WIDTH = screen?.width || 375;
const SCREEN_HEIGHT = screen?.height || 667;

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

export default function TabOneScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { toggleFavorite, isFavorite } = useFavorites();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 600;
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user || (user.role !== "host" && user.role !== "admin")) {
      fetchProperties();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (user?.role === "host" || user?.role === "admin") {
    return <Redirect href="/(tabs)/(host)" />;
  }

  const fetchProperties = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const response = await propertiesAPI.getAll({ status: "active" });
      setAllProperties(response.data);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      if (isRefresh) setRefreshing(false);
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    fetchProperties(true);
  }, []);

  const handlePropertyPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/property/${id}`);
  };

  const handleFavoritePress = (property: Property) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!user) {
      router.push(`/auth/login`);
      return;
    }
    toggleFavorite(property.id, property);
  };

  const featuredProperties = allProperties.slice(0, 6);

  const searchResults = allProperties.filter((property) => {
    if (!searchQuery) return true;
    return (
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (property.lga && property.lga.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]} // Android
            tintColor={Colors.primary} // iOS
          />
        }
      >
        <ResponsiveView maxWidth={1200} style={{ paddingHorizontal: isTablet ? 20 : 0 }}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>
                Hello{user ? `, ${user.name.split(" ")[0]}` : ""}! 👋
              </Text>
              <Text style={styles.subtitle}>Find your perfect stay in Kano</Text>
            </View>
          </View>

          <View style={[styles.searchBar, { backgroundColor: themeColors.card }]}>
          <Search color={Colors.textLight} size={20} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Search location, LGA..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {searchQuery.trim().length > 0 ? (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.sectionTitle}>
              {searchResults.length} Result{searchResults.length !== 1 ? 's' : ''}
            </Text>
            {searchResults.map((property) => (
              <Pressable
                key={property.id}
                style={[styles.resultCard, { backgroundColor: themeColors.card }]}
                onPress={() => handlePropertyPress(property.id)}
              >
                <Image
                  source={{ uri: property.images && property.images.length > 0 ? property.images[0] : "https://placehold.co/600x400" }}
                  style={styles.resultImage}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => handleFavoritePress(property)}
                >
                  <Heart
                    color={isFavorite(property.id) ? Colors.primary : Colors.textLight}
                    fill={isFavorite(property.id) ? Colors.primary : "transparent"}
                    size={20}
                  />
                </TouchableOpacity>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {property.title}
                  </Text>
                  <View style={styles.locationRow}>
                    <MapPin color={Colors.textLight} size={14} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {property.location}, {property.lga}
                    </Text>
                  </View>
                  <View style={styles.featuredFooter}>
                    <View style={styles.ratingRow}>
                      <Star color={Colors.accent} fill={Colors.accent} size={14} />
                      <Text style={styles.ratingText}>
                        {property.rating?.toFixed(1) || "4.5"}
                      </Text>
                    </View>
                    <Text style={styles.price}>
                      ₦{property.price.toLocaleString()}/night
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <>
            <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Properties</Text>
            <TouchableOpacity onPress={() => router.push("../explore")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            >
              {featuredProperties.map((property) => (
                <Pressable
                  key={property.id}
                  style={[styles.featuredCard, { backgroundColor: themeColors.card }]}
                  onPress={() => handlePropertyPress(property.id)}
                >
                  <Image
                    source={{ uri: property.images && property.images.length > 0 ? property.images[0] : "https://placehold.co/600x400" }}
                    style={styles.featuredImage}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => handleFavoritePress(property)}
                  >
                    <Heart
                      color={
                        isFavorite(property.id)
                          ? Colors.primary
                          : Colors.textLight
                      }
                      fill={
                        isFavorite(property.id) ? Colors.primary : "transparent"
                      }
                      size={20}
                    />
                  </TouchableOpacity>
                  <View style={styles.featuredInfo}>
                    <Text style={styles.featuredTitle} numberOfLines={1}>
                      {property.title}
                    </Text>
                    <View style={styles.locationRow}>
                      <MapPin color={Colors.textLight} size={14} />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {property.location}, {property.lga}
                      </Text>
                    </View>
                    <View style={styles.featuredFooter}>
                      <View style={styles.ratingRow}>
                        <Star
                          color={Colors.accent}
                          fill={Colors.accent}
                          size={14}
                        />
                        <Text style={styles.ratingText}>
                          {property.rating?.toFixed(1) || "4.5"}
                        </Text>
                        <Text style={styles.reviewCount}>
                          ({property.reviewCount || 0})
                        </Text>
                      </View>
                      <Text style={styles.price}>
                        ₦{property.price.toLocaleString()}/night
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Locations</Text>
          <View style={styles.locationsGrid}>
            {["Nassarawa", "Gwale", "Kano Municipal", "Fagge"].map(
              (location) => (
                <TouchableOpacity
                  key={location}
                  style={[styles.locationCard, { backgroundColor: themeColors.card }]}
                  onPress={() => router.push(`../explore?location=${location}`)}
                >
                  <MapPin color={Colors.primary} size={20} />
                  <Text style={styles.locationName}>{location}</Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        </View>
        </>
        )}
        </ResponsiveView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
  featuredList: {
    paddingRight: 20,
    paddingVertical: 12,
    gap: 16,
  },
  featuredCard: {
    width: Dimensions.get("window").width >= 600 ? 350 : Dimensions.get("window").width * 0.7,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuredImage: {
    width: "100%",
    height: 200,
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: Colors.overlay,
    borderRadius: 20,
    padding: 8,
  },
  featuredInfo: {
    padding: 12,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    flex: 1,
  },
  featuredFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
  },
  reviewCount: {
    fontSize: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primary,
  },
  locationsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchResultsContainer: {
    padding: 20,
    marginTop: 10,
    gap: 16,
  },
  resultCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  resultImage: {
    width: "100%",
    height: 200,
  },
  resultInfo: {
    padding: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  }
});
