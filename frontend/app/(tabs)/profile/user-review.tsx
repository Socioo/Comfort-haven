import React, { useState, useLayoutEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  View as DefaultView,
} from "react-native";
import { Text, View } from "@/components/Themed";
import { useRouter, useNavigation } from "expo-router";
import { ChevronLeft, Star } from "lucide-react-native";
import Colors from "@/constants/Colors";
import { reviewsAPI } from "@/services/api";
import * as Haptics from "expo-haptics";

export default function UserReviewScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a star rating.");
      return;
    }
    if (!comment.trim()) {
      Alert.alert("Error", "Please write a message.");
      return;
    }

    try {
      setIsSubmitting(true);
      await reviewsAPI.create({
        rating,
        comment: comment.trim(),
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Your review has been submitted successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert("Error", "Failed to submit review. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRating = (value: number) => {
    setRating(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const starSize = width > 400 ? 35 : 30;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User review</Text>
        </View>

        <ScrollView 
          contentContainerStyle={[
            styles.content, 
            { paddingBottom: height * 0.05 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Submit your review</Text>

          <View style={[styles.inputContainer, { minHeight: height * 0.25 }]}>
            <TextInput
              style={styles.input}
              placeholder="Write message"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
            />
          </View>

          <DefaultView style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity 
                key={star} 
                onPress={() => handleRating(star)}
                activeOpacity={0.7}
                style={styles.starTouch}
              >
                <Star
                  size={starSize}
                  color={star <= rating ? Colors.accent : Colors.border}
                  fill={star <= rating ? Colors.accent : "transparent"}
                />
              </TouchableOpacity>
            ))}
          </DefaultView>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 15,
    color: Colors.text,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: Colors.primary,
  },
  inputContainer: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 15,
    padding: 15,
    backgroundColor: Colors.card,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  input: {
    fontSize: 14,
    color: Colors.text,
    height: "100%",
    lineHeight: 20,
    backgroundColor: "transparent",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
    gap: 8,
    backgroundColor: "transparent",
  },
  starTouch: {
    padding: 4,
    backgroundColor: "transparent",
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    backgroundColor: "transparent",
    borderTopWidth: 0,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
