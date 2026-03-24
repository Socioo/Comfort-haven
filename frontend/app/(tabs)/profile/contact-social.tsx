import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  StyleSheet,
  View as DefaultView,
  Text as DefaultText,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Instagram, 
  Twitter,
  Globe,
  Facebook,
  ChevronRight,
  Music2
} from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { settingsAPI } from '@/services/api';
import { useFocusEffect, useNavigation } from 'expo-router';
import { Text, View, useThemeColor } from '@/components/Themed';

interface InfoField {
  id: string;
  label: string;
  value: string;
  icon: any;
  type: 'contact' | 'social';
}

export default function ContactSocialScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  
  const textColor = useThemeColor({}, 'text');
  const textLightColor = useThemeColor({}, 'textLight');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const shadowColor = useThemeColor({}, 'shadow');

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
  const [fields, setFields] = useState<InfoField[]>([
    { id: 'whatsapp', label: 'WhatsApp', value: '', icon: Phone, type: 'contact' },
    { id: 'email', label: 'Email address', value: '', icon: Mail, type: 'contact' },
    { id: 'address', label: 'Address', value: '', icon: MapPin, type: 'contact' },
    { id: 'instagram', label: 'Instagram', value: '', icon: Instagram, type: 'social' },
    { id: 'tiktok', label: 'Tiktok', value: '', icon: Music2, type: 'social' },
    { id: 'x', label: 'X', value: '', icon: Twitter, type: 'social' },
  ]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getAll();
      const settings = response.data;
      
      if (settings && Array.isArray(settings)) {
        setFields(prevFields => prevFields.map(field => {
          const setting = settings.find((s: any) => s.key === field.id);
          return setting ? { ...field, value: setting.value } : field;
        }));
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handlePress = (field: InfoField) => {
    if (!field.value || field.value === 'Non') return;

    let url = '';
    if (field.id === 'whatsapp') {
      const cleanPhone = field.value.replace(/\D/g, '');
      url = `whatsapp://send?phone=${cleanPhone}`;
    } else if (field.id === 'email') {
      url = `mailto:${field.value}`;
    } else if (field.id === 'instagram') {
      const handle = field.value.replace('@', '');
      url = `https://instagram.com/${handle}`;
    } else if (field.id === 'x') {
      const handle = field.value.replace('@', '');
      url = `https://twitter.com/${handle}`;
    } else if (field.id === 'tiktok') {
      const handle = field.value.replace('@', '');
      url = `https://tiktok.com/@${handle}`;
    }

    if (url) {
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback for web or if app not installed
          if (field.id === 'whatsapp') {
            const cleanPhone = field.value.replace(/\D/g, '');
            Linking.openURL(`https://wa.me/${cleanPhone}`);
          }
        }
      });
    }
  };

  const renderSection = (title: string, type: 'contact' | 'social') => {
    const sectionFields = fields.filter(f => f.type === type);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={[styles.card, { backgroundColor: cardColor, shadowColor }]}>
          {sectionFields.map((field, index) => {
            const hasValue = field.value && field.value !== 'Non';
            return (
              <React.Fragment key={field.id}>
                <TouchableOpacity 
                  style={styles.fieldRow} 
                  onPress={() => handlePress(field)}
                  disabled={!hasValue || field.id === 'address'}
                >
                  <View style={[styles.iconContainer, !hasValue && styles.iconContainerEmpty, { backgroundColor: hasValue ? Colors.primary + '15' : borderColor }]}>
                    <field.icon size={22} color={hasValue ? Colors.primary : textLightColor} strokeWidth={1.5} />
                  </View>
                  <View style={styles.fieldInfo}>
                    <Text style={[styles.fieldLabel, { color: textLightColor }]}>{field.label}</Text>
                    <Text style={[styles.fieldValue, !hasValue && styles.fieldValueEmpty, { color: hasValue ? textColor : textLightColor }]}>
                      {hasValue ? field.value : 'Not provided'}
                    </Text>
                  </View>
                  {hasValue && field.id !== 'address' && <ChevronRight size={18} color={textLightColor} />}
                </TouchableOpacity>
                {index < sectionFields.length - 1 && <View style={[styles.divider, { backgroundColor: borderColor }]} />}
              </React.Fragment>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading information...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Contact & Social</Text>
        <Text style={[styles.subtitle, { color: textLightColor }]}>Get in touch with us through our official channels.</Text>
      </View>

      {renderSection("Contact Information", "contact")}
      {renderSection("Social Media", "social")}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: textLightColor }]}>Version 1.0.0</Text>
        <Text style={[styles.footerText, { color: textLightColor }]}>© 2026 Comfort Haven. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 24,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerEmpty: {
    opacity: 0.5,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  fieldValueEmpty: {
    fontStyle: 'italic',
    fontSize: 14,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    marginLeft: 78,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
});
