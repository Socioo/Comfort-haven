import React, { useEffect } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Colors from "@/constants/Colors";
import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View, Card } from "@/components/Themed";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useTheme } from "@/contexts/theme";
import { useAuth } from "@/contexts/auth";
import { useFavorites } from "@/contexts/favorites";
import { useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Heart } from "lucide-react-native/icons";
import {
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react-native";
import { KANO_LGAS } from "@/constants/locations";
import { propertiesAPI } from "@/services/api";
import { Property } from "@/types";

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const navigation = useNavigation();
  const styles = createStyles(themeColors);
  const { toggleFavorite, isFavorite } = useFavorites();

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
      style={[styles.propertyCard, { backgroundColor: themeColors.card }]}
      onPress={() => handlePropertyPress(item.id)}
    >
      <Image
        source={{
          uri:
            item.images && item.images.length > 0
              ? item.images[0]
              : "https://placehold.co/600x400",
        }}
        style={styles.propertyImage}
        contentFit="cover"
      />
      <TouchableOpacity
        style={[styles.favoriteButton, { backgroundColor: themeColors.overlay }]}
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

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.searchSection}>
        <Card style={styles.searchBar}>
          <Search color={themeColors.textLight} size={20} />
          <TextInput
            style={styles.searchInput}
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
          <SlidersHorizontal color={Colors.primary} size={20} />
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
        data={filteredProperties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No properties found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your filters or search query
            </Text>
          </View>
        }
      />

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

            <View style={styles.modalFooter}>
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

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },

  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  searchSection: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: themeColors.text,
  },
  filterButton: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  activeFilters: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
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
    padding: 20,
    gap: 16,
  },
  propertyCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    borderWidth: 1,
    borderColor: themeColors.border,
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
    color: themeColors.textLight,
    flex: 1,
  },
  propertyDetails: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: themeColors.textLight,
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
    color: themeColors.textLight,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: themeColors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: themeColors.textLight,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
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
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: themeColors.text,
  },
  dropdownArrow: {
    fontSize: 12,
    color: themeColors.textLight,
  },
  dropdownContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
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
    backgroundColor: `${Colors.primary}15`,
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
    color: themeColors.textLight,
    marginBottom: 8,
  },
  priceInput: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  priceSeparator: {
    fontSize: 16,
    color: themeColors.textLight,
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
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.card,
  },
});
