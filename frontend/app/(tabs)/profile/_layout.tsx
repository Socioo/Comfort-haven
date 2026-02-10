import React from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { useBookings } from '@/contexts/bookings';
import * as Haptics from 'expo-haptics';
import { LogOut, Mail, Phone, Settings, Shield, UserIcon } from 'lucide-react-native';
import { Image } from 'expo-image';
import { mockProperties } from '@/mocks/properties';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { getUserBookings } = useBookings();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <UserIcon color={Colors.textLight} size={64} />
        <Text style={styles.emptyTitle}>Not signed in</Text>
        <Text style={styles.emptyText}>
          Sign in to access your profile and bookings
        </Text>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => router.push('/auth/login' as any)}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() => router.push('/auth/signup' as any)}
        >
          <Text style={styles.signUpButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return Colors.error;
      case 'host':
        return Colors.secondary;
      default:
        return Colors.primary;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user.photoUrl ? (
            <Image
              source={{ uri: user.photoUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <UserIcon color={Colors.card} size={40} />
            </View>
          )}
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(user.role) }]}>
          <Shield size={12} color={Colors.card} />
          <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Mail color={Colors.textLight} size={20} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>
          
          {user.phone && (
            <View style={styles.infoRow}>
              <Phone color={Colors.textLight} size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking History</Text>
        {user && getUserBookings(user.id).length > 0 ? (
          <View style={styles.bookingsList}>
            {getUserBookings(user.id)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((booking) => {
                const property = mockProperties.find(p => p.id === booking.propertyId);
                if (!property) return null;
                
                const statusColors: Record<string, string> = {
                  confirmed: Colors.primary,
                  completed: Colors.secondary,
                  pending: Colors.accent,
                  cancelled: Colors.error,
                };

                return (
                  <TouchableOpacity
                    key={booking.id}
                    style={styles.bookingCard}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/property/${property.id}` as any);
                    }}
                  >
                    <Image
                      source={{ uri: property.images[0] }}
                      style={styles.bookingImage}
                      contentFit="cover"
                    />
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingTitle} numberOfLines={1}>
                        {property.title}
                      </Text>
                      <View style={styles.bookingDates}>
                        <Mail color={Colors.textLight} size={12} />
                        <Text style={styles.bookingDateText}>
                          {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.bookingFooter}>
                        <View style={[styles.statusBadge, { backgroundColor: `${statusColors[booking.status]}20` }]}>
                          <Text style={[styles.statusText, { color: statusColors[booking.status] }]}>
                            {booking.status.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.bookingPrice}>₦{booking.totalPrice.toLocaleString()}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
          </View>
        ) : (
          <View style={styles.emptyBookings}>
            <Text style={styles.emptyBookingsText}>No bookings yet</Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/explore' as any)}
            >
              <Text style={styles.exploreButtonText}>Explore Properties</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {user.role === 'host' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Host Dashboard</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Settings color={Colors.text} size={20} />
            <Text style={styles.menuItemText}>Manage Properties</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Settings color={Colors.text} size={20} />
            <Text style={styles.menuItemText}>View Bookings</Text>
          </TouchableOpacity>
        </View>
      )}

      {user.role === 'admin' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Panel</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Shield color={Colors.text} size={20} />
            <Text style={styles.menuItemText}>Manage Users</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Shield color={Colors.text} size={20} />
            <Text style={styles.menuItemText}>Manage Properties</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Shield color={Colors.text} size={20} />
            <Text style={styles.menuItemText}>View Analytics</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut color={Colors.error} size={20} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center' as const,
    paddingVertical: 32,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  roleText: {
    color: Colors.card,
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  menuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  signOutButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  signOutText: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: '600' as const,
  },
  bookingsList: {
    gap: 12,
  },
  bookingCard: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookingImage: {
    width: 100,
    height: 120,
  },
  bookingInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between' as const,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  bookingDates: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 8,
  },
  bookingDateText: {
    fontSize: 13,
    color: Colors.textLight,
  },
  bookingFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold' as const,
  },
  bookingPrice: {
    fontSize: 15,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  emptyBookings: {
    backgroundColor: Colors.card,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  emptyBookingsText: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 16,
  },
  exploreButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: Colors.card,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  signInButtonText: {
    color: Colors.card,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  signUpButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  signUpButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
