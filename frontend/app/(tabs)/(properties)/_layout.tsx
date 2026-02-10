import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/auth";
import { useProperties } from "@/contexts/properties";
import { router } from "expo-router";
import { Bath, Bed, MapPin, Plus, Trash2, Users, X } from "lucide-react-native";
import React, { useState } from "react";
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
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    lga: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    guests: "",
    imageUrl: "",
    amenities: "",
    latitude: "",
    longitude: "",
  });

  const hostProperties = user ? getHostProperties(user.id) : [];

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

    const images = formData.imageUrl
      ? formData.imageUrl
          .split(",")
          .map((url) => url.trim())
          .filter((url) => url.length > 0)
      : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"];

    try {
      await addProperty({
        title: formData.title,
        description:
          formData.description || "Beautiful property available for rent",
        location: formData.location,
        lga: formData.lga || formData.location,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms) || 1,
        bathrooms: parseInt(formData.bathrooms) || 1,
        guests: parseInt(formData.guests) || 2,
        images,
        amenities: amenitiesList.length > 0 ? amenitiesList : ["WiFi", "AC"],
        hostId: user.id,
        hostName: user.name,
        hostPhoto: user.photoUrl,
        latitude: parseFloat(formData.latitude) || 12.0022,
        longitude: parseFloat(formData.longitude) || 8.5919,
        availableDates: [],
      });

      setFormData({
        title: "",
        description: "",
        location: "",
        lga: "",
        price: "",
        bedrooms: "",
        bathrooms: "",
        guests: "",
        imageUrl: "",
        amenities: "",
        latitude: "",
        longitude: "",
      });
      setShowAddModal(false);
      Alert.alert("Success", "Property added successfully!");
    } catch (error) {
      console.error("Error adding property:", error);
      Alert.alert("Error", "Failed to add property");
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
      ]
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
              <Text style={styles.label}>Image URLs (comma separated)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.imageUrl}
                onChangeText={(text) =>
                  setFormData({ ...formData, imageUrl: text })
                }
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={3}
              />
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

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Latitude</Text>
                <TextInput
                  style={styles.input}
                  value={formData.latitude}
                  onChangeText={(text) =>
                    setFormData({ ...formData, latitude: text })
                  }
                  placeholder="12.0022"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Longitude</Text>
                <TextInput
                  style={styles.input}
                  value={formData.longitude}
                  onChangeText={(text) =>
                    setFormData({ ...formData, longitude: text })
                  }
                  placeholder="8.5919"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isAddingProperty && styles.submitButtonDisabled,
              ]}
              onPress={handleAddProperty}
              disabled={isAddingProperty}
            >
              <Text style={styles.submitButtonText}>
                {isAddingProperty ? "Adding..." : "Add Property"}
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
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
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
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
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
