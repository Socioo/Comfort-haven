import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
  Platform,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { useVideoPlayer, VideoView } from 'expo-video';
import { StatusBar } from 'expo-status-bar';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import {
  MapPin,
  Star,
  Heart,
  Wifi,
  Wind,
  Car,
  Tv,
  MessageCircle,
  Maximize2,
  X,
} from "lucide-react-native";
import { Text, View as ThemedView, Card } from "@/components/Themed";
import { Modal } from "react-native";
import ReviewModal from "@/components/ReviewModal";
import Colors from "@/constants/Colors";
import { useTheme } from "@/contexts/theme";
import { useAuth } from "@/contexts/auth";
import { useFavorites } from "@/contexts/favorites";
import * as Haptics from "expo-haptics";
import { API_BASE_URL, propertiesAPI, reviewsAPI } from "@/services/api";
import { Property, Review } from "@/types";
import UserAvatar from "@/components/UserAvatar";
import { ResponsiveView } from "@/components/ResponsiveView";

const getMediaUrl = (url: string | undefined | null) => {
  if (!url) return undefined;
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const isVideo = (url: string) => {
  const videoExtensions = ['.mp4', '.mov', '.wmv', '.avi', '.mkv', '.webm'];
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const VideoItem = ({ url, isFullscreen = false, width }: { url: string; isFullscreen?: boolean; width: number }) => {
  const player = useVideoPlayer(url, (player) => {
    player.loop = true;
    player.muted = !isFullscreen;
    player.play();
  });

  return (
    <VideoView
      style={isFullscreen ? { flex: 1 } : { width, height: 300 }}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
};

export default function PropertyDetailsScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 600;
  const contentWidth = isTablet ? 800 : width;

  const [property, setProperty] = useState<Property | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [isFullscreenMediaVisible, setIsFullscreenMediaVisible] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  // Fullscreen swipe state
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const closeFullscreen = () => {
    setIsFullscreenMediaVisible(false);
    translateY.value = 0;
    opacity.value = 1;
  };

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        opacity.value = interpolate(
          event.translationY,
          [0, 300],
          [1, 0.5],
          Extrapolation.CLAMP
        );
      }
    })
    .onEnd((event) => {
      if (event.translationY > 150 || event.velocityY > 1000) {
        translateY.value = withSpring(SCREEN_HEIGHT, { velocity: event.velocityY }, () => {
          runOnJS(closeFullscreen)();
        });
      } else {
        translateY.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    backgroundColor: 'black',
    opacity: opacity.value,
  }));
  
  const navigation = useNavigation();
  const styles = createStyles(themeColors, width, contentWidth);



  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [propertyResponse, reviewsResponse] = await Promise.all([
        propertiesAPI.getById(id),
        reviewsAPI.getByProperty(id),
      ]);
      setProperty(propertyResponse.data);
      const propertyData = propertyResponse.data;
      if (propertyData.reviews) {
        setReviews(propertyData.reviews);
      } else {
        setReviews(reviewsResponse.data);
      }
    } catch (err) {
      console.error("Error loading property data:", err);
      setError("Failed to load property details");
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

  if (error || !property) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "Property not found"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleFavoritePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!user) {
      router.push("/auth/login" as any);
      return;
    }
    toggleFavorite(property.id);
  };

  const handleBookPress = () => {
    if (!user) {
      router.push("/auth/login" as any);
      return;
    }
    router.push(`/booking/${property.id}?price=${property.price}` as any);
  };

  const handleDirectionsPress = () => {
    const query = encodeURIComponent(property.address || property.location);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url);
  };

  const amenityIcons: Record<string, any> = {
    WiFi: Wifi,
    AC: Wind,
    Parking: Car,
    TV: Tv,
  };

  const images =
    property.images && property.images.length > 0
      ? property.images
      : ["https://placehold.co/600x400"];

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "New";

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveView maxWidth={800}>
        <View style={styles.imageCarouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageCarousel}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / contentWidth);
              setSelectedMediaIndex(index);
            }}
          >
            {images.map((media, index) => (
              <TouchableOpacity 
                key={index} 
                activeOpacity={0.9} 
                onPress={() => {
                  setSelectedMediaIndex(index);
                  setIsFullscreenMediaVisible(true);
                }}
              >
                {isVideo(media) ? (
                  <VideoItem url={getMediaUrl(media)!} width={contentWidth} />
                ) : (
                  <Image
                    source={{ uri: getMediaUrl(media) }}
                    style={styles.propertyImage}
                    contentFit="cover"
                  />
                )}
                {isVideo(media) && (
                  <View style={styles.videoOverlay}>
                    <Maximize2 color="#FFFFFF" size={24} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          {images.length > 1 && (
            <View style={styles.paginationDots}>
              {images.map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.dot, 
                    selectedMediaIndex === i ? styles.activeDot : null
                  ]} 
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.headerSection}>
            <View style={styles.headerContent}>
              <ThemedView>
                <ThemedView style={{ backgroundColor: 'transparent' }}>
                  <Text style={styles.title}>{property.title}</Text>
                </ThemedView>
                <View style={styles.locationRow}>
                  <MapPin color={themeColors.textLight} size={16} />
                  <ThemedView style={{ backgroundColor: 'transparent' }}>
                    <Text style={styles.locationText}>
                      {property.location}, {property.lga}
                    </Text>
                  </ThemedView>
                </View>
              </ThemedView>
              {property.address && (
                <TouchableOpacity style={styles.addressRow} onPress={handleDirectionsPress}>
                  <Text style={styles.addressText}>{property.address}</Text>
                  <Text style={styles.directionsLink}>Get Directions</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.favoriteButton, { backgroundColor: themeColors.card }]}
              onPress={handleFavoritePress}
            >
              <Heart
                color={
                  isFavorite(property.id) ? Colors.primary : themeColors.textLight
                }
                fill={isFavorite(property.id) ? Colors.primary : "transparent"}
                size={24}
              />
            </TouchableOpacity>
          </View>

          <Card style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{property.bedrooms || 0}</Text>
              <Text style={styles.statLabel}>Bedrooms</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{property.bathrooms || 0}</Text>
              <Text style={styles.statLabel}>Bathrooms</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{property.guests || 0}</Text>
              <Text style={styles.statLabel}>Guests</Text>
            </View>
          </Card>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {property.amenities &&
                property.amenities.map((amenity, index) => {
                  const IconComponent = amenityIcons[amenity];
                  return (
                    <Card key={index} style={styles.amenityItem}>
                      {IconComponent ? (
                        <IconComponent color={Colors.primary} size={20} />
                      ) : (
                        <Text style={styles.amenityDot}>•</Text>
                      )}
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </Card>
                  );
                })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Host</Text>
            <View style={[styles.hostCard, { backgroundColor: themeColors.card }]}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const hostId = property.ownerId || (property as any).owner?.id || property.hostId;
                  if (hostId) router.push(`/host/${hostId}` as any);
                }}
                activeOpacity={0.7}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
              >
                <UserAvatar 
                  name={(property as any).owner?.name || property.hostName || "Host"} 
                  image={(property as any).owner?.profileImage || property.hostPhoto} 
                  size={50} 
                  style={styles.hostAvatar}
                />
                <View style={styles.hostInfo}>
                  <Text style={styles.hostName}>
                    {(property as any).owner?.name || property.hostName || "Host"}
                  </Text>
                  <Text style={styles.hostLabel}>
                    Property Host • Tap to view
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  if (user) {
                    router.push({
                      pathname: "/messages/[userId]",
                      params: { userId: (property as any).owner?.id || property.hostId }
                    });
                  } else {
                    router.push("/auth/login");
                  }
                }}
                style={styles.actionIcon}
              >
                <MessageCircle color={Colors.primary} size={22} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.addReviewButton}
              onPress={() => {
                if (!user) {
                  router.push("/auth/login" as any);
                  return;
                }
                setIsReviewModalVisible(true);
              }}
            >
              <Star color={Colors.primary} size={20} />
              <Text style={styles.addReviewText}>Write a Review</Text>
            </TouchableOpacity>

            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <View style={styles.ratingBadge}>
                <Star color={Colors.accent} fill={Colors.accent} size={16} />
                <Text style={styles.ratingValue}>{averageRating}</Text>
                <Text style={styles.reviewCount}>({reviews.length})</Text>
              </View>
            </View>

            {reviews.length > 0 ? (
              <View style={styles.reviewsList}>
                {reviews.map((review) => (
                  <Card key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <UserAvatar 
                        name={review.userName || "User"} 
                        image={review.userPhoto || (review as any).user?.profileImage} 
                        size={40} 
                        style={styles.reviewAvatar}
                      />
                      <ThemedView style={[styles.reviewHeaderContent, { backgroundColor: 'transparent' }]}>
                        <Text style={styles.reviewerName}>
                          {review.userName || "User"}
                        </Text>
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
                      </ThemedView>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </Card>
                ))}
              </View>
            ) : (
              <Text style={styles.noReviews}>No reviews yet</Text>
            )}
          </View>
        </View>
        </ResponsiveView>
      </ScrollView>

      <View style={styles.footer}>
        <ResponsiveView maxWidth={800} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>
            ₦{Number(property.price).toLocaleString()}/night
          </Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookPress}>
          <Text style={[styles.bookButtonText, { color: '#FFFFFF' }]}>Book Now</Text>
        </TouchableOpacity>
        </ResponsiveView>
      </View>

      <ReviewModal 
        visible={isReviewModalVisible}
        onClose={() => setIsReviewModalVisible(false)}
        propertyId={id!}
        onSuccess={loadData}
      />

      <Modal
        visible={isFullscreenMediaVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullscreen}
      >
        <StatusBar style="light" />
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]} />
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.fullscreenContainer, animatedStyle]}>
          <TouchableOpacity 
            style={styles.fullscreenCloseButton}
            onPress={closeFullscreen}
          >
            <X color="#FFFFFF" size={30} />
          </TouchableOpacity>
          <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: selectedMediaIndex * width, y: 0 }}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setSelectedMediaIndex(index);
              }}
            >
              {images.map((media, index) => (
                <View key={index} style={styles.fullscreenMediaWrapper}>
                  {isVideo(media) ? (
                    <VideoItem url={getMediaUrl(media)!} isFullscreen={true} width={width} />
                  ) : (
                    <Image
                      source={{ uri: getMediaUrl(media) }}
                      style={styles.fullscreenImage}
                      contentFit="contain"
                    />
                  )}
                </View>
              ))}
            </ScrollView>
            
            <ThemedView style={styles.fullscreenPagination}>
              <Text style={styles.fullscreenPaginationText}>
                {selectedMediaIndex + 1} / {images.length}
              </Text>
            </ThemedView>
          </Animated.View>
        </GestureDetector>
      </Modal>
    </View>
  );
}

const createStyles = (themeColors: any, screenWidth: number, contentWidth: number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  imageCarouselContainer: {
    position: 'relative',
    height: 300,
  },
  imageCarousel: {
    height: 300,
  },
  propertyImage: {
    width: contentWidth,
    height: 300,
  },
  videoOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  paginationDots: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullscreenMediaWrapper: {
    width: screenWidth,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  fullscreenPagination: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fullscreenPaginationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingBottom: 100,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 4,
  },
  addressRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontSize: 14,
    color: themeColors.textLight,
  },
  directionsLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  favoriteButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.text,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
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
    color: themeColors.text,
  },
  hostCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  hostAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  hostInfo: {
    flex: 1,
    marginLeft: 12,
  },
  hostName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  hostLabel: {
    fontSize: 14,
    color: themeColors.textLight,
  },
  actionIcon: {
    padding: 8,
  },
  addReviewButton: {
    backgroundColor: themeColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: 20,
    gap: 8,
  },
  addReviewText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  reviewCount: {
    fontSize: 14,
    color: themeColors.textLight,
  },
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewHeaderContent: {
    marginLeft: 12,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  reviewRatingRow: {
    flexDirection: "row",
    gap: 2,
  },
  reviewComment: {
    fontSize: 15,
    lineHeight: 22,
    color: themeColors.text,
  },
  noReviews: {
    fontSize: 16,
    color: themeColors.textLight,
    textAlign: "center",
    paddingVertical: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "transparent",
    gap: 16,
  },
  priceSection: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  priceLabel: {
    fontSize: 14,
    color: themeColors.textLight,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 18,
    color: themeColors.textLight,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
