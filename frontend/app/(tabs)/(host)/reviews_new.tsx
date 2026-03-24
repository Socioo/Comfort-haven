import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  View,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/auth";
import Colors from "@/constants/Colors";
import { Text } from "@/components/Themed";
import {
  Star,
  MessageSquare,
  Building,
  User as UserIcon,
  Search,
} from "lucide-react-native";
import { propertiesAPI } from "@/services/api";

export default function HostReviewsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchReviews = useCallback(async (refresh = false) => {
    if (!user) return;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await propertiesAPI.getByHost(user.id);
      const properties = response.data;
      
      const allReviews = properties.reduce((acc: any[], property: any) => {
        if (property.reviews) {
          const propertyReviews = property.reviews.map((r: any) => ({
            ...r,
            propertyTitle: property.title,
            propertyId: property.id
          }));
          return [...acc, ...propertyReviews];
        }
        return acc;
      }, []);

      allReviews.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setReviews(allReviews);
    } catch (error) {
      console.error("Error fetching host reviews:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchReviews();
    }, [fetchReviews])
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            color={star <= rating ? Colors.warning : Colors.border}
            fill={star <= rating ? Colors.warning : "transparent"}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchReviews(true)} />
        }
      >
        {isLoading && !isRefreshing ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageSquare size={64} color={Colors.textLight} strokeWidth={1} />
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptySubtitle}>
              When guests review your properties, their feedback will appear here.
            </Text>
          </View>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <UserIcon size={20} color={Colors.textLight} />
                  </View>
                  <View>
                    <Text style={styles.userName}>{review.user?.name || "Guest"}</Text>
                    <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
                  </View>
                </View>
                {renderStars(review.rating)}
              </View>

              <Text style={styles.commentText}>{review.comment}</Text>

              <TouchableOpacity 
                style={styles.propertyLink}
                onPress={() => router.push(`/property/${review.propertyId}` as any)}
              >
                <Building size={14} color={Colors.primary} />
                <Text style={styles.propertyTitle} numberOfLines={1}>
                  {review.propertyTitle}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  loader: {
    marginTop: 100,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  reviewCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  commentText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  propertyLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  propertyTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    flex: 1,
  },
});
