import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Home, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Plus,
  ArrowRight,
  Star
} from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/auth';

export default function HostDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'host') {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Mock dashboard data since we don't have an API
      const mockDashboardData = {
        statistics: {
          totalProperties: 5,
          activeBookings: 3,
          totalRevenue: 125000,
          occupancyRate: 75,
        },
        recentBookings: [
          {
            id: '1',
            property: { title: 'Luxury 3BR Apartment' },
            user: { firstName: 'John', lastName: 'Doe' },
            checkInDate: '2024-01-15',
            checkOutDate: '2024-01-20',
            totalPrice: 125000,
            status: 'confirmed',
          },
          {
            id: '2',
            property: { title: 'Cozy Studio' },
            user: { firstName: 'Jane', lastName: 'Smith' },
            checkInDate: '2024-01-18',
            checkOutDate: '2024-01-22',
            totalPrice: 60000,
            status: 'pending',
          },
          {
            id: '3',
            property: { title: 'Spacious Villa' },
            user: { firstName: 'Mike', lastName: 'Johnson' },
            checkInDate: '2024-01-25',
            checkOutDate: '2024-02-01',
            totalPrice: 315000,
            status: 'confirmed',
          },
        ],
      };
      
      // Simulate API delay
      setTimeout(() => {
        setDashboardData(mockDashboardData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (!user || user.role !== 'host') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access restricted to hosts only</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('./explore')}
        >
          <Text style={styles.backButtonText}>Browse Properties</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Host Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {user.firstName}!</Text>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Home color={Colors.primary} size={24} />
          </View>
          <Text style={styles.statValue}>
            {dashboardData?.statistics.totalProperties || 0}
          </Text>
          <Text style={styles.statLabel}>Properties</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Calendar color={Colors.success} size={24} />
          </View>
          <Text style={styles.statValue}>
            {dashboardData?.statistics.activeBookings || 0}
          </Text>
          <Text style={styles.statLabel}>Active Bookings</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <DollarSign color={Colors.warning} size={24} />
          </View>
          <Text style={styles.statValue}>
            ₦{(dashboardData?.statistics.totalRevenue || 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <TrendingUp color={Colors.error} size={24} />
          </View>
          <Text style={styles.statValue}>
            {Math.round(dashboardData?.statistics.occupancyRate || 0)}%
          </Text>
          <Text style={styles.statLabel}>Occupancy Rate</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('./host-properties')}
          >
            <Plus size={24} color={Colors.primary} />
            <Text style={styles.actionText}>Add Property</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('./profile')}
          >
            <Calendar size={24} color={Colors.primary} />
            <Text style={styles.actionText}>View Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('./host-properties')}
          >
            <Home size={24} color={Colors.primary} />
            <Text style={styles.actionText}>My Properties</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('./profile')}
          >
            <Star size={24} color={Colors.primary} />
            <Text style={styles.actionText}>Reviews</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Bookings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <TouchableOpacity onPress={() => router.push('./profile')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {dashboardData?.recentBookings?.length > 0 ? (
          dashboardData.recentBookings.map((booking: any) => (
            <TouchableOpacity key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingProperty}>
                  {booking.property.title}
                </Text>
                <Text style={styles.bookingGuest}>
                  {booking.user.firstName} {booking.user.lastName}
                </Text>
                <Text style={styles.bookingDates}>
                  {new Date(booking.checkInDate).toLocaleDateString()} -{' '}
                  {new Date(booking.checkOutDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.bookingRight}>
                <Text style={styles.bookingPrice}>
                  ₦{booking.totalPrice.toLocaleString()}
                </Text>
                <View style={[
                  styles.statusBadge,
                  booking.status === 'confirmed' && styles.statusConfirmed,
                  booking.status === 'pending' && styles.statusPending,
                  booking.status === 'cancelled' && styles.statusCancelled,
                ]}>
                  <Text style={styles.statusText}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent bookings</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  backButtonText: {
    color: Colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
  },
  section: {
    padding: 20,
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
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 8,
  },
  bookingCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingProperty: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  bookingGuest: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  bookingDates: {
    fontSize: 12,
    color: Colors.textLight,
  },
  bookingRight: {
    alignItems: 'flex-end',
  },
  bookingPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusConfirmed: {
    backgroundColor: Colors.success + '20',
  },
  statusPending: {
    backgroundColor: Colors.warning + '20',
  },
  statusCancelled: {
    backgroundColor: Colors.error + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 16,
  },
});