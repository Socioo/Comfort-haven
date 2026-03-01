import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, Tabs } from "expo-router";
import { Pressable } from "react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import {
  Briefcase,
  Heart,
  Home,
  House,
  LayoutDashboard,
  Search,
  User,
  MessageCircle,
} from "lucide-react-native";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

import { useAuth } from "@/contexts/auth";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  const isHostOrAdmin = user?.role === "host" || user?.role === "admin";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarShowLabel: false,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} />,
          headerRight: () => (
            <Link href={"/messages" as any} asChild>
              <Pressable style={{ marginRight: 15 }}>
                {({ pressed }) => (
                  <MessageCircle
                    size={25}
                    color={Colors[colorScheme ?? "light"].text}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => <Search color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarIcon: ({ color }) => <Heart color={color} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          tabBarIcon: ({ color }) => <Briefcase color={color} />,
        }}
      />
      <Tabs.Screen
        name="(host)"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
          href: isHostOrAdmin ? undefined : null, // Hide if not host/admin
        }}
      />
      <Tabs.Screen
        name="(properties)"
        options={{
          title: "Properties",
          tabBarIcon: ({ color }) => <House color={color} />,
          href: isHostOrAdmin ? undefined : null, // Hide if not host/admin
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User color={color} />,
        }}
      />
    </Tabs>
  );
}
