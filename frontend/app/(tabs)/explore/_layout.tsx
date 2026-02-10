import React from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { useFavorites } from '@/contexts/favorites';
import { useMemo, useState } from 'react';
import { mockProperties } from '@/mocks/properties';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Heart } from 'lucide-react-native/icons';
import { MapPin, Search, SlidersHorizontal, Star, X } from 'lucide-react-native';
import { KANO_LGAS } from '@/constants/locations';

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLGA, setSelectedLGA] = useState<string>(params.location as string || '');
  const [showFilters, setShowFilters] = useState(false);
  const [showLGADropdown, setShowLGADropdown] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const filteredProperties = useMemo(() => {
    return mockProperties.filter((property) => {
      const matchesSearch = 
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.lga.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLGA = !selectedLGA || property.lga === selectedLGA;
      
      const matchesMinPrice = !minPrice || property.price >= parseInt(minPrice);
      const matchesMaxPrice = !maxPrice || property.price <= parseInt(maxPrice);

      return matchesSearch && matchesLGA && matchesMinPrice && matchesMaxPrice;
    });
  }, [searchQuery, selectedLGA, minPrice, maxPrice]);

  const handlePropertyPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/property/${id}` as any);
  };

  const handleFavoritePress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!user) {
      router.push('/auth/login' as any);
      return;
    }
    toggleFavorite(id);
  };

  const clearFilters = () => {
    setSelectedLGA('');
    setMinPrice('');
    setMaxPrice('');
    setSearchQuery('');
  };

  const activeFiltersCount = [selectedLGA, minPrice, maxPrice].filter(Boolean).length;

  const renderProperty = ({ item }: { item: typeof mockProperties[0] }) => (
    <Pressable
      style={styles.propertyCard}
      onPress={() => handlePropertyPress(item.id)}
    >
      <Image
        source={{ uri: item.images[0] }}
        style={styles.propertyImage}
        contentFit="cover"
      />
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => handleFavoritePress(item.id)}
      >
        <Heart
          color={isFavorite(item.id) ? Colors.primary : Colors.card}
          fill={isFavorite(item.id) ? Colors.primary : 'transparent'}
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
          <Text style={styles.detailText}>{item.bedrooms} bed • {item.bathrooms} bath • {item.guests} guests</Text>
        </View>
        <View style={styles.propertyFooter}>
          <View style={styles.ratingRow}>
            <Star color={Colors.accent} fill={Colors.accent} size={14} />
            <Text style={styles.ratingText}>{item.rating}</Text>
            <Text style={styles.reviewCount}>({item.reviewCount})</Text>
          </View>
          <Text style={styles.price}>₦{item.price.toLocaleString()}/night</Text>
        </View>
      </View>
    </Pressable>
  );


  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search color={Colors.textLight} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color={Colors.textLight} size={20} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
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
            {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
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
            <Text style={styles.emptyText}>Try adjusting your filters or search query</Text>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Local Government Area</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowLGADropdown(true)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {selectedLGA || 'All LGAs'}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Price Range (₦/night)</Text>
                <View style={styles.priceInputs}>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.priceInputLabel}>Min</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="0"
                      placeholderTextColor={Colors.textLight}
                      keyboardType="numeric"
                      value={minPrice}
                      onChangeText={setMinPrice}
                    />
                  </View>
                  <Text style={styles.priceSeparator}>-</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.priceInputLabel}>Max</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="100000"
                      placeholderTextColor={Colors.textLight}
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
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLGADropdown}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLGADropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dropdownContent}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.modalTitle}>Select LGA</Text>
              <TouchableOpacity onPress={() => setShowLGADropdown(false)}>
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList}>
              <TouchableOpacity
                style={[styles.dropdownItem, !selectedLGA && styles.dropdownItemSelected]}
                onPress={() => {
                  setSelectedLGA('');
                  setShowLGADropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, !selectedLGA && styles.dropdownItemTextSelected]}>
                  All LGAs
                </Text>
              </TouchableOpacity>
              {KANO_LGAS.map((lga) => (
                <TouchableOpacity
                  key={lga}
                  style={[styles.dropdownItem, selectedLGA === lga && styles.dropdownItemSelected]}
                  onPress={() => {
                    setSelectedLGA(lga);
                    setShowLGADropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, selectedLGA === lga && styles.dropdownItemTextSelected]}>
                    {lga}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchSection: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filterButton: {
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative' as const,
  },
  filterBadge: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: Colors.card,
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  activeFilters: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  activeFiltersText: {
    fontSize: 14,
    color: Colors.text,
  },
  clearFilters: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  propertyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden' as const,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  propertyImage: {
    width: '100%',
    height: 200,
  },
  favoriteButton: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
  propertyInfo: {
    padding: 12,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textLight,
    flex: 1,
  },
  propertyDetails: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: Colors.textLight,
  },
  propertyFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  ratingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.textLight,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  dropdownArrow: {
    fontSize: 12,
    color: Colors.textLight,
  },
  dropdownContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  dropdownHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownList: {
    maxHeight: '100%',
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: `${Colors.primary}15`,
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  dropdownItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  priceInputs: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  priceInput: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceSeparator: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 20,
  },
  modalFooter: {
    flexDirection: 'row' as const,
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center' as const,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.card,
  },
});