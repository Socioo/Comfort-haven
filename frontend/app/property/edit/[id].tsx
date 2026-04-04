import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  X,
  Upload,
  Video,
  ChevronLeft
} from 'lucide-react-native';
import { Text, View, Card } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/auth';
import { useTheme } from '@/contexts/theme';
import { propertiesAPI, API_BASE_URL } from '@/services/api';
import { useProperties } from '@/contexts/properties';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rf, ms, vs } from '@/utils/responsive';

export default function EditPropertyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { updateProperty } = useProperties();
  
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [property, setProperty] = useState<any>(null);

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
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const styles = createStyles(themeColors);

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const response = await propertiesAPI.getById(id as string);
      const data = response.data;
      setProperty(data);
      
      setFormData({
        title: data.title || "",
        description: data.description || "",
        location: data.location || "",
        address: data.address || "",
        lga: data.lga || "",
        price: data.price?.toString() || "",
        bedrooms: data.bedrooms?.toString() || "",
        bathrooms: data.bathrooms?.toString() || "",
        guests: data.guests?.toString() || "",
        amenities: data.amenities?.join(", ") || "",
      });
      setExistingImages(data.images || []);
    } catch (error) {
      console.error("Error fetching property:", error);
      Alert.alert("Error", "Failed to load property details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdateProperty = async () => {
    if (!user || !property) return;
    if (!formData.title || !formData.location || !formData.price) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      setIsUpdating(true);
      
      let imageUrls = [...existingImages];
      
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
        const newUrls = uploadResponse.data.map((f: any) => f.url);
        imageUrls = [...imageUrls, ...newUrls];
      }
      
      const amenitiesList = formData.amenities.split(",").map((a: string) => a.trim()).filter((a: string) => a.length > 0);
      
      const updates = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        address: formData.address,
        lga: formData.lga,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms) || 1,
        bathrooms: parseInt(formData.bathrooms) || 1,
        guests: parseInt(formData.guests) || 2,
        images: imageUrls,
        amenities: amenitiesList,
      };

      await updateProperty(property.id, updates);
      
      Alert.alert("Success", "Property updated successfully", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error("Error updating property:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to update property";
      Alert.alert("Error", typeof errorMessage === 'string' ? errorMessage : "Failed to update property");
    } finally {
      setIsUpdating(false);
    }
  };

  const removeExistingImage = (url: string) => {
    setExistingImages(existingImages.filter(img => img !== url));
  };

  const removeSelectedMedia = (index: number) => {
    setSelectedMedia(selectedMedia.filter((_, i) => i !== index));
  };

  const getMediaUrl = (url: string) => {
    if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading property details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={themeColors.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Property</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} 
              value={formData.title} 
              onChangeText={(text) => setFormData({ ...formData, title: text })} 
              placeholder="e.g., Luxury 3BR Apartment" 
              placeholderTextColor={themeColors.textLight} 
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput 
              style={[styles.input, styles.textArea, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} 
              value={formData.description} 
              onChangeText={(text) => setFormData({ ...formData, description: text })} 
              placeholder="Describe your property" 
              placeholderTextColor={themeColors.textLight} 
              multiline 
              numberOfLines={4} 
            />
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>Location *</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} 
                value={formData.location} 
                onChangeText={(text) => setFormData({ ...formData, location: text })} 
                placeholder="e.g., Nassarawa GRA" 
                placeholderTextColor={themeColors.textLight} 
              />
            </View>
            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>LGA</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} 
                value={formData.lga} 
                onChangeText={(text) => setFormData({ ...formData, lga: text })} 
                placeholder="e.g., Nassarawa" 
                placeholderTextColor={themeColors.textLight} 
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} 
              value={formData.address} 
              onChangeText={(text) => setFormData({ ...formData, address: text })} 
              placeholder="e.g., No. 42 Boundary Road" 
              placeholderTextColor={themeColors.textLight} 
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Price per Night (₦) *</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} 
              value={formData.price} 
              onChangeText={(text) => setFormData({ ...formData, price: text })} 
              placeholder="25000" 
              placeholderTextColor={themeColors.textLight} 
              keyboardType="numeric" 
            />
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroupThird}>
              <Text style={styles.label}>Bedrooms</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} 
                value={formData.bedrooms} 
                onChangeText={(text) => setFormData({ ...formData, bedrooms: text })} 
                placeholder="3" 
                placeholderTextColor={themeColors.textLight} 
                keyboardType="numeric" 
              />
            </View>
            <View style={styles.formGroupThird}>
              <Text style={styles.label}>Bathrooms</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} 
                value={formData.bathrooms} 
                onChangeText={(text) => setFormData({ ...formData, bathrooms: text })} 
                placeholder="2" 
                placeholderTextColor={themeColors.textLight} 
                keyboardType="numeric" 
              />
            </View>
            <View style={styles.formGroupThird}>
              <Text style={styles.label}>Guests</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} 
                value={formData.guests} 
                onChangeText={(text) => setFormData({ ...formData, guests: text })} 
                placeholder="6" 
                placeholderTextColor={themeColors.textLight} 
                keyboardType="numeric" 
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Media (Images/Videos) *</Text>
            <TouchableOpacity onPress={pickMedia}>
              <Card style={[styles.mediaPicker, { borderStyle: 'dashed', borderColor: themeColors.border }]}>
                <Upload color={Colors.primary} size={24} />
                <Text style={styles.mediaPickerText}>Add More Media</Text>
              </Card>
            </TouchableOpacity>
            
            {(existingImages.length > 0 || selectedMedia.length > 0) && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviewList}>
                {existingImages.map((url, index) => (
                  <View key={`existing-${index}`} style={styles.mediaPreviewContainer}>
                    <Image 
                      source={{ uri: getMediaUrl(url) }} 
                      style={[styles.mediaPreview, { backgroundColor: themeColors.border }]} 
                    />
                    <TouchableOpacity style={styles.removeMedia} onPress={() => removeExistingImage(url)}>
                      <X color="white" size={12} />
                    </TouchableOpacity>
                  </View>
                ))}
                {selectedMedia.map((asset, index) => (
                  <View key={`selected-${index}`} style={styles.mediaPreviewContainer}>
                    <Image source={{ uri: asset.uri }} style={[styles.mediaPreview, { backgroundColor: themeColors.border }]} />
                    <TouchableOpacity style={styles.removeMedia} onPress={() => removeSelectedMedia(index)}>
                      <X color="white" size={12} />
                    </TouchableOpacity>
                    {asset.type === 'video' && (
                      <View style={styles.videoBadge}>
                        <Video color="white" size={12} />
                      </View>
                    )}
                    <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Amenities (comma separated)</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} 
              value={formData.amenities} 
              onChangeText={(text) => setFormData({ ...formData, amenities: text })} 
              placeholder="WiFi, AC, Kitchen, Pool" 
              placeholderTextColor={themeColors.textLight} 
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, (isUpdating || loading) && styles.submitButtonDisabled]} 
            onPress={handleUpdateProperty} 
            disabled={isUpdating || loading}
          >
            <Text style={styles.submitButtonText}>{isUpdating ? "Saving..." : "Save Changes"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: rf(16), color: themeColors.textLight },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: ms(20), 
    borderBottomWidth: 1 
  },
  headerTitle: { fontSize: rf(20), fontWeight: 'bold', color: themeColors.text },
  backButton: { padding: 4 },
  content: { flex: 1, padding: ms(20) },
  formGroup: { marginBottom: vs(20) },
  formRow: { flexDirection: 'row', gap: ms(12), marginBottom: vs(20) },
  formGroupHalf: { flex: 1 },
  formGroupThird: { flex: 1 },
  label: { fontSize: rf(14), fontWeight: '600', marginBottom: vs(8), color: themeColors.text },
  input: { borderRadius: ms(12), padding: ms(14), fontSize: rf(16), borderWidth: 1 },
  textArea: { minHeight: vs(120), textAlignVertical: 'top' },
  mediaPicker: { 
    borderRadius: ms(12), 
    padding: vs(24), 
    borderWidth: 1, 
    borderStyle: 'dashed', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: ms(8) 
  },
  mediaPickerText: { fontSize: rf(14), color: Colors.primary, fontWeight: '600' },
  mediaPreviewList: { marginTop: vs(12) },
  mediaPreviewContainer: { position: 'relative', marginRight: ms(12) },
  mediaPreview: { width: ms(90), height: ms(90), borderRadius: ms(12) },
  removeMedia: { 
    position: 'absolute', 
    top: -8, 
    right: -8, 
    backgroundColor: Colors.error, 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: 'white' 
  },
  videoBadge: { 
    position: 'absolute', 
    bottom: 5, 
    right: 5, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  newBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: { color: 'white', fontSize: 8, fontWeight: 'bold' },
  submitButton: { 
    backgroundColor: Colors.primary, 
    borderRadius: ms(12), 
    padding: vs(16), 
    alignItems: 'center', 
    marginTop: vs(10), 
    marginBottom: vs(40) 
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: rf(16), fontWeight: 'bold', color: '#fff' },
});
