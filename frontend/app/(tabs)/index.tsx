import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import Colors from "@/constants/Colors";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { rf, ms, s, vs, isTablet, screenWidth } from "@/utils/responsive";

// SCREEN_WIDTH and SCREEN_HEIGHT are now imported or calculated from responsive utils


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
  const insets = useSafeAreaInsets();
  // isTablet is imported from responsive utils

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

  const onRefresh = React.useCallback(() => {
    fetchProperties(true);
  }, []);

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

  const horizontalPadding = ms(20);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <ResponsiveView maxWidth={1200}>
          <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { fontSize: screenWidth >= 600 ? 42 : 34 }]}>
                Hello{user ? `, ${user.name.split(" ")[0]}` : ""}! 👋
              </Text>
              <Text style={[styles.subtitle, { fontSize: screenWidth >= 600 ? 18 : 16 }]}>Find your perfect stay in Kano</Text>
            </View>
          </View>

          <View style={[
            styles.searchBar, 
            { 
              backgroundColor: themeColors.card,
              marginHorizontal: horizontalPadding,
              paddingVertical: screenWidth >= 600 ? 14 : 10
            }
          ]}>
            <Search color={Colors.textLight} size={screenWidth >= 600 ? 22 : 18} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text, fontSize: screenWidth >= 600 ? 16 : 14 }]}
              placeholder="Search location, LGA..."
              placeholderTextColor={Colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

        {searchQuery.trim().length > 0 ? (
          <View style={[styles.searchResultsContainer, { paddingHorizontal: horizontalPadding }]}>
            <Text style={styles.sectionTitle}>
              {searchResults.length} Result{searchResults.length !== 1 ? 's' : ''}
            </Text>
            <View style={screenWidth >= 600 ? styles.resultsGrid : null}>
              {searchResults.map((property) => (
                <Pressable
                  key={property.id}
                  style={[
                    styles.resultCard, 
                    { 
                      backgroundColor: themeColors.card,
                      width: screenWidth >= 900 ? '31%' : (screenWidth >= 600 ? '48%' : '100%')
                    }
                  ]}
                  onPress={() => handlePropertyPress(property.id)}
                >
                  <Image
                    source={{ uri: property.images && property.images.length > 0 ? getImageUrl(property.images[0]) : "https://placehold.co/600x400" }}
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
          </View>
        ) : (
          <>
            <View style={[styles.section, { paddingHorizontal: horizontalPadding }]}>
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
              contentContainerStyle={[styles.featuredList, { paddingLeft: horizontalPadding, paddingRight: horizontalPadding }]}
            >
              {featuredProperties.map((property) => (
                <Pressable
                  key={property.id}
                  style={[
                    styles.featuredCard, 
                    { 
                      backgroundColor: themeColors.card,
                      width: screenWidth >= 600 ? 350 : screenWidth * 0.75
                    }
                  ]}
                  onPress={() => handlePropertyPress(property.id)}
                >
                  <Image
                    source={{ uri: property.images && property.images.length > 0 ? getImageUrl(property.images[0]) : "https://placehold.co/600x400" }}
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

        <View style={[styles.section, { paddingHorizontal: horizontalPadding, marginTop: 0 }]}>
          <Text style={styles.sectionTitle}>Popular Locations</Text>
          <View style={styles.locationsGrid}>
            {["Nassarawa", "Gwale", "Kano Municipal", "Fagge"].map(
              (location) => (
                <TouchableOpacity
                  key={location}
                  style={[
                    styles.locationCard, 
                    { 
                      backgroundColor: themeColors.card,
                      width: screenWidth >= 600 ? '23%' : '47%'
                    }
                  ]}
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
    paddingBottom: vs(20),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: vs(20),
    paddingBottom: vs(16),
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: rf(32),
    fontWeight: "bold",
    marginBottom: vs(4),
  },
  subtitle: {
    fontSize: rf(16),
    color: '#64748b'
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: vs(4),
    paddingHorizontal: ms(14),
    paddingVertical: vs(10),
    borderRadius: ms(24),
    gap: ms(8),
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: ms(12),
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: rf(15),
  },
  section: {
    marginTop: vs(24),
    paddingVertical: vs(12),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(16),
  },
  sectionTitle: {
    fontSize: rf(22),
    fontWeight: "bold",
  },
  seeAll: {
    fontSize: rf(14),
    color: Colors.primary,
    fontWeight: "600",
  },
  featuredList: {
    paddingVertical: vs(12),
    gap: ms(16),
  },
  featuredCard: {
    borderRadius: ms(16),
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: ms(8),
  },
  featuredImage: {
    width: "100%",
    height: vs(200),
  },
  favoriteButton: {
    position: "absolute",
    top: vs(12),
    right: ms(12),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: ms(20),
    padding: ms(8),
  },
  featuredInfo: {
    padding: ms(12),
  },
  featuredTitle: {
    fontSize: rf(16),
    fontWeight: "600",
    marginBottom: vs(6),
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(4),
    marginBottom: vs(8),
  },
  locationText: {
    fontSize: rf(14),
    color: '#64748b',
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
    gap: ms(4),
  },
  ratingText: {
    fontSize: rf(14),
    fontWeight: "600",
  },
  reviewCount: {
    fontSize: rf(12),
    color: '#64748b',
  },
  price: {
    fontSize: rf(16),
    fontWeight: "bold",
    color: Colors.primary,
  },
  locationsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ms(12),
    marginTop: vs(16),
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: ms(16),
    paddingVertical: vs(12),
    borderRadius: ms(12),
    gap: ms(8),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  locationName: {
    fontSize: rf(14),
    fontWeight: "600",
  },
  searchResultsContainer: {
    marginTop: vs(20),
    gap: vs(16),
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(16),
  },
  resultCard: {
    borderRadius: ms(16),
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: ms(6),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  resultImage: {
    width: "100%",
    height: vs(180),
  },
  resultInfo: {
    padding: ms(12),
  },
  resultTitle: {
    fontSize: rf(15),
    fontWeight: "600",
    marginBottom: vs(6),
  }
});

