import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Calendar, DateData } from 'react-native-calendars';
import { Users, Calendar as CalendarIcon } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { mockProperties } from '@/mocks/properties';
import { useAuth } from '@/contexts/auth';
import { useBookings } from '@/contexts/bookings';
import * as Haptics from 'expo-haptics';

export default function BookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { addBooking, isAddingBooking } = useBookings();
  
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [guests, setGuests] = useState('1');
  const [isBooking, setIsBooking] = useState(false);

  const property = mockProperties.find(p => p.id === id);

  if (!property) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Property not found</Text>
      </View>
    );
  }

  const handleDayPress = (day: DateData) => {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(day.dateString);
      setCheckOut('');
    } else if (checkIn && !checkOut) {
      if (day.dateString > checkIn) {
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
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    return nights * property.price;
  };

  const handleBooking = async () => {
    if (!checkIn || !checkOut) {
      Alert.alert('Error', 'Please select check-in and check-out dates');
      return;
    }

    if (!guests || parseInt(guests) < 1) {
      Alert.alert('Error', 'Please enter number of guests');
      return;
    }

    if (parseInt(guests) > property.guests) {
      Alert.alert('Error', `Maximum ${property.guests} guests allowed`);
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please login to make a booking');
      router.push('/auth/login' as any);
      return;
    }

    setIsBooking(true);
    
    try {
      await addBooking({
        propertyId: property.id,
        userId: user.id,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests: parseInt(guests),
        totalPrice: calculateTotal(),
        status: 'confirmed',
      });
      
      setIsBooking(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        'Booking Confirmed! 🎉',
        `Your booking for ${property.title} has been confirmed.\n\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}\nTotal: ₦${calculateTotal().toLocaleString()}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch {
      setIsBooking(false);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    }
  };

  const markedDates = {
    [checkIn]: {
      startingDay: true,
      color: Colors.primary,
      textColor: Colors.card,
    },
    [checkOut]: {
      endingDay: true,
      color: Colors.primary,
      textColor: Colors.card,
    },
  };

  const nights = calculateNights();
  const total = calculateTotal();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.propertyHeader}>
          <Image
            source={{ uri: property.images[0] }}
            style={styles.propertyImage}
            contentFit="cover"
          />
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyTitle}>{property.title}</Text>
            <Text style={styles.propertyLocation}>{property.location}, {property.lga}</Text>
          </View>
        </View>

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
              backgroundColor: Colors.card,
              calendarBackground: Colors.card,
              textSectionTitleColor: Colors.text,
              selectedDayBackgroundColor: Colors.primary,
              selectedDayTextColor: Colors.card,
              todayTextColor: Colors.primary,
              dayTextColor: Colors.text,
              textDisabledColor: Colors.textLight,
              dotColor: Colors.primary,
              selectedDotColor: Colors.card,
              arrowColor: Colors.primary,
              monthTextColor: Colors.text,
              textDayFontWeight: '500' as const,
              textMonthFontWeight: 'bold' as const,
              textDayHeaderFontWeight: '600' as const,
            }}
          />
          
          {checkIn && checkOut && (
            <View style={styles.dateInfo}>
              <View style={styles.dateInfoItem}>
                <Text style={styles.dateInfoLabel}>Check-in</Text>
                <Text style={styles.dateInfoValue}>{checkIn}</Text>
              </View>
              <View style={styles.dateInfoItem}>
                <Text style={styles.dateInfoLabel}>Check-out</Text>
                <Text style={styles.dateInfoValue}>{checkOut}</Text>
              </View>
              <View style={styles.dateInfoItem}>
                <Text style={styles.dateInfoLabel}>Nights</Text>
                <Text style={styles.dateInfoValue}>{nights}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users color={Colors.primary} size={20} />
            <Text style={styles.sectionTitle}>Number of Guests</Text>
          </View>
          <View style={styles.guestInput}>
            <TextInput
              style={styles.input}
              placeholder="Enter number of guests"
              placeholderTextColor={Colors.textLight}
              value={guests}
              onChangeText={setGuests}
              keyboardType="number-pad"
            />
            <Text style={styles.guestLimit}>Max {property.guests} guests</Text>
          </View>
        </View>

        {nights > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Breakdown</Text>
            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>₦{property.price.toLocaleString()} × {nights} nights</Text>
                <Text style={styles.priceValue}>₦{total.toLocaleString()}</Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₦{total.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>Total Price</Text>
          <Text style={styles.footerPrice}>
            {nights > 0 ? `₦${total.toLocaleString()}` : 'Select dates'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, (!checkIn || !checkOut || isAddingBooking) && styles.bookButtonDisabled]}
          onPress={handleBooking}
          disabled={!checkIn || !checkOut || isBooking || isAddingBooking}
        >
          <Text style={styles.bookButtonText}>
            {isBooking ? 'Booking...' : 'Confirm Booking'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  propertyHeader: {
    flexDirection: 'row' as const,
    padding: 20,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  propertyImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  propertyInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center' as const,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  propertyLocation: {
    fontSize: 14,
    color: Colors.textLight,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  dateInfo: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
  },
  dateInfoItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  dateInfoLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
  },
  dateInfoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  guestInput: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
  },
  input: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  guestLimit: {
    fontSize: 12,
    color: Colors.textLight,
  },
  priceBreakdown: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
  },
  priceRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  priceValue: {
    fontSize: 16,
    color: Colors.text,
  },
  priceDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 16,
  },
  footerInfo: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  bookButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  bookButtonText: {
    color: Colors.card,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textLight,
  },
});