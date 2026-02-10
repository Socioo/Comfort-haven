import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  MapPin, 
  Star, 
  Heart, 
  Wifi, 
  Wind, 
  Car, 
  Tv,
  MessageCircle,
} from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { mockProperties, mockReviews } from '@/mocks/properties';
import { useAuth } from '@/contexts/auth';
import { useFavorites } from '@/contexts/favorites';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function PropertyDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();

  const property = mockProperties.find(p => p.id === id);
  const propertyReviews = mockReviews.filter(r => r.propertyId === id);

  if (!property) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Property not found</Text>
      </View>
    );
  }

  const handleFavoritePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!user) {
      router.push('/auth/login' as any);
      return;
    }
    toggleFavorite(property.id);
  };

  const handleBookPress = () => {
    if (!user) {
      router.push('/auth/login' as any);
      return;
    }
    router.push(`/booking/${property.id}` as any);
  };

  const amenityIcons: Record<string, any> = {
    WiFi: Wifi,
    AC: Wind,
    Parking: Car,
    TV: Tv,
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imageCarousel}
        >
          {property.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.propertyImage}
              contentFit="cover"
            />
          ))}
        </ScrollView>

        <View style={styles.content}>
          <View style={styles.headerSection}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>{property.title}</Text>
              <View style={styles.locationRow}>
                <MapPin color={Colors.textLight} size={16} />
                <Text style={styles.locationText}>
                  {property.location}, {property.lga}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleFavoritePress}
            >
              <Heart
                color={isFavorite(property.id) ? Colors.primary : Colors.textLight}
                fill={isFavorite(property.id) ? Colors.primary : 'transparent'}
                size={24}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{property.bedrooms}</Text>
              <Text style={styles.statLabel}>Bedrooms</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{property.bathrooms}</Text>
              <Text style={styles.statLabel}>Bathrooms</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{property.guests}</Text>
              <Text style={styles.statLabel}>Guests</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {property.amenities.map((amenity, index) => {
                const IconComponent = amenityIcons[amenity];
                return (
                  <View key={index} style={styles.amenityItem}>
                    {IconComponent ? (
                      <IconComponent color={Colors.primary} size={20} />
                    ) : (
                      <Text style={styles.amenityDot}>•</Text>
                    )}
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Host</Text>
            <TouchableOpacity 
              style={styles.hostCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/host/${property.hostId}` as any);
              }}
              activeOpacity={0.7}
            >
              {property.hostPhoto ? (
                <Image
                  source={{ uri: property.hostPhoto }}
                  style={styles.hostAvatar}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.hostAvatarPlaceholder}>
                  <Text style={styles.hostInitial}>
                    {property.hostName.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.hostInfo}>
                <Text style={styles.hostName}>{property.hostName}</Text>
                <Text style={styles.hostLabel}>Property Host • Tap to view</Text>
              </View>
              <MessageCircle color={Colors.primary} size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <View style={styles.ratingBadge}>
                <Star color={Colors.accent} fill={Colors.accent} size={16} />
                <Text style={styles.ratingValue}>{property.rating}</Text>
                <Text style={styles.reviewCount}>({property.reviewCount})</Text>
              </View>
            </View>

            {propertyReviews.length > 0 ? (
              <View style={styles.reviewsList}>
                {propertyReviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      {review.userPhoto ? (
                        <Image
                          source={{ uri: review.userPhoto }}
                          style={styles.reviewAvatar}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.reviewAvatarPlaceholder}>
                          <Text style={styles.reviewInitial}>
                            {review.userName.charAt(0)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.reviewHeaderContent}>
                        <Text style={styles.reviewerName}>{review.userName}</Text>
                        <View style={styles.reviewRatingRow}>
                          {[...Array(review.rating)].map((_, i) => (
                            <Star
                              key={i}
                              color={Colors.accent}
                              fill={Colors.accent}
                              size={12}
                            />
                          ))}
                        </View>
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noReviews}>No reviews yet</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>₦{property.price.toLocaleString()}/night</Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookPress}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
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
  imageCarousel: {
    height: 300,
  },
  propertyImage: {
    width,
    height: 300,
  },
  content: {
    paddingBottom: 100,
  },
  headerSection: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    padding: 20,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  locationText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  favoriteButton: {
    padding: 8,
    backgroundColor: Colors.card,
    borderRadius: 20,
    marginLeft: 12,
  },
  statsRow: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  amenitiesGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  amenityDot: {
    fontSize: 20,
    color: Colors.primary,
  },
  amenityText: {
    fontSize: 14,
    color: Colors.text,
  },
  hostCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hostAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  hostAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  hostInitial: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.card,
  },
  hostInfo: {
    flex: 1,
    marginLeft: 12,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  hostLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  reviewsHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  ratingBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  reviewCount: {
    fontSize: 14,
    color: Colors.textLight,
  },
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
  },
  reviewHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  reviewInitial: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.card,
  },
  reviewHeaderContent: {
    marginLeft: 12,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  reviewRatingRow: {
    flexDirection: 'row' as const,
    gap: 2,
  },
  reviewComment: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  noReviews: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 16,
  },
  priceSection: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  bookButtonText: {
    color: Colors.card,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textLight,
  },
});
