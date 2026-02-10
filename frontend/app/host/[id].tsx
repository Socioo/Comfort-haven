import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Star, MapPin, Send } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { mockProperties } from '@/mocks/properties';
import * as Haptics from 'expo-haptics';

export default function HostDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<{ text: string; isUser: boolean; time: string }[]>([
    { text: 'Hello! How can I help you?', isUser: false, time: '10:30 AM' },
  ]);

  const hostProperties = mockProperties.filter(p => p.hostId === id);
  const hostInfo = hostProperties[0];

  if (!hostInfo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Host not found</Text>
      </View>
    );
  }

  const totalReviews = hostProperties.reduce((sum, p) => sum + p.reviewCount, 0);
  const averageRating = (
    hostProperties.reduce((sum, p) => sum + p.rating * p.reviewCount, 0) / totalReviews
  ).toFixed(1);

  const handleSendMessage = () => {
    if (message.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      
      setChatMessages([...chatMessages, { text: message, isUser: true, time: timeString }]);
      setMessage('');

      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          { text: 'Thank you for your message. I will get back to you soon!', isUser: false, time: timeString },
        ]);
      }, 1000);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen 
        options={{ 
          title: 'Host Details',
          headerBackTitle: 'Back',
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hostHeader}>
          {hostInfo.hostPhoto ? (
            <Image
              source={{ uri: hostInfo.hostPhoto }}
              style={styles.hostAvatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.hostAvatarPlaceholder}>
              <Text style={styles.hostInitial}>{hostInfo.hostName.charAt(0)}</Text>
            </View>
          )}
          <Text style={styles.hostName}>{hostInfo.hostName}</Text>
          <Text style={styles.hostLabel}>Property Host</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{hostProperties.length}</Text>
              <Text style={styles.statLabel}>Properties</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{averageRating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalReviews}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Host</Text>
          <Text style={styles.aboutText}>
            Professional property host with years of experience in hospitality. 
            Dedicated to providing exceptional stays and ensuring guest satisfaction. 
            Quick to respond and always available to assist with any needs.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Properties ({hostProperties.length})</Text>
          <View style={styles.propertiesList}>
            {hostProperties.map((property) => (
              <TouchableOpacity
                key={property.id}
                style={styles.propertyCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/property/${property.id}` as any);
                }}
              >
                <Image
                  source={{ uri: property.images[0] }}
                  style={styles.propertyImage}
                  contentFit="cover"
                />
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyTitle} numberOfLines={1}>
                    {property.title}
                  </Text>
                  <View style={styles.propertyLocation}>
                    <MapPin color={Colors.textLight} size={12} />
                    <Text style={styles.propertyLocationText} numberOfLines={1}>
                      {property.location}, {property.lga}
                    </Text>
                  </View>
                  <View style={styles.propertyFooter}>
                    <View style={styles.propertyRating}>
                      <Star color={Colors.accent} fill={Colors.accent} size={12} />
                      <Text style={styles.ratingText}>{property.rating}</Text>
                    </View>
                    <Text style={styles.propertyPrice}>₦{property.price.toLocaleString()}/night</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chat with Host</Text>
          <View style={styles.chatContainer}>
            {chatMessages.map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.chatBubble,
                  msg.isUser ? styles.userBubble : styles.hostBubble,
                ]}
              >
                <Text style={[
                  styles.chatText,
                  msg.isUser ? styles.userText : styles.hostText,
                ]}>
                  {msg.text}
                </Text>
                <Text style={[
                  styles.chatTime,
                  msg.isUser ? styles.userTime : styles.hostTime,
                ]}>
                  {msg.time}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textLight}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!message.trim()}
        >
          <Send color={message.trim() ? Colors.card : Colors.textLight} size={20} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  hostHeader: {
    alignItems: 'center' as const,
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  hostAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  hostAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  hostInitial: {
    fontSize: 40,
    fontWeight: 'bold' as const,
    color: Colors.card,
  },
  hostName: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  hostLabel: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 24,
  },
  statBox: {
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  propertiesList: {
    gap: 12,
  },
  propertyCard: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  propertyImage: {
    width: 100,
    height: 100,
  },
  propertyInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between' as const,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  propertyLocation: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 8,
  },
  propertyLocationText: {
    fontSize: 13,
    color: Colors.textLight,
    flex: 1,
  },
  propertyFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  propertyRating: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  propertyPrice: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  chatContainer: {
    gap: 12,
    paddingBottom: 16,
  },
  chatBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end' as const,
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  hostBubble: {
    alignSelf: 'flex-start' as const,
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chatText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  userText: {
    color: Colors.card,
  },
  hostText: {
    color: Colors.text,
  },
  chatTime: {
    fontSize: 11,
  },
  userTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  hostTime: {
    color: Colors.textLight,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
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
