import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
} from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth";
import Colors from "@/constants/Colors";
import { Text, View } from "@/components/Themed";
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Filter,
  X,
  Clock,
  User as GuestIcon,
  CircleCheck,
  CircleX,
  History,
} from "lucide-react-native";
import { bookingsAPI } from "@/services/api";
import { Calendar } from "react-native-calendars";

export default function HostBookingsHistoryScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const [markedDates, setMarkedDates] = useState<any>({});

  // Hide parent tab header
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

  const fetchBookings = async (refresh = false) => {
    if (!user) return;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const params: any = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      const response = await bookingsAPI.getHostBookings(user.id, params);
      setBookings(response.data);
    } catch (error) {
      console.error("Error fetching host bookings:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [dateRange]);

  const onDayPress = (day: any) => {
    const dateString = day.dateString;
    
    if (!dateRange.startDate || (dateRange.startDate && dateRange.endDate)) {
      setDateRange({ startDate: dateString });
      setMarkedDates({
        [dateString]: { startingDay: true, color: Colors.primary, textColor: "white" },
      });
    } else {
      if (dateString < dateRange.startDate) {
        setDateRange({ startDate: dateString, endDate: dateRange.startDate });
      } else {
        setDateRange({ ...dateRange, endDate: dateString });
      }
    }
  };

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      const range = getDatesInRange(dateRange.startDate, dateRange.endDate);
      const newMarked: any = {};
      range.forEach((date, index) => {
        newMarked[date] = {
          color: Colors.primary,
          textColor: "white",
          startingDay: index === 0,
          endingDay: index === range.length - 1,
        };
      });
      setMarkedDates(newMarked);
    }
  }, [dateRange]);

  const getDatesInRange = (startDate: string, endDate: string) => {
    const dates = [];
    let curr = new Date(startDate);
    const end = new Date(endDate);
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const clearFilter = () => {
    setDateRange({});
    setMarkedDates({});
    setShowFilter(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "completed":
        return "#4CAF50";
      case "cancelled":
      case "failed":
        return "#F44336";
      case "pending":
        return "#FF9800";
      default:
        return Colors.textLight;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "completed":
        return <CircleCheck size={14} color="#4CAF50" />;
      case "cancelled":
      case "failed":
        return <CircleX size={14} color="#F44336" />;
      default:
        return <Clock size={14} color="#FF9800" />;
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${days} ${days === 1 ? 'night' : 'nights'}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking History</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilter(true)}>
          <Filter color={dateRange.startDate ? Colors.primary : Colors.text} size={20} />
        </TouchableOpacity>
      </View>

      {/* Date Range Summary if filtered */}
      {dateRange.startDate && (
        <View style={styles.filterBar}>
          <CalendarIcon size={14} color={Colors.primary} />
          <Text style={styles.filterText}>
            {formatDate(dateRange.startDate).split(',')[0]} - {dateRange.endDate ? formatDate(dateRange.endDate) : "..."}
          </Text>
          <TouchableOpacity onPress={clearFilter}>
            <X size={16} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchBookings(true)} />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <History size={64} color={Colors.textLight} strokeWidth={1} />
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptySubtitle}>
              {dateRange.startDate ? "Try adjusting your dates" : "No guests have booked your properties yet"}
            </Text>
          </View>
        ) : (
          bookings.map((booking) => (
            <TouchableOpacity 
              key={booking.id} 
              style={styles.bookingCard}
              onPress={() => router.push(`/booking/${booking.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.propertyName}>{booking.property?.title || "Property"}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '15' }]}>
                  {getStatusIcon(booking.status)}
                  <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                    {booking.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <GuestIcon size={16} color={Colors.textLight} />
                  <Text style={styles.infoText}>Guest: {booking.guest?.name || "Anonymous"}</Text>
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

                <View style={styles.footerRow}>
                  <View style={styles.durationBadge}>
                    <Clock size={14} color={Colors.primary} />
                    <Text style={styles.durationText}>
                      {calculateDuration(booking.startDate, booking.endDate)}
                    </Text>
                  </View>
                  <Text style={styles.priceText}>${booking.totalPrice}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Date Filter Modal */}
      <Modal visible={showFilter} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Date</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <Calendar
              onDayPress={onDayPress}
              markedDates={markedDates}
              markingType={'period'}
              theme={{
                selectedDayBackgroundColor: Colors.primary,
                todayTextColor: Colors.primary,
                arrowColor: Colors.primary,
              }}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilter}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={() => setShowFilter(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  filterButton: {
    padding: 4,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: Colors.primary + '10',
    margin: 16,
    borderRadius: 12,
    gap: 8,
  },
  filterText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
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
  },
  bookingCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
    marginRight: 8,
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
  cardContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textLight,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
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
    color: Colors.textLight,
    marginBottom: 2,
    fontWeight: "600",
  },
  dateValue: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },
  dateDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary + '08',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  durationText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    minHeight: 500,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  clearButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  applyButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
});
