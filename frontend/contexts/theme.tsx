import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useDeviceColorScheme } from "react-native";

export type ThemeMode = "system" | "light" | "dark";
export type ColorScheme = "light" | "dark";

interface ThemeContextData {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => Promise<void>;
  colorScheme: ColorScheme;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const deviceColorScheme = useDeviceColorScheme() as ColorScheme;
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("@theme_mode").then((savedTheme) => {
      if (savedTheme) {
        setThemeState(savedTheme as ThemeMode);
      }
      setIsLoaded(true);
    });
  }, []);

  const setTheme = async (mode: ThemeMode) => {
    setThemeState(mode);
    await AsyncStorage.setItem("@theme_mode", mode);
  };

  const colorScheme: ColorScheme =
    theme === "system" ? deviceColorScheme || "light" : theme;

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
