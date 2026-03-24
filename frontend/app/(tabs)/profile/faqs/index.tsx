import React, { useLayoutEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Text, View, useThemeColor } from "@/components/Themed";
import { useRouter, useNavigation } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/auth";
import { faqsAPI } from "@/services/api";
import { ActivityIndicator } from "react-native";

export default function FAQListScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [faqs, setFaqs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const textColor = useThemeColor({}, "text");
  const textLightColor = useThemeColor({}, "textLight");
  const backgroundColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const shadowColor = useThemeColor({}, "shadow");

  React.useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const response = await faqsAPI.getAll();
      const allFaqs = response.data;
      
      // Filter based on user role
      const userRole = user?.role === "host" ? "host" : "guest";
      const filteredFaqs = allFaqs.filter((f: any) => 
        f.targetAudience === "both" || f.targetAudience === userRole
      );
      
      setFaqs(filteredFaqs);
    } catch (err) {
      console.error("Failed to fetch FAQs:", err);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor, shadowColor }]} 
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>FAQs</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listContainer}>
          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : faqs.length > 0 ? (
            faqs.map((faq) => (
              <TouchableOpacity
                key={faq.id}
                style={[styles.faqItem, { backgroundColor: cardColor, borderBottomColor: borderColor }]}
                onPress={() => router.push(`/(tabs)/profile/faqs/${faq.id}` as any)}
              >
                <Text style={[styles.faqQuestion, { color: textColor }]}>{faq.question}</Text>
                <ChevronRight size={20} color={Colors.primary} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ padding: 40, alignItems: 'center', backgroundColor: 'transparent' }}>
              <Text style={{ color: textLightColor }}>No FAQs available at the moment.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 15,
  },
  content: {
    paddingBottom: 40,
  },
  listContainer: {
    paddingTop: 10,
    backgroundColor: "transparent",
  },
  faqItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 15,
  },
});
