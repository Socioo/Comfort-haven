import React from "react";
import { View, StyleSheet, Text, ViewStyle, TextStyle } from "react-native";
import { Image } from "expo-image";
import Colors from "@/constants/Colors";
import { User as UserIcon } from "lucide-react-native";
import { API_BASE_URL } from "@/services/api";

interface UserAvatarProps {
  name?: string;
  image?: string;
  size?: number;
  style?: ViewStyle;
}

const getImageUrl = (url: string | undefined | null) => {
  if (!url) return undefined;
  if (
    url.startsWith("http") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  )
    return url;
  
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  if (cleanUrl.startsWith("/uploads")) return `${API_BASE_URL}${cleanUrl}`;
  return `${API_BASE_URL}/uploads${cleanUrl}`;
};

const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  name = "User",
  image,
  size = 40,
  style,
}) => {
  const imageUrl = getImageUrl(image);

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...style,
  };

  const initialsStyle: TextStyle = {
    color: "#FFFFFF",
    fontSize: size * 0.4,
    fontWeight: "bold",
  };

  if (imageUrl) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: imageUrl }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      </View>
    );
  }

  const initials = getInitials(name);

  return (
    <View style={[containerStyle, { backgroundColor: "#FFD1B9" }]}>
      {initials ? (
        <Text style={initialsStyle}>{initials}</Text>
      ) : (
        <UserIcon color="#FFFFFF" size={size * 0.6} />
      )}
    </View>
  );
};

export default UserAvatar;
