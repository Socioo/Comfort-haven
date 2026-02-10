import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { Text, View } from '@/components/Themed';
import { Car, UtensilsCrossed } from 'lucide-react-native';

export default function ServicesScreen() {
  const services = [
    {
      id: 1,
      title: 'Restaurant Bookings',
      icon: UtensilsCrossed,
      description: 'Discover and book at the best restaurants in Kano',
    },
    {
      id: 2,
      title: 'Car Lease',
      icon: Car,
      description: 'Rent a car for your stay with ease',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Our Services</Text>
          <Text style={styles.subtitle}>
            We&apos;re working on exciting new features to make your stay even better
          </Text>
        </View>

        <View style={styles.servicesContainer}>
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.iconContainer}>
                  <Icon color={Colors.primary} size={32} />
                </View>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Stay tuned for updates! We&apos;ll notify you when these services become available.
          </Text>
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center' as const,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  servicesContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  serviceCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 15,
    color: Colors.textLight,
    textAlign: 'center' as const,
    lineHeight: 21,
    marginBottom: 16,
  },
  comingSoonBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  comingSoonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.card,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
});

