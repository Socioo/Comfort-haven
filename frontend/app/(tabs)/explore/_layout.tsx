import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import { Text, View, Card } from "@/components/Themed";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/contexts/theme";
import { useAuth } from "@/contexts/auth";
import { useFavorites } from "@/contexts/favorites";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import {
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  X,
  Heart,
} from "lucide-react-native";
import { KANO_LGAS } from "@/constants/locations";
import { propertiesAPI, API_BASE_URL } from "@/services/api";
import { Property } from "@/types";
import { ResponsiveView } from "@/components/ResponsiveView";

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

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { toggleFavorite, isFavorite } = useFavorites();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  const styles = createStyles(themeColors, width, insets);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLGA, setSelectedLGA] = useState<string>(
    (params.location as string) || "",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [showLGADropdown, setShowLGADropdown] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const response = await propertiesAPI.getAll({ status: "active" });
      setProperties(response.data);
    } catch (error) {
      console.error("Error loading properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAverageRating = (reviews: any[] = []) => {
    if (!reviews || !reviews.length) return 0;
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesSearch =
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (property.lga &&
          property.lga.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLGA = !selectedLGA || property.lga === selectedLGA;

      const priceVal = Number(property.price);
      const matchesMinPrice = !minPrice || priceVal >= parseInt(minPrice);
      const matchesMaxPrice = !maxPrice || priceVal <= parseInt(maxPrice);

      return matchesSearch && matchesLGA && matchesMinPrice && matchesMaxPrice;
    });
  }, [properties, searchQuery, selectedLGA, minPrice, maxPrice]);

  const handlePropertyPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/property/${id}` as any);
  };

  const handleFavoritePress = (property: Property) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!user) {
      router.push("/auth/login" as any);
      return;
    }
    toggleFavorite(property.id, property);
  };

  const clearFilters = () => {
    setSelectedLGA("");
    setMinPrice("");
    setMaxPrice("");
    setSearchQuery("");
  };

  const activeFiltersCount = [selectedLGA, minPrice, maxPrice].filter(
    Boolean,
  ).length;

  const renderProperty = ({ item }: { item: Property }) => (
    <Pressable
      style={[
        styles.propertyCard, 
        { 
          backgroundColor: themeColors.card,
          width: width >= 900 ? '31%' : (width >= 600 ? '48%' : '100%')
        }
      ]}
      onPress={() => handlePropertyPress(item.id)}
    >
      <Image
        source={{
          uri: item.images && item.images.length > 0
              ? getImageUrl(item.images[0])
              : "https://placehold.co/600x400",
        }}
        style={styles.propertyImage}
        contentFit="cover"
      />
      <TouchableOpacity
        style={[styles.favoriteButton, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}
        onPress={() => handleFavoritePress(item)}
      >
        <Heart
          color={isFavorite(item.id) ? Colors.primary : Colors.textLight}
          fill={isFavorite(item.id) ? Colors.primary : "transparent"}
          size={20}
        />
      </TouchableOpacity>
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.locationRow}>
          <MapPin color={Colors.textLight} size={14} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.location}, {item.lga}
          </Text>
        </View>
        <View style={styles.propertyDetails}>
          <Text style={styles.detailText}>
            {item.bedrooms} bed • {item.bathrooms} bath • {item.guests} guests
          </Text>
        </View>
        <View style={styles.propertyFooter}>
          <View style={styles.ratingRow}>
            <Star color={Colors.accent} fill={Colors.accent} size={14} />
            <Text style={styles.ratingText}>
              {getAverageRating((item as any).reviews)}
            </Text>
            <Text style={styles.reviewCount}>
              ({(item as any).reviews?.length || 0})
            </Text>
          </View>
          <Text style={styles.price}>
            ₦{Number(item.price).toLocaleString()}/night
          </Text>
        </View>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const numColumns = width >= 900 ? 3 : (width >= 600 ? 2 : 1);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ResponsiveView maxWidth={1200}>
        <View style={styles.searchSection}>
          <Card style={styles.searchBar}>
            <Search color={themeColors.textLight} size={width >= 600 ? 22 : 20} />
            <TextInput
              style={[styles.searchInput, { fontSize: width >= 600 ? 16 : 15 }]}
              placeholder="Search properties..."
              placeholderTextColor={Colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X color={themeColors.textLight} size={20} />
              </TouchableOpacity>
            )}
          </Card>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: themeColors.card }]}
            onPress={() => setShowFilters(true)}
          >
            <SlidersHorizontal color={Colors.primary} size={width >= 600 ? 22 : 20} />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {activeFiltersCount > 0 && (
          <View style={styles.activeFilters}>
            <Text style={styles.activeFiltersText}>
              {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""}{" "}
              active
            </Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFilters}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          key={numColumns}
          data={filteredProperties}
          renderItem={renderProperty}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.itemsGrid : null}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 + insets.bottom }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No properties found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your filters or search query
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </ResponsiveView>

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X color={themeColors.text} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Local Government Area</Text>
                <TouchableOpacity
                  style={[styles.dropdownButton, { backgroundColor: themeColors.background }]}
                  onPress={() => setShowLGADropdown(true)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {selectedLGA || "All LGAs"}
                  </Text>
                  <Text style={[styles.dropdownArrow, { color: themeColors.textLight }]}>▼</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Price Range (₦/night)</Text>
                <View style={styles.priceInputs}>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.priceInputLabel}>Min</Text>
                    <TextInput
                      style={[styles.priceInput, { backgroundColor: themeColors.background, color: themeColors.text }]}
                      placeholder="0"
                      placeholderTextColor={themeColors.textLight}
                      keyboardType="numeric"
                      value={minPrice}
                      onChangeText={setMinPrice}
                    />
                  </View>
                  <Text style={styles.priceSeparator}>-</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.priceInputLabel}>Max</Text>
                    <TextInput
                      style={[styles.priceInput, { backgroundColor: themeColors.background, color: themeColors.text }]}
                      placeholder="100000"
                      placeholderTextColor={themeColors.textLight}
                      keyboardType="numeric"
                      value={maxPrice}
                      onChangeText={setMaxPrice}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  clearFilters();
                  setShowFilters(false);
                }}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </Modal>

      <Modal
        visible={showLGADropdown}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLGADropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.dropdownContent}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.modalTitle}>Select LGA</Text>
              <TouchableOpacity onPress={() => setShowLGADropdown(false)}>
                <X color={themeColors.text} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList}>
              <TouchableOpacity
                style={[
                  styles.dropdownItem,
                  !selectedLGA && styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  setSelectedLGA("");
                  setShowLGADropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    !selectedLGA && styles.dropdownItemTextSelected,
                  ]}
                >
                  All LGAs
                </Text>
              </TouchableOpacity>
              {KANO_LGAS.map((lga) => (
                <TouchableOpacity
                  key={lga}
                  style={[
                    styles.dropdownItem,
                    selectedLGA === lga && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedLGA(lga);
                    setShowLGADropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedLGA === lga && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {lga}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (themeColors: any, width: number, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  searchSection: {
    flexDirection: "row",
    paddingHorizontal: width >= 600 ? 40 : 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: width >= 600 ? 12 : 10,
    borderRadius: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    color: themeColors.text,
  },
  filterButton: {
    width: width >= 600 ? 52 : 44,
    height: width >= 600 ? 52 : 44,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  filterBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: themeColors.card,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: "bold",
  },
  activeFilters: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: width >= 600 ? 40 : 20,
    paddingBottom: 12,
  },
  activeFiltersText: {
    fontSize: 14,
    color: themeColors.text,
  },
  clearFilters: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: width >= 600 ? 40 : 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  itemsGrid: {
    justifyContent: 'flex-start',
    gap: 16,
  },
  propertyCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  propertyImage: {
    width: "100%",
    height: 200,
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 20,
    padding: 8,
  },
  propertyInfo: {
    padding: 12,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.text,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  propertyDetails: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#64748b',
  },
  propertyFooter: {
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
    color: themeColors.text,
  },
  reviewCount: {
    fontSize: 12,
    color: '#64748b',
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: themeColors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
    alignItems: 'center',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    width: '100%',
    maxWidth: 600,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: themeColors.text,
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.text,
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: themeColors.text,
  },
  dropdownArrow: {
    fontSize: 12,
  },
  dropdownContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
    width: '100%',
    maxWidth: 600,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  dropdownList: {
    maxHeight: "100%",
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  dropdownItemSelected: {
    backgroundColor: `${Colors.primary}10`,
  },
  dropdownItemText: {
    fontSize: 16,
    color: themeColors.text,
  },
  dropdownItemTextSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },
  priceInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  priceInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  priceSeparator: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 20,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: '#fff',
  },
});

