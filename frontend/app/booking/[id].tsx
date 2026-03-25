import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Calendar, DateData } from 'react-native-calendars';
import { Users, Calendar as CalendarIcon, X, CreditCard } from 'lucide-react-native';
import { Text, View, Card } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/theme';
import { useAuth } from '@/contexts/auth';
import * as Haptics from 'expo-haptics';
import { propertiesAPI, bookingsAPI, API_BASE_URL, settingsAPI } from '@/services/api';
import { Property } from '@/types';
import WebView from 'react-native-webview';

export default function BookingScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { id } = useLocalSearchParams<{ id: string; price?: string }>();
  const { user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [guests, setGuests] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);

  // Paystack payment modal
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (id) loadProperty();
  }, [id]);

  const loadProperty = async () => {
    try {
      const [propRes, settingsRes] = await Promise.all([
        propertiesAPI.getById(id),
        settingsAPI.getByGroup('payment')
      ]);
      
      setProperty(propRes.data);
      
      const paymentSettings = settingsRes.data;
      const tax = paymentSettings.find((s: any) => s.key === 'tax_rate')?.value;
      const fee = paymentSettings.find((s: any) => s.key === 'platform_fee')?.value;
      
      if (tax) setTaxRate(parseFloat(tax));
      if (fee) setPlatformFee(parseFloat(fee));
    } catch (err) {
      console.error('Error loading booking data:', err);
      setError('Failed to load property details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day: DateData) => {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(day.dateString);
      setCheckOut('');
    } else if (checkIn && !checkOut) {
      if (day.dateString >= checkIn) {
        setCheckOut(day.dateString);
      } else {
        setCheckIn(day.dateString);
        setCheckOut('');
      }
    }
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const calculateSubtotal = () => {
    return calculateNights() * (property?.price || 0);
  };

  const calculateFees = () => {
    const subtotal = calculateSubtotal();
    const taxAmount = (subtotal * taxRate) / 100;
    const platformAmount = (subtotal * platformFee) / 100;
    return { taxAmount, platformAmount };
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const { taxAmount, platformAmount } = calculateFees();
    return subtotal + taxAmount + platformAmount;
  };

  const handleBooking = async () => {
    if (!user || !property) return;
    if (!checkIn || !checkOut) {
      setError('Please select check-in and check-out dates.');
      return;
    }
    const numGuests = parseInt(guests);
    if (!numGuests || numGuests < 1) {
      setError('Please enter a valid number of guests.');
      return;
    }
    if (numGuests > (property.guests || 10)) {
      setError(`Maximum ${property.guests} guests allowed.`);
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const total = calculateTotal();
      const response = await bookingsAPI.initializePayment({
        email: user.email,
        amount: total, // service multiplies by 100 for kobo
        metadata: {
          propertyId: property.id,
          guestId: user.id,
          startDate: checkIn,
          endDate: checkOut,
          guests: numGuests,
        },
      });

      const { authorization_url, reference } = response.data;
      setPaymentRef(reference);
      setPaymentUrl(authorization_url);
      setShowPaymentModal(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to start payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWebViewNavigation = async (navState: { url: string }) => {
    const { url } = navState;
    
    // Handle cancellation
    if (url.includes('cancel') || url.includes('paystack.co/close') || url.includes('paystack.com/close')) {
      setShowPaymentModal(false);
      return;
    }

    // Paystack redirects to callback_url on success
    if (url.includes('comforthaven://payment-callback')) {
      setShowPaymentModal(false);
      if (!paymentRef) return;

      setIsProcessing(true);
      try {
        await bookingsAPI.verifyPayment(paymentRef);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/profile/bookings' as any);
      } catch {
        setError('Payment verification failed. Please contact support if you were charged.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const getMediaUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const nights = calculateNights();
  const subtotal = calculateSubtotal();
  const { taxAmount, platformAmount } = calculateFees();
  const total = calculateTotal();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Property not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProperty}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const markedDates: any = {};
  if (checkIn) {
    markedDates[checkIn] = { startingDay: true, color: Colors.primary, textColor: '#fff' };
  }
  if (checkOut) {
    markedDates[checkOut] = { endingDay: true, color: Colors.primary, textColor: '#fff' };
  }
  if (checkIn && checkOut) {
    // Fill in-between dates
    let current = new Date(checkIn);
    current.setDate(current.getDate() + 1);
    const end = new Date(checkOut);
    while (current < end) {
      const dateStr = current.toISOString().split('T')[0];
      markedDates[dateStr] = { color: `${Colors.primary}33`, textColor: themeColors.text };
      current.setDate(current.getDate() + 1);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Property Summary */}
        <View style={[styles.propertyHeader, { borderBottomColor: themeColors.border }]}>
          <Image
            source={{ uri: getMediaUrl(property.images?.[0]) }}
            style={styles.propertyImage}
            contentFit="cover"
          />
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyTitle}>{property.title}</Text>
            <Text style={[styles.propertyLocation, { color: themeColors.textLight }]}>
              {property.location}, {property.lga}
            </Text>
            <Text style={[styles.propertyPrice, { color: Colors.primary }]}>
              ₦{Number(property.price).toLocaleString()} / night
            </Text>
          </View>
        </View>

        {/* Date picker */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CalendarIcon color={Colors.primary} size={20} />
            <Text style={styles.sectionTitle}>Select Dates</Text>
          </View>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={markedDates}
            markingType="period"
            minDate={new Date().toISOString().split('T')[0]}
            theme={{
              backgroundColor: themeColors.card,
              calendarBackground: themeColors.card,
              textSectionTitleColor: themeColors.text,
              selectedDayBackgroundColor: Colors.primary,
              selectedDayTextColor: '#fff',
              todayTextColor: Colors.primary,
              dayTextColor: themeColors.text,
              textDisabledColor: themeColors.textLight,
              arrowColor: Colors.primary,
              monthTextColor: themeColors.text,
              textDayFontWeight: '500' as const,
              textMonthFontWeight: 'bold' as const,
              textDayHeaderFontWeight: '600' as const,
            }}
          />

          {checkIn && checkOut && (
            <Card style={styles.dateInfo}>
              <View style={styles.dateInfoItem}>
                <Text style={[styles.dateInfoLabel, { color: themeColors.textLight }]}>Check-in</Text>
                <Text style={styles.dateInfoValue}>{checkIn}</Text>
              </View>
              <View style={styles.dateInfoItem}>
                <Text style={[styles.dateInfoLabel, { color: themeColors.textLight }]}>Check-out</Text>
                <Text style={styles.dateInfoValue}>{checkOut}</Text>
              </View>
              <View style={styles.dateInfoItem}>
                <Text style={[styles.dateInfoLabel, { color: themeColors.textLight }]}>Nights</Text>
                <Text style={[styles.dateInfoValue, { color: Colors.primary }]}>{nights}</Text>
              </View>
            </Card>
          )}
        </View>

        {/* Guests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users color={Colors.primary} size={20} />
            <Text style={styles.sectionTitle}>Number of Guests</Text>
          </View>
          <Card style={styles.guestInput}>
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="Enter number of guests"
              placeholderTextColor={themeColors.textLight}
              value={guests}
              onChangeText={setGuests}
              keyboardType="number-pad"
            />
            <Text style={[styles.guestLimit, { color: themeColors.textLight }]}>
              Max {property.guests || 10} guests
            </Text>
          </Card>
        </View>

        {/* Price breakdown */}
        {nights > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Breakdown</Text>
            <Card style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  ₦{Number(property.price).toLocaleString()} × {nights} nights
                </Text>
                <Text style={styles.priceValue}>₦{subtotal.toLocaleString()}</Text>
              </View>
              {taxAmount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Tax ({taxRate}%)</Text>
                  <Text style={styles.priceValue}>₦{taxAmount.toLocaleString()}</Text>
                </View>
              )}
              {platformAmount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Platform Fee ({platformFee}%)</Text>
                  <Text style={styles.priceValue}>₦{platformAmount.toLocaleString()}</Text>
                </View>
              )}
              <View style={[styles.priceDivider, { backgroundColor: themeColors.border }]} />
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={[styles.totalValue, { color: Colors.primary }]}>₦{total.toLocaleString()}</Text>
              </View>
            </Card>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.section}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer CTA */}
      <Card style={[styles.footer, { borderTopColor: themeColors.border }]}>
        <View style={styles.footerInfo}>
          <Text style={[styles.footerLabel, { color: themeColors.textLight }]}>Total Price</Text>
          <Text style={[styles.footerPrice, { color: Colors.primary }]}>
            {nights > 0 ? `₦${total.toLocaleString()}` : 'Select dates'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!checkIn || !checkOut || isProcessing) && styles.bookButtonDisabled,
          ]}
          onPress={handleBooking}
          disabled={!checkIn || !checkOut || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <CreditCard color="#FFFFFF" size={18} />
              <Text style={styles.bookButtonText}>Pay & Book</Text>
            </>
          )}
        </TouchableOpacity>
      </Card>

      {/* Paystack Payment WebView Modal */}
      <Modal visible={showPaymentModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.paymentModalHeader}>
          <Text style={styles.paymentModalTitle}>Secure Payment</Text>
          <TouchableOpacity
            onPress={() => setShowPaymentModal(false)}
            style={styles.closeButton}
          >
            <X color={themeColors.text} size={24} />
          </TouchableOpacity>
        </View>
        {paymentUrl ? (
          <WebView
            source={{ uri: paymentUrl }}
            onNavigationStateChange={handleWebViewNavigation}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            )}
          />
        ) : (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  propertyHeader: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
  },
  propertyImage: { width: 80, height: 80, borderRadius: 12 },
  propertyInfo: { flex: 1, marginLeft: 16, justifyContent: 'center', gap: 4 },
  propertyTitle: { fontSize: 18, fontWeight: 'bold' },
  propertyLocation: { fontSize: 14 },
  propertyPrice: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  section: { padding: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  dateInfo: { flexDirection: 'row', padding: 16, borderRadius: 12, marginTop: 16, gap: 12 },
  dateInfoItem: { flex: 1, alignItems: 'center' },
  dateInfoLabel: { fontSize: 12, marginBottom: 4 },
  dateInfoValue: { fontSize: 14, fontWeight: '600' },
  guestInput: { padding: 16, borderRadius: 12 },
  input: { fontSize: 16, marginBottom: 8 },
  guestLimit: { fontSize: 12 },
  priceBreakdown: { padding: 16, borderRadius: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priceLabel: { fontSize: 16 },
  priceValue: { fontSize: 16 },
  priceDivider: { height: 1, marginVertical: 8 },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    gap: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
  },
  footerInfo: { flex: 1 },
  footerLabel: { fontSize: 14, marginBottom: 4 },
  footerPrice: { fontSize: 20, fontWeight: 'bold' },
  bookButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 140,
    justifyContent: 'center',
  },
  bookButtonDisabled: { opacity: 0.5 },
  bookButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  paymentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  paymentModalTitle: { fontSize: 18, fontWeight: '700' },
  closeButton: { padding: 4 },
  errorText: { fontSize: 15, color: '#e53e3e', textAlign: 'center' },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});