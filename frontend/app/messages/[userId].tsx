import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from '@react-navigation/elements';
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { messagesAPI, usersAPI } from "@/services/api";
import { useAuth } from "@/contexts/auth";
import { Send, ArrowLeft } from "lucide-react-native";
import { Text, View, Card } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useTheme } from "@/contexts/theme";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

export default function ChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const { user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    if (userId && user) {
      loadData();
    }
  }, [userId, user]);

  const loadData = async () => {
    try {
      const [historyResponse, userResponse] = await Promise.all([
        messagesAPI.getChatHistory(userId as string),
        usersAPI.getById(userId as string),
      ]);
      setMessages(historyResponse.data);
      setOtherUser(userResponse.data);
    } catch (error) {
      console.error("Failed to load chat data:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;

    try {
      setSending(true);
      const response = await messagesAPI.sendMessage(
        userId as string,
        inputText.trim(),
      );

      // Optimistically add to list
      setMessages((prev) => [...prev, response.data]);
      setInputText("");

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;

    return (
      <View
        style={[
          styles.messageWrapper,
          isMe ? styles.messageWrapperRight : styles.messageWrapperLeft,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.messageBubbleRight : styles.messageBubbleLeft,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMe ? styles.messageTextRight : styles.messageTextLeft,
            ]}
          >
            {item.content}
          </Text>
        </View>
        <Text style={styles.messageTime}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
    >
      <Stack.Screen 
        options={{ 
          title: otherUser?.name || "Chat",
          headerBackTitle: "",
        }} 
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      />

      <View style={{ backgroundColor: themeColors.card, paddingBottom: Math.max(insets.bottom, 8) }}>
        <Card style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={themeColors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send color="#FFFFFF" size={20} />
            )}
          </TouchableOpacity>
        </Card>
      </View>
    </KeyboardAvoidingView>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 32,
  },
  messageWrapper: {
    marginBottom: 16,
    maxWidth: "80%",
  },
  messageWrapperLeft: {
    alignSelf: "flex-start",
  },
  messageWrapperRight: {
    alignSelf: "flex-end",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  messageBubbleLeft: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageBubbleRight: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  messageTextLeft: {
  },
  messageTextRight: {
    color: "#FFFFFF",
  },
  messageTime: {
    fontSize: 11,
    alignSelf: "flex-end",
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
    borderWidth: 1,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
