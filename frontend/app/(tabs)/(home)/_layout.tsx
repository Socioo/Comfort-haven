import React from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { Text, View } from '@/components/Themed';
import { Heart, MapPin, Search, Star } from 'lucide-react-native';
import { mockProperties } from '@/mocks/properties';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { useFavorites } from '@/contexts/favorites';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function TabOneScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();

  const featuredProperties = mockProperties.slice(0, 6);

  const handlePropertyPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/property/[id]', params: { id } });
  };

  const handleFavoritePress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!user) {
      router.push(`/auth/login`);
      return;
    }
    toggleFavorite(id);
  };

  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
      >
        <View style={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Hello{user ? `, ${user.name.split(' ')[0]}` : ''}! 👋</Text>
              <Text style={styles.subtitle}>Find your perfect stay in Kano</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('../explore')}
        >
          <Search color={Colors.textLight} size={20} />
          <Text style={styles.searchPlaceholder}>Search location, LGA...</Text>
        </TouchableOpacity>   

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Properties</Text>
            <TouchableOpacity 
            onPress={() => router.push('../explore')}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          >
            {featuredProperties.map((property) => (
              <Pressable
                key={property.id}
                style={styles.featuredCard}
                onPress={() => handlePropertyPress(property.id)}
              >
                <Image
                  source={{ uri: property.images[0] }}
                  style={styles.featuredImage}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => handleFavoritePress(property.id)}
                >
                  <Heart 
                    color={isFavorite(property.id) ? Colors.primary : Colors.card}
                    fill={isFavorite(property.id) ? Colors.primary : 'transparent'}
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
                      <Star color={Colors.accent} fill={Colors.accent} size={14} />
                      <Text style={styles.ratingText}>{property.rating}</Text>
                      <Text style={styles.reviewCount}>({property.reviewCount})</Text>
                    </View>
                    <Text style={styles.price}>₦{property.price.toLocaleString()}/night</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Locations</Text>
          <View style={styles.locationsGrid}>
            {['Nassarawa', 'Gwale', 'Kano Municipal', 'Fagge'].map((location) => (
              <TouchableOpacity
                key={location}
                style={styles.locationCard}
                onPress={() => router.push(`../explore?location=${location}`)}
              >
                <MapPin color={Colors.primary} size={20} />
                <Text style={styles.locationName}>{location}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: Colors.textLight,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  featuredList: {
    paddingRight: 20,
    gap: 16,
  },
  featuredCard: {
    width: width * 0.7,
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  featuredImage: {
    width: '100%',
    height: 200,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
  featuredInfo: {
    padding: 12,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textLight,
    flex: 1,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.textLight,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  locationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
});