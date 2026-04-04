import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Image,
  Platform,
  RefreshControl,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { 
  Home, 
  Calendar as CalendarIcon, 
  Banknote, 
  TrendingUp,
  Plus,
  Star,
  X,
  Upload,
  Video,
  MapPin,
  Bed,
  Bath,
  Users
} from 'lucide-react-native';
import { Text, View, Card } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/auth';
import { useTheme } from '@/contexts/theme';
import { propertiesAPI, bookingsAPI, reviewsAPI } from '@/services/api';
import { useProperties } from '@/contexts/properties';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { rf, ms, s, vs, isTablet } from '@/utils/responsive';

export default function HostDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { addProperty } = useProperties();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const styles = createStyles(themeColors);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    address: "",
    lga: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    guests: "",
    amenities: "",
  });
  const [selectedMedia, setSelectedMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (!user) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const [propertiesRes, bookingsRes] = await Promise.all([
        propertiesAPI.getByHost(user.id),
        bookingsAPI.getHostBookings(user.id)
      ]);
      const properties = propertiesRes.data;
      const bookings = bookingsRes.data;
      const totalProperties = properties.length;
      const activeBookings = bookings.filter((b: any) => 
        ['confirmed', 'completed'].includes(b.status?.toLowerCase())
      ).length;
      const totalRevenue = bookings
        .filter((b: any) => ['confirmed', 'completed'].includes(b.status?.toLowerCase()))
        .reduce((sum: number, b: any) => sum + (Number(b.totalPrice) || 0), 0);
      const occupancyRate = totalProperties > 0 ? (activeBookings / (totalProperties * 30)) * 100 : 0;
      setDashboardData({
        statistics: {
          totalProperties,
          activeBookings,
          totalRevenue,
          occupancyRate: Math.min(100, Math.max(0, occupancyRate * 10)),
        },
        recentBookings: bookings.slice(0, 5),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData({
        statistics: { totalProperties: 0, activeBookings: 0, totalRevenue: 0, occupancyRate: 0 },
        recentBookings: []
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setSelectedMedia([...selectedMedia, ...result.assets]);
    }
  };

  const handleAddProperty = async () => {
    if (!user) return;
    if (!formData.title || !formData.location || !formData.price) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    try {
      // 0. Ensure host has set up payout settings (subaccount)
      if (!user.paystackSubaccountCode) {
        Alert.alert(
          "Payout Setup Required",
          "Please set up your bank account for payouts in Profile > Payout Settings before listing a property. This ensures you receive your 90% share automatically.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Set Up Now", onPress: () => {
              setShowAddModal(false);
              router.push("/host/payout-settings");
            }}
          ]
        );
        return;
      }

      setIsUploading(true);
      let imageUrls: string[] = [];
      if (selectedMedia.length > 0) {
        const uploadFormData = new FormData();
        selectedMedia.forEach((asset: ImagePicker.ImagePickerAsset, index: number) => {
          const uriParts = asset.uri.split('.');
          const fileType = uriParts[uriParts.length - 1];
          // @ts-ignore
          uploadFormData.append('media', {
            uri: asset.uri,
            name: `media-${index}.${fileType}`,
            type: asset.type === 'video' ? `video/${fileType}` : `image/${fileType}`,
          });
        });
        const uploadResponse = await propertiesAPI.uploadMedia(uploadFormData);
        imageUrls = uploadResponse.data.map((f: any) => f.url);
      } else {
        imageUrls = ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"];
      }
      
      const amenitiesList = formData.amenities.split(",").map((a: string) => a.trim()).filter((a: string) => a.length > 0);
      
      const newProperty = await addProperty({
        title: formData.title,
        description: formData.description || "Beautiful property available for rent",
        location: formData.location,
        address: formData.address,
        lga: formData.lga || formData.location,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms) || 1,
        bathrooms: parseInt(formData.bathrooms) || 1,
        guests: parseInt(formData.guests) || 2,
        images: imageUrls,
        amenities: amenitiesList.length > 0 ? amenitiesList : ["WiFi", "AC"],
        hostId: user.id,
        latitude: 12.0022, 
        longitude: 8.5919,
        availableDates: [],
      });

      // --- New Listing Fee Payment Flow ---
      Alert.alert(
        "Activate Property",
        "Your property has been submitted! To make it visible to guests, a one-time listing fee of ₦5,000 is required.",
        [
          {
            text: "Pay Now",
            onPress: async () => {
              try {
                const payResponse = await propertiesAPI.initializeListingPayment(newProperty.id);
                const { authorization_url, reference } = payResponse.data;

                // Open Paystack in browser
                const result = await WebBrowser.openAuthSessionAsync(
                  authorization_url,
                  Linking.createURL('listing-payment-callback')
                );

                // Verify payment
                const verifyRes = await propertiesAPI.verifyListingPayment(reference);
                if (verifyRes.data.paymentStatus === 'paid') {
                  Alert.alert("Success", "Listing fee paid! Your property is now active.");
                  fetchDashboardData();
                }
              } catch (e: any) {
                Alert.alert("Payment Info", "Listing is pending payment. You can pay later to activate it.");
                console.error("Listing payment error:", e);
              }
            }
          },
          { 
            text: "Pay Later", 
            style: "cancel",
            onPress: () => {
              Alert.alert("Pending", "Your property will remain hidden until the listing fee is paid.");
            }
          }
        ]
      );

      setFormData({
        title: "", description: "", location: "", address: "", lga: "", price: "",
        bedrooms: "", bathrooms: "", guests: "", amenities: "",
      });
      setSelectedMedia([]);
      setShowAddModal(false);
      fetchDashboardData();
    } catch (error: any) {
      console.error("Error adding property:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to add property";
      Alert.alert("Error", typeof errorMessage === 'string' ? errorMessage : "Failed to add property. Please check all fields.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!user || user.role !== 'host') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access restricted to hosts only</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/explore' as any)}>
          <Text style={styles.backButtonText}>Browse Properties</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && !dashboardData) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchDashboardData(true)}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={[styles.subtitle, { color: themeColors.textLight }]}>Welcome back, {user.name?.split(' ')[0] || 'Host'}!</Text>
      </View>

      <View style={styles.statsGrid}>
        <Card style={[styles.statCard, { borderColor: themeColors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: themeColors.background }]}><Home color={Colors.primary} size={24} /></View>
          <Text style={styles.statValue}>{dashboardData?.statistics.totalProperties || 0}</Text>
          <Text style={[styles.statLabel, { color: themeColors.textLight }]}>Properties</Text>
        </Card>
        <Card style={[styles.statCard, { borderColor: themeColors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: themeColors.background }]}><CalendarIcon color={Colors.success} size={24} /></View>
          <Text style={styles.statValue}>{dashboardData?.statistics.activeBookings || 0}</Text>
          <Text style={[styles.statLabel, { color: themeColors.textLight }]}>Active Bookings</Text>
        </Card>
        <Card style={[styles.statCard, { borderColor: themeColors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: themeColors.background }]}><Banknote color={Colors.warning} size={24} /></View>
          <Text style={styles.statValue}>₦{(dashboardData?.statistics.totalRevenue || 0).toLocaleString()}</Text>
          <Text style={[styles.statLabel, { color: themeColors.textLight }]}>Total Revenue</Text>
        </Card>
        <Card style={[styles.statCard, { borderColor: themeColors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: themeColors.background }]}><TrendingUp color={Colors.error} size={24} /></View>
          <Text style={styles.statValue}>{Math.round(dashboardData?.statistics.occupancyRate || 0)}%</Text>
          <Text style={[styles.statLabel, { color: themeColors.textLight }]}>Occupancy Rate</Text>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.actionWrapper}>
            <Card style={[styles.actionButton, { borderColor: themeColors.border }]}>
              <Plus size={24} color={Colors.primary} />
              <Text style={styles.actionText}>Add Property</Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/(host)/bookings' as any)} style={styles.actionWrapper}>
            <Card style={[styles.actionButton, { borderColor: themeColors.border }]}>
              <CalendarIcon size={24} color={Colors.primary} />
              <Text style={styles.actionText}>View Bookings</Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/(properties)' as any)} style={styles.actionWrapper}>
            <Card style={[styles.actionButton, { borderColor: themeColors.border }]}>
              <Home size={24} color={Colors.primary} />
              <Text style={styles.actionText}>My Properties</Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/(host)/reviews' as any)} style={styles.actionWrapper}>
            <Card style={[styles.actionButton, { borderColor: themeColors.border }]}>
              <Star size={24} color={Colors.primary} />
              <Text style={styles.actionText}>Reviews</Text>
            </Card>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile/host-bookings' as any)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {dashboardData?.recentBookings?.length > 0 ? (
          dashboardData.recentBookings.map((booking: any) => (
            <TouchableOpacity key={booking.id} onPress={() => router.push(`/booking/${booking.id}` as any)}>
              <Card style={[styles.bookingCard, { borderColor: themeColors.border }]}>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingProperty} numberOfLines={1}>{booking.property?.title}</Text>
                  <Text style={[styles.bookingGuest, { color: themeColors.textLight }]}>{booking.guest?.name || (booking.guest?.firstName ? `${booking.guest.firstName} ${booking.guest.lastName}` : 'Guest')}</Text>
                  <Text style={[styles.bookingDates, { color: themeColors.textLight }]}>{new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</Text>
                </View>
                <View style={styles.bookingRight}>
                  <Text style={styles.bookingPrice}>₦{(Number(booking.totalPrice) || 0).toLocaleString()}</Text>
                  <View style={[styles.statusBadge, booking.status === 'confirmed' && styles.statusConfirmed, booking.status === 'pending' && styles.statusPending, booking.status === 'cancelled' && styles.statusCancelled]}>
                    <Text style={styles.statusText}>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        ) : (<Text style={[styles.emptyText, { color: themeColors.textLight }]}>No recent bookings</Text>)}
      </View>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalScrollContainer} edges={['top']}>
          <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
            <Text style={styles.modalTitle}>Add New Property</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}><X color={themeColors.text} size={24} /></TouchableOpacity>
          </View>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={formData.title} onChangeText={(text) => setFormData({ ...formData, title: text })} placeholder="e.g., Luxury 3BR Apartment" placeholderTextColor={themeColors.textLight} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={formData.description} onChangeText={(text) => setFormData({ ...formData, description: text })} placeholder="Describe your property" placeholderTextColor={themeColors.textLight} multiline numberOfLines={4} />
            </View>
            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}><Text style={styles.label}>Location *</Text><TextInput style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={formData.location} onChangeText={(text) => setFormData({ ...formData, location: text })} placeholder="e.g., Nassarawa GRA" placeholderTextColor={themeColors.textLight} /></View>
              <View style={styles.formGroupHalf}><Text style={styles.label}>LGA</Text><TextInput style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={formData.lga} onChangeText={(text) => setFormData({ ...formData, lga: text })} placeholder="e.g., Nassarawa" placeholderTextColor={themeColors.textLight} /></View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Address *</Text>
              <TextInput style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={formData.address} onChangeText={(text) => setFormData({ ...formData, address: text })} placeholder="e.g., No. 42 Boundary Road" placeholderTextColor={themeColors.textLight} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Price per Night (₦) *</Text>
              <TextInput style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={formData.price} onChangeText={(text) => setFormData({ ...formData, price: text })} placeholder="25000" placeholderTextColor={themeColors.textLight} keyboardType="numeric" />
            </View>
            <View style={styles.formRow}>
              <View style={{flex: 1, flexDirection: 'row', gap: 12}}>
                <View style={styles.formGroupThird}><Text style={styles.label}>Bedrooms</Text><TextInput style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={formData.bedrooms} onChangeText={(text) => setFormData({ ...formData, bedrooms: text })} placeholder="3" placeholderTextColor={themeColors.textLight} keyboardType="numeric" /></View>
                <View style={styles.formGroupThird}><Text style={styles.label}>Bathrooms</Text><TextInput style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={formData.bathrooms} onChangeText={(text) => setFormData({ ...formData, bathrooms: text })} placeholder="2" placeholderTextColor={themeColors.textLight} keyboardType="numeric" /></View>
                <View style={styles.formGroupThird}><Text style={styles.label}>Guests</Text><TextInput style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={formData.guests} onChangeText={(text) => setFormData({ ...formData, guests: text })} placeholder="6" placeholderTextColor={themeColors.textLight} keyboardType="numeric" /></View>
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Media (Images/Videos) *</Text>
              <TouchableOpacity onPress={pickMedia}>
                <Card style={[styles.mediaPicker, { borderStyle: 'dashed', borderColor: themeColors.border }]}>
                  <Upload color={Colors.primary} size={24} />
                  <Text style={styles.mediaPickerText}>Select Images or Videos</Text>
                </Card>
              </TouchableOpacity>
              {selectedMedia.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviewList}>
                  {selectedMedia.map((asset: ImagePicker.ImagePickerAsset, index: number) => (
                    <View key={index} style={styles.mediaPreviewContainer}>
                      <Image source={{ uri: asset.uri }} style={[styles.mediaPreview, { backgroundColor: themeColors.border }]} />
                      <TouchableOpacity style={styles.removeMedia} onPress={() => setSelectedMedia(selectedMedia.filter((_: ImagePicker.ImagePickerAsset, i: number) => i !== index))}>
                        <X color="white" size={12} />
                      </TouchableOpacity>
                      {asset.type === 'video' && (
                        <View style={styles.videoBadge}>
                          <Video color="white" size={12} />
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Amenities (comma separated)</Text>
              <TextInput style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={formData.amenities} onChangeText={(text) => setFormData({ ...formData, amenities: text })} placeholder="WiFi, AC, Kitchen, Pool" placeholderTextColor={themeColors.textLight} />
            </View>
            <TouchableOpacity style={[styles.submitButton, isUploading && styles.submitButtonDisabled]} onPress={handleAddProperty} disabled={isUploading}><Text style={styles.submitButtonText}>{isUploading ? "Processing..." : "Add Property"}</Text></TouchableOpacity>
          </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { padding: ms(20), paddingTop: vs(40) },
  title: { fontSize: rf(30), fontWeight: 'bold', marginBottom: vs(4) },
  subtitle: { fontSize: rf(15) },
  errorText: { fontSize: rf(18), textAlign: 'center', marginTop: vs(100), marginBottom: vs(20) },
  backButton: { backgroundColor: Colors.primary, paddingHorizontal: ms(20), paddingVertical: vs(12), borderRadius: ms(8), alignSelf: 'center' },
  backButtonText: { color: '#fff', fontSize: rf(16), fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: ms(20), gap: ms(16), marginTop: vs(12) },
  statCard: { flex: 1, minWidth: isTablet ? '22%' : '44%', borderRadius: ms(16), padding: ms(16), alignItems: 'center', borderWidth: 1 },
  statIcon: { width: ms(44), height: ms(44), borderRadius: ms(22), alignItems: 'center', justifyContent: 'center', marginBottom: vs(10) },
  statValue: { fontSize: rf(18), fontWeight: 'bold', marginBottom: vs(4) },
  statLabel: { fontSize: rf(11), textAlign: 'center' },
  section: { padding: ms(20), marginVertical: vs(8) },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(16) },
  sectionTitle: { fontSize: rf(20), fontWeight: 'bold', marginBottom: vs(16) },
  seeAllText: { fontSize: rf(14), color: Colors.primary, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ms(16) },
  actionWrapper: { width: isTablet ? '22.5%' : '47.5%' },
  actionButton: { borderRadius: ms(16), padding: vs(20), alignItems: 'center', borderWidth: 1, width: '100%' },
  actionText: { fontSize: rf(14), marginTop: vs(10), fontWeight: '500' },
  bookingCard: { borderRadius: ms(12), padding: ms(16), marginBottom: vs(12), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
  bookingInfo: { flex: 1, marginRight: ms(8) },
  bookingProperty: { fontSize: rf(15), fontWeight: '600', marginBottom: vs(4) },
  bookingGuest: { fontSize: rf(13), marginBottom: vs(4) },
  bookingDates: { fontSize: rf(11) },
  bookingRight: { alignItems: 'flex-end' },
  bookingPrice: { fontSize: rf(15), fontWeight: 'bold', marginBottom: vs(8) },
  statusBadge: { paddingHorizontal: ms(8), paddingVertical: vs(4), borderRadius: ms(12) },
  statusConfirmed: { backgroundColor: Colors.success + '20' },
  statusPending: { backgroundColor: Colors.warning + '20' },
  statusCancelled: { backgroundColor: Colors.error + '20' },
  statusText: { fontSize: rf(11), fontWeight: '600' },
  emptyText: { fontSize: rf(14), textAlign: 'center', padding: ms(20) },
  loadingText: { fontSize: rf(16), textAlign: 'center', marginTop: vs(16) },
  modalScrollContainer: { flex: 1, backgroundColor: themeColors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: ms(20), borderBottomWidth: 1 },
  modalTitle: { fontSize: rf(20), fontWeight: 'bold' },
  modalContent: { flex: 1, padding: ms(20) },
  formGroup: { marginBottom: vs(20) },
  formRow: { flexDirection: 'row', gap: ms(12), marginBottom: vs(20) },
  formGroupHalf: { flex: 1 },
  formGroupThird: { flex: 1 },
  label: { fontSize: rf(14), fontWeight: '600', marginBottom: vs(8) },
  input: { borderRadius: ms(12), padding: ms(14), fontSize: rf(16), borderWidth: 1 },
  textArea: { minHeight: vs(100), textAlignVertical: 'top' },
  mediaPicker: { borderRadius: ms(12), padding: vs(24), borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: ms(8) },
  mediaPickerText: { fontSize: rf(14), color: Colors.primary, fontWeight: '600' },
  mediaPreviewList: { marginTop: vs(12) },
  mediaPreviewContainer: { position: 'relative', marginRight: ms(10) },
  mediaPreview: { width: ms(80), height: ms(80), borderRadius: ms(8) },
  removeMedia: { position: 'absolute', top: vs(-5), right: ms(-5), backgroundColor: Colors.error, width: ms(20), height: ms(20), borderRadius: ms(10), justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'white' },
  videoBadge: { position: 'absolute', bottom: vs(5), right: ms(5), backgroundColor: 'rgba(0,0,0,0.6)', width: ms(20), height: ms(20), borderRadius: ms(10), justifyContent: 'center', alignItems: 'center' },
  submitButton: { backgroundColor: Colors.primary, borderRadius: ms(12), padding: vs(16), alignItems: 'center', marginTop: vs(10), marginBottom: vs(40) },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: rf(16), fontWeight: 'bold', color: '#fff' },
});
