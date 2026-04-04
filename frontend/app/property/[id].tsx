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
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
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
  
  // Safe: uses optional chaining on all nullable values
  const isHost = !!(user && property && (
    property.ownerId === user.id || 
    property.hostId === user.id || 
    (property as any)?.owner?.id === user.id
  ));



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
    if (isHost) {
      router.push(`/property/edit/${property.id}` as any);
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

  const carouselHeight = isTablet ? 450 : 300;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveView maxWidth={900}>
        <View style={[styles.imageCarouselContainer, { height: carouselHeight }]}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={[styles.imageCarousel, { height: carouselHeight }]}
            onMomentumScrollEnd={(e) => {
              const carouselWidth = width >= 900 ? 900 : width;
              const index = Math.round(e.nativeEvent.contentOffset.x / carouselWidth);
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
                  <VideoItem url={getMediaUrl(media)!} width={width >= 900 ? 900 : width} />
                ) : (
                  <Image
                    source={{ uri: getMediaUrl(media) }}
                    style={[styles.propertyImage, { height: carouselHeight, width: width >= 900 ? 900 : width }]}
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
              <Text style={styles.title}>{property.title}</Text>
              <View style={styles.locationRow}>
                <MapPin color={themeColors.textLight} size={16} />
                <Text style={styles.locationText}>
                  {property.location}, {property.lga}
                </Text>
              </View>
              {property.address && (
                <TouchableOpacity style={styles.addressRow} onPress={handleDirectionsPress}>
                  <Text style={styles.addressText}>{property.address}</Text>
                  <Text style={styles.directionsLink}>Get Directions</Text>
                </TouchableOpacity>
              )}
            </View>
            {!isHost && (
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
            )}
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

          {/* Only show Host section to guests, not to the host themselves */}
          {user?.id !== (property.ownerId || property.hostId) && (
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
                  size={width >= 600 ? 60 : 50} 
                  style={styles.hostAvatar}
                />
                <View style={styles.hostInfo}>
                  <Text style={[styles.hostName, { fontSize: width >= 600 ? 18 : 16 }]}>
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
                <MessageCircle color={Colors.primary} size={width >= 600 ? 28 : 22} />
              </TouchableOpacity>
            </View>
          </View>
          )}


          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <View style={styles.ratingBadge}>
                <Star color={Colors.accent} fill={Colors.accent} size={16} />
                <Text style={styles.ratingValue}>{averageRating}</Text>
                <Text style={styles.reviewCountLabel}>({reviews.length})</Text>
              </View>
            </View>
            
            {!isHost && (
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
            )}

            {reviews.length > 0 ? (
              <View style={isTablet ? styles.reviewsGrid : styles.reviewsList}>
                {reviews.map((review) => (
                  <Card key={review.id} style={[styles.reviewCard, isTablet && { width: '48%' }]}>
                    <View style={styles.reviewHeader}>
                      <UserAvatar 
                        name={review.userName || "User"} 
                        image={review.userPhoto || (review as any).user?.profileImage} 
                        size={40} 
                        style={styles.reviewAvatar}
                      />
                      <View style={[styles.reviewHeaderContent, { backgroundColor: 'transparent' }]}>
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
                      </View>
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

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 15) }]}>
        <ResponsiveView maxWidth={900} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceValue}>
              ₦{Number(property.price).toLocaleString()}
              <Text style={styles.perNight}>/night</Text>
            </Text>
          </View>
          <TouchableOpacity style={styles.bookButton} onPress={handleBookPress}>
            <Text style={styles.bookButtonText}>{isHost ? "Edit Property" : "Book Now"}</Text>
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
            
            <View style={styles.fullscreenPagination}>
              <Text style={styles.fullscreenPaginationText}>
                {selectedMediaIndex + 1} / {images.length}
              </Text>
            </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  imageCarouselContainer: {
    position: 'relative',
  },
  imageCarousel: {
  },
  propertyImage: {
    width: contentWidth,
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 14,
  },
  fullscreenContainer: {
    flex: 1,
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
    paddingBottom: 120,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: screenWidth >= 600 ? 32 : 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: themeColors.text,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    marginLeft: 6,
    color: '#64748b'
  },
  addressRow: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#64748b',
  },
  directionsLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  favoriteButton: {
    padding: 10,
    borderRadius: 24,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  statDivider: {
    width: 1,
    height: '60%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: themeColors.text,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: '#475569',
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  amenityDot: {
    fontSize: 20,
    color: Colors.primary,
  },
  amenityText: {
    fontSize: 14,
    fontWeight: '500',
    color: themeColors.text,
  },
  hostCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  hostAvatar: {
    borderRadius: 30,
  },
  hostInfo: {
    flex: 1,
    marginLeft: 14,
  },
  hostName: {
    fontWeight: "bold",
    marginBottom: 4,
    color: themeColors.text,
  },
  hostLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  actionIcon: {
    padding: 10,
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 20,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewCountLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: 24,
    gap: 8,
  },
  addReviewText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  reviewsList: {
    gap: 16,
  },
  reviewsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewAvatar: {
    borderRadius: 20,
  },
  reviewHeaderContent: {
    marginLeft: 12,
    flex: 1,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: "bold",
    color: themeColors.text,
    marginBottom: 2,
  },
  reviewRatingRow: {
    flexDirection: "row",
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  noReviews: {
    color: themeColors.textLight,
    textAlign: "center",
    paddingVertical: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: themeColors.card,
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
    alignItems: 'center',
  },
  priceSection: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary,
  },
  perNight: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: 'normal',
  },
  bookButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: "bold",
  },
});

