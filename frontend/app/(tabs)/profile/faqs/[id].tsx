import React, { useLayoutEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Text, View, useThemeColor } from "@/components/Themed";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import Colors from "@/constants/Colors";
import { faqsAPI } from "@/services/api";
import { ActivityIndicator } from "react-native";

export default function FAQDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const [faq, setFaq] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const textColor = useThemeColor({}, "text");
  const textLightColor = useThemeColor({}, "textLight");
  const backgroundColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const shadowColor = useThemeColor({}, "shadow");

  React.useEffect(() => {
    if (id) {
      fetchFaq();
    }
  }, [id]);

  const fetchFaq = async () => {
    try {
      const response = await faqsAPI.getById(id as string);
      setFaq(response.data);
    } catch (err) {
      console.error("Failed to fetch FAQ:", err);
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
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor, shadowColor }]} 
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>FAQs</Text>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
      </View>
    );
  }

  if (!faq) return null;

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
        contentContainerStyle={[styles.content, { backgroundColor }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.detailContainer, { backgroundColor: cardColor, shadowColor }]}>
          <Text style={styles.detailQuestion}>{faq.question}</Text>
          <Text style={[styles.detailAnswer, { color: textLightColor }]}>{faq.answer}</Text>
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
    minHeight: '100%',
    paddingBottom: 40,
  },
  detailContainer: {
    padding: 30,
    margin: 20,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  detailQuestion: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.primary,
    marginBottom: 20,
    lineHeight: 32,
  },
  detailAnswer: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: "400",
  },
});
