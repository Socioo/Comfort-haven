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
import { ResponsiveView } from "@/components/ResponsiveView";
import { rf, ms, s, vs, isTablet } from "@/utils/responsive";

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
  // isTablet is imported from responsive utils

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
            { maxWidth: isTablet ? '65%' : '80%' }
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
        <Text style={[styles.messageTime, { color: themeColors.textLight }]}>
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
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      <Stack.Screen 
        options={{ 
          title: otherUser?.name || "Chat",
          headerBackTitle: "",
        }} 
      />

      <ResponsiveView maxWidth={800} style={{ flex: 1 }}>
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

        <View style={{ 
          backgroundColor: themeColors.card, 
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 16,
          borderTopWidth: 1,
          borderTopColor: themeColors.border,
        }}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: themeColors.background, 
                  color: themeColors.text,
                  borderColor: themeColors.border
                }
              ]}
              placeholder="Type a message..."
              placeholderTextColor={themeColors.textLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() 
                  ? [styles.sendButtonDisabled, { backgroundColor: themeColors.border }] 
                  : { backgroundColor: Colors.primary },
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || sending}
              activeOpacity={0.7}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send color={!inputText.trim() ? themeColors.textLight : "#fff"} size={rf(20)} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ResponsiveView>
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
  messagesList: {
    padding: ms(16),
    paddingBottom: vs(32),
  },
  messageWrapper: {
    marginBottom: vs(16),
    width: "100%",
  },
  messageWrapperLeft: {
    alignItems: "flex-start",
  },
  messageWrapperRight: {
    alignItems: "flex-end",
  },
  messageBubble: {
    paddingHorizontal: ms(16),
    paddingVertical: vs(10),
    borderRadius: ms(20),
    marginBottom: vs(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageBubbleLeft: {
    borderBottomLeftRadius: ms(4),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  messageBubbleRight: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: ms(4),
  },
  messageText: {
    fontSize: rf(15),
    lineHeight: rf(22),
  },
  messageTextLeft: {
  },
  messageTextRight: {
    color: "#FFFFFF",
  },
  messageTime: {
    fontSize: rf(10),
    marginTop: vs(2),
    marginHorizontal: ms(4),
  },
  inputContainer: {
    flexDirection: "row",
    padding: ms(16),
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderRadius: ms(24),
    paddingHorizontal: ms(18),
    paddingTop: vs(12),
    paddingBottom: vs(12),
    fontSize: rf(16),
    maxHeight: vs(120),
    minHeight: vs(48),
    borderWidth: 1,
  },
  sendButton: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: ms(12),
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: ms(8),
    elevation: 4,
  },
  sendButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
});
