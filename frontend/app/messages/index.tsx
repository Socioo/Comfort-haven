import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { messagesAPI } from "@/services/api";
import Colors from "@/constants/Colors";
import { Image } from "expo-image";
import { useAuth } from "@/contexts/auth";
import { MessageSquare } from "lucide-react-native";

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
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const response = await messagesAPI.getInbox();
      setConversations(response.data);
    } catch (error) {
      console.error("Failed to fetch inbox:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => router.push(`/messages/${item.user.id}` as any)}
    >
      {item.user.profileImage ? (
        <Image
          source={{ uri: item.user.profileImage }}
          style={styles.avatar}
          contentFit="cover"
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>{item.user.name.charAt(0)}</Text>
        </View>
      )}

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
        <MessageSquare size={48} color={Colors.textLight} />
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
          <MessageSquare size={48} color={Colors.textLight} />
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
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
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
    color: Colors.text,
  },
  time: {
    fontSize: 12,
    color: Colors.textLight,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textLight,
  },
  unreadMessage: {
    color: Colors.text,
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
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    color: Colors.text,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textLight,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
  loginText: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: 16,
    marginBottom: 24,
    color: Colors.text,
  },
  btn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
