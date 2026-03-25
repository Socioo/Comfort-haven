import React, { useState, useLayoutEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Text, View } from "@/components/Themed";
import { useRouter, useNavigation } from "expo-router";
import { ChevronLeft, Check, Monitor, Moon, Sun } from "lucide-react-native";
import Colors from "@/constants/Colors";
import { useTheme, ThemeMode } from "@/contexts/theme";

export default function AppearanceScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme, setTheme, colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  
  const styles = createStyles(themeColors);

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

  const themes = [
    { id: "light", title: "Light", icon: Sun, description: "Classic light theme" },
    { id: "dark", title: "Dark", icon: Moon, description: "Easier on your eyes in dark environments" },
    { id: "system", title: "System Default", icon: Monitor, description: "Adapts to your device settings" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appearance</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Theme</Text>
        <Text style={styles.subtitle}>
          Choose how Comfort Haven looks to you.
        </Text>

        <View style={styles.optionsContainer}>
          {themes.map((t, index) => {
            const Icon = t.icon;
            const isSelected = theme === t.id;
            return (
              <React.Fragment key={t.id}>
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => setTheme(t.id as ThemeMode)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionIconContainer}>
                    <Icon size={22} color={isSelected ? Colors.primary : themeColors.textLight} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionTitle, isSelected && styles.selectedTitle]}>{t.title}</Text>
                    <Text style={styles.optionDescription}>{t.description}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkContainer}>
                      <Check size={20} color={Colors.primary} strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
                {index < themes.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
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
    borderBottomColor: themeColors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: themeColors.card,
    shadowColor: themeColors.shadow || "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 15,
  },
  content: {
    padding: 25,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 30,
    lineHeight: 20,
    color: themeColors.textLight,
  },
  optionsContainer: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: themeColors.shadow || "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: 'transparent',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    backgroundColor: themeColors.background,
  },
  optionTextContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: 'transparent',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  selectedTitle: {
    color: Colors.primary,
  },
  optionDescription: {
    fontSize: 13,
    color: themeColors.textLight,
  },
  checkContainer: {
    marginLeft: 15,
    backgroundColor: 'transparent',
  },
  divider: {
    height: 1,
    backgroundColor: themeColors.border,
    marginLeft: 75,
  },
});
