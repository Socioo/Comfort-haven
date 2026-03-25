import React, { useState, useEffect, useCallback, useLayoutEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect, useNavigation } from "expo-router";
import { useAuth } from "@/contexts/auth";
import { useTheme } from "@/contexts/theme";
import Colors from "@/constants/Colors";
import { Text, View } from "@/components/Themed";
import {
  Calendar as CalendarIcon,
  Clock,
  User as GuestIcon,
  CircleCheck,
  CircleX,
  History,
  MessageSquare,
  ChevronLeft,
} from "lucide-react-native";
import { bookingsAPI } from "@/services/api";

export default function HostBookingRequestsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  
  const styles = createStyles(themeColors);
  
  // Hide parent tab header when this screen is open
  useLayoutEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({ headerShown: false });
    }
    return () => {
      if (parent) {
        parent.setOptions({ headerShown: true });
      }
    };
  }, [navigation]);

  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBookings = useCallback(async (refresh = false) => {
    if (!user) return;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await bookingsAPI.getHostBookings(user.id);
      setBookings(response.data);
    } catch (error) {
      console.error("Error fetching host bookings:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
      case "completed":
        return Colors.success;
      case "cancelled":
      case "failed":
        return Colors.error;
      case "pending":
        return Colors.warning;
      default:
        return themeColors.textLight;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
      case "completed":
        return <CircleCheck size={14} color={Colors.success} />;
      case "cancelled":
      case "failed":
        return <CircleX size={14} color={Colors.error} />;
      default:
        return <Clock size={14} color={Colors.warning} />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft color={themeColors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Requests</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchBookings(true)} />
        }
      >
        {isLoading && !isRefreshing ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <History size={64} color={themeColors.textLight} strokeWidth={1} />
            <Text style={styles.emptyTitle}>No booking requests</Text>
            <Text style={styles.emptySubtitle}>
              When guests book your properties, they'll appear here.
            </Text>
          </View>
        ) : (
          bookings.map((booking) => (
            <TouchableOpacity 
              key={booking.id} 
              style={styles.bookingCard}
              onPress={() => router.push(`/booking/${booking.id}` as any)}
            >
              <View style={styles.cardHeader}>
                <View style={{flex: 1}}>
                  <Text style={styles.propertyName} numberOfLines={1}>
                    {booking.property?.title || "Property Title"}
                  </Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '15' }]}>
                      {getStatusIcon(booking.status)}
                      <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                        {booking.status?.toUpperCase() || "PENDING"}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.priceText}>\u20A6{(Number(booking.totalPrice) || 0).toLocaleString()}</Text>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <GuestIcon size={16} color={themeColors.textLight} />
                  <Text style={styles.infoText}>
                    Guest: {booking.guest?.name || (booking.guest?.firstName ? `${booking.guest.firstName} ${booking.guest.lastName}` : "Anonymous")}
                  </Text>
                </View>
                
                <View style={styles.dateRow}>
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateLabel}>CHECK-IN</Text>
                    <Text style={styles.dateValue}>{formatDate(booking.startDate)}</Text>
                  </View>
                  <View style={styles.dateDivider} />
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateLabel}>CHECK-OUT</Text>
                    <Text style={styles.dateValue}>{formatDate(booking.endDate)}</Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push(`/messages/${booking.guestId}` as any)}
                  >
                    <MessageSquare size={16} color={Colors.primary} />
                    <Text style={styles.actionButtonText}>Message Guest</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: themeColors.card,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
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
  },
  emptySubtitle: {
    fontSize: 14,
    color: themeColors.textLight,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  bookingCard: {
    backgroundColor: themeColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.primary,
  },
  cardContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: themeColors.textLight,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.background,
    padding: 12,
    borderRadius: 12,
    justifyContent: "space-between",
  },
  dateBlock: {
    alignItems: "center",
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    color: themeColors.textLight,
    marginBottom: 2,
    fontWeight: "600",
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  dateDivider: {
    width: 1,
    height: 24,
    backgroundColor: themeColors.border,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
});
