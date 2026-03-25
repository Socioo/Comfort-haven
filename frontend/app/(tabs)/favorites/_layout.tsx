import React from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Colors from "@/constants/Colors";
import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View, Card } from "@/components/Themed";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/theme";
import { useAuth } from "@/contexts/auth";
import { useFavorites } from "@/contexts/favorites";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Heart, MapPin, Star } from "lucide-react-native";
import { Property } from "@/types";

export default function FavoritesScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { favoriteProperties, toggleFavorite, loadFavorites } = useFavorites();
  const [refreshing, setRefreshing] = React.useState(false);

  const handlePropertyPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/property/${id}` as any);
  };

  const handleFavoritePress = (property: Property) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite(property.id, property);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  }, [loadFavorites]);

  const renderProperty = ({ item }: { item: any }) => (
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
        <Heart color={Colors.primary} fill={Colors.primary} size={20} />
      </TouchableOpacity>
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.locationRow}>
          <MapPin color={themeColors.textLight} size={14} />
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
            <Text style={styles.ratingText}>{item.rating}</Text>
            <Text style={styles.reviewCount}>({item.reviewCount})</Text>
          </View>
          <Text style={styles.price}>
            ₦{Number(item.price).toLocaleString()}/night
          </Text>
        </View>
      </View>
    </Pressable>
  );

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Heart color={themeColors.textLight} size={64} />
        <Text style={styles.emptyTitle}>Sign in to save favorites</Text>
        <Text style={styles.emptyText}>
          Create an account to save properties you love
        </Text>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => router.push("/auth/login" as any)}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (favoriteProperties.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Heart color={themeColors.textLight} size={64} />
        <Text style={styles.emptyTitle}>No favorites yet</Text>
        <Text style={styles.emptyText}>
          Start exploring and save your favorite properties
        </Text>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => router.push("/explore" as any)}
        >
          <Text style={styles.exploreButtonText}>Explore Properties</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favoriteProperties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  propertyCard: {
    borderRadius: 16,
    overflow: "hidden" as const,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  propertyImage: {
    width: "100%",
    height: 200,
  },
  favoriteButton: {
    position: "absolute" as const,
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
    fontWeight: "600" as const,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
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
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  ratingRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.textLight,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold" as const,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: "center" as const,
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  signInButtonText: {
    color: Colors.card,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  exploreButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: Colors.card,
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
