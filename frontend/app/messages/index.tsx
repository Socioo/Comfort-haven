import React, { useEffect, useState } from "react";
import {
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { API_BASE_URL, messagesAPI } from "@/services/api";
import { Image } from "expo-image";
import { useAuth } from "@/contexts/auth";
import { Text, View, Card } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useTheme } from "@/contexts/theme";
import UserAvatar from "@/components/UserAvatar";
import { MessageSquare } from "lucide-react-native";

const getImageUrl = (url: string | undefined | null) => {
  if (!url) return undefined;
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

interface Conversation {
  user: {
    id: string;
    name: string;
    profileImage: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function InboxScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const response = await messagesAPI.getInbox();
      setConversations(response.data);
    } catch (error) {
      console.error("Failed to fetch inbox:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.conversationItem, { backgroundColor: themeColors.card }]}
      onPress={() => router.push(`/messages/${item.user.id}` as any)}
    >
      <UserAvatar 
        name={item.user.name} 
        image={item.user.profileImage} 
        size={50} 
        style={styles.avatar}
      />

      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.userName}>{item.user.name}</Text>
          <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
        </View>
        <Text
          style={[
            styles.lastMessage,
            item.unreadCount > 0 && styles.unreadMessage,
          ]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>

      {item.unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <MessageSquare size={48} color={themeColors.textLight} />
        <Text style={styles.loginText}>Sign in to view your messages</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push("/auth/login" as any)}
        >
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {conversations.length === 0 ? (
        <View style={styles.centerContainer}>
          <MessageSquare size={48} color={themeColors.textLight} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            When you contact a host, your messages will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.user.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={() => fetchConversations(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  listContainer: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  time: {
    fontSize: 12,
  },
  lastMessage: {
    fontSize: 14,
  },
  unreadMessage: {
    fontWeight: "600",
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
  loginText: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: 16,
    marginBottom: 24,
  },
  btn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
