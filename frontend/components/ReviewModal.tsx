import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Text, Card } from "./Themed";
import Colors from "@/constants/Colors";
import { useTheme } from "@/contexts/theme";
import { Star, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { reviewsAPI } from "@/services/api";

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  propertyId: string;
  onSuccess: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  propertyId,
  onSuccess,
}) => {
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      await reviewsAPI.create({
        propertyId,
        rating,
        comment,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
      setRating(0);
      setComment("");
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
          >
            <View style={[styles.content, { backgroundColor: themeColors.card }]}>
              <View style={styles.header}>
                <Text style={styles.title}>Write a Review</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={themeColors.textLight} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Your Rating</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => {
                      setRating(star);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Star
                      size={40}
                      color={star <= rating ? Colors.accent : themeColors.border}
                      fill={star <= rating ? Colors.accent : "transparent"}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Your Experience</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }
                ]}
                placeholder="Tell us what you liked or what could be improved..."
                placeholderTextColor={themeColors.textLight}
                multiline
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!rating || loading) && styles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={!rating || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    width: "100%",
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
    backgroundColor: "transparent",
  },
  input: {
    borderRadius: 12,
    padding: 16,
    height: 120,
    textAlignVertical: "top",
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ReviewModal;
