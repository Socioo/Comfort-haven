import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/auth";
import { useProperties } from "@/contexts/properties";
import { Bath, Bed, MapPin, Plus, Trash2, Users, X, Image as ImageIcon, Video, Upload } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import * as ImagePicker from 'expo-image-picker';
import { propertiesAPI } from "@/services/api";
import { router, useLocalSearchParams } from "expo-router";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HostPropertiesScreen() {
  const { user } = useAuth();
  const { getHostProperties, addProperty, deleteProperty, isAddingProperty } =
    useProperties();
  const { action } = useLocalSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (action === 'add') {
      setShowAddModal(true);
      // We don't necessarily need to clear it here, as navigating 
      // back and forth will re-trigger only if explicitly passed.
    }
  }, [action]);

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
  const [isUploading, setIsUploading] = useState(false);

  const hostProperties = user ? getHostProperties(user.id) : [];

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

    const amenitiesList = formData.amenities
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);


    try {
      setIsUploading(true);
      let imageUrls: string[] = [];

      if (selectedMedia.length > 0) {
        const uploadFormData = new FormData();
        selectedMedia.forEach((asset, index) => {
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

      await addProperty({
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
        hostName: user.name,
        hostPhoto: user.photoUrl,
        latitude: 12.0022, // Defaulting to Kano since addr is used
        longitude: 8.5919,
        availableDates: [],
      });

      setFormData({
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
      setSelectedMedia([]);
      setShowAddModal(false);
      Alert.alert("Success", "Property added successfully!");
    } catch (error) {
      console.error("Error adding property:", error);
      Alert.alert("Error", "Failed to add property");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProperty = (propertyId: string) => {
    Alert.alert(
      "Delete Property",
      "Are you sure you want to delete this property?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProperty(propertyId);
              Alert.alert("Success", "Property deleted successfully");
            } catch (error) {
              console.error("Error deleting property:", error);
              Alert.alert("Error", "Failed to delete property");
            }
          },
        },
      ],
    );
  };

  if (user?.role !== "host") {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            This feature is only available for hosts
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Properties</Text>
            <Text style={styles.headerSubtitle}>
              {hostProperties.length}{" "}
              {hostProperties.length === 1 ? "property" : "properties"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus color={Colors.white} size={24} />
          </TouchableOpacity>
        </View>

        {hostProperties.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No properties yet</Text>
            <Text style={styles.emptyStateText}>
              Start by adding your first property
            </Text>
          </View>
        ) : (
          <View style={styles.propertiesList}>
            {hostProperties.map((property: any) => (
              <TouchableOpacity
                key={property.id}
                style={styles.propertyCard}
                onPress={() => router.push(`/property/${property.id}`)}
              >
                <Image
                  source={{ uri: property.images[0] }}
                  style={styles.propertyImage}
                  resizeMode="cover"
                />
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyTitle} numberOfLines={1}>
                    {property.title}
                  </Text>
                  <View style={styles.propertyLocation}>
                    <MapPin color={Colors.textLight} size={14} />
                    <Text style={styles.propertyLocationText} numberOfLines={1}>
                      {property.location}
                    </Text>
                  </View>
                  <View style={styles.propertyDetails}>
                    <View style={styles.propertyDetail}>
                      <Bed color={Colors.textLight} size={14} />
                      <Text style={styles.propertyDetailText}>
                        {property.bedrooms}
                      </Text>
                    </View>
                    <View style={styles.propertyDetail}>
                      <Bath color={Colors.textLight} size={14} />
                      <Text style={styles.propertyDetailText}>
                        {property.bathrooms}
                      </Text>
                    </View>
                    <View style={styles.propertyDetail}>
                      <Users color={Colors.textLight} size={14} />
                      <Text style={styles.propertyDetailText}>
                        {property.guests}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.propertyFooter}>
                    <Text style={styles.propertyPrice}>
                      ₦{property.price.toLocaleString()}/night
                    </Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteProperty(property.id)}
                    >
                      <Trash2 color={Colors.error} size={18} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Property</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) =>
                  setFormData({ ...formData, title: text })
                }
                placeholder="e.g., Luxury 3BR Apartment"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                placeholder="Describe your property"
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Location *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) =>
                    setFormData({ ...formData, location: text })
                  }
                  placeholder="e.g., Nassarawa GRA"
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>LGA</Text>
                <TextInput
                  style={styles.input}
                  value={formData.lga}
                  onChangeText={(text) =>
                    setFormData({ ...formData, lga: text })
                  }
                  placeholder="e.g., Nassarawa"
                  placeholderTextColor={Colors.textLight}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={styles.input}
                value={formData.address}
                onChangeText={(text) =>
                  setFormData({ ...formData, address: text })
                }
                placeholder="e.g., No. 42 Boundary Road"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Price per Night (₦) *</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) =>
                  setFormData({ ...formData, price: text })
                }
                placeholder="25000"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupThird}>
                <Text style={styles.label}>Bedrooms</Text>
                <TextInput
                  style={styles.input}
                  value={formData.bedrooms}
                  onChangeText={(text) =>
                    setFormData({ ...formData, bedrooms: text })
                  }
                  placeholder="3"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroupThird}>
                <Text style={styles.label}>Bathrooms</Text>
                <TextInput
                  style={styles.input}
                  value={formData.bathrooms}
                  onChangeText={(text) =>
                    setFormData({ ...formData, bathrooms: text })
                  }
                  placeholder="2"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroupThird}>
                <Text style={styles.label}>Guests</Text>
                <TextInput
                  style={styles.input}
                  value={formData.guests}
                  onChangeText={(text) =>
                    setFormData({ ...formData, guests: text })
                  }
                  placeholder="6"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Media (Images/Videos) *</Text>
              <TouchableOpacity style={styles.mediaPicker} onPress={pickMedia}>
                <Upload color={Colors.primary} size={24} />
                <Text style={styles.mediaPickerText}>Select Images or Videos</Text>
              </TouchableOpacity>
              {selectedMedia.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviewList}>
                  {selectedMedia.map((asset, index) => (
                    <View key={index} style={styles.mediaPreviewContainer}>
                      <Image source={{ uri: asset.uri }} style={styles.mediaPreview} />
                      <TouchableOpacity 
                        style={styles.removeMedia} 
                        onPress={() => setSelectedMedia(selectedMedia.filter((_, i) => i !== index))}
                      >
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
              <TextInput
                style={styles.input}
                value={formData.amenities}
                onChangeText={(text) =>
                  setFormData({ ...formData, amenities: text })
                }
                placeholder="WiFi, AC, Kitchen, Pool"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            {/* Removed internal debug inputs for coordinates */}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (isAddingProperty || isUploading) && styles.submitButtonDisabled,
              ]}
              onPress={handleAddProperty}
              disabled={isAddingProperty || isUploading}
            >
              <Text style={styles.submitButtonText}>
                {isAddingProperty || isUploading ? "Processing..." : "Add Property"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    elevation: 8,
    boxShadow: `0px 4px 8px ${Colors.primary}4D`, // 4D is approx 30% alpha
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center" as const,
  },
  propertiesList: {
    padding: 20,
    gap: 16,
  },
  propertyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden" as const,
    elevation: 4,
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
  },
  propertyImage: {
    width: "100%",
    height: 200,
    backgroundColor: Colors.border,
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  propertyLocation: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    marginBottom: 12,
  },
  propertyLocationText: {
    fontSize: 14,
    color: Colors.textLight,
    flex: 1,
  },
  propertyDetails: {
    flexDirection: "row" as const,
    gap: 16,
    marginBottom: 12,
  },
  propertyDetail: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  propertyDetailText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  propertyFooter: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  deleteButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: "row" as const,
    gap: 12,
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  formGroupThird: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top" as const,
  },
  mediaPicker: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mediaPickerText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  mediaPreviewList: {
    marginTop: 12,
  },
  mediaPreviewContainer: {
    position: 'relative',
    marginRight: 10,
  },
  mediaPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  removeMedia: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.error,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
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
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center" as const,
    marginTop: 10,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: "center" as const,
  },
});
