import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { aiAPI } from '@/services/api';
import { Send, Bot, User } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import { ResponsiveView } from '@/components/ResponsiveView';
import { rf, ms, s, vs, isTablet } from '@/utils/responsive';

export default function AiChatScreen() {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([
    { role: 'model', content: 'Hello! I am your Comfort Haven assistant. How can I help you today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const flatListRef = useRef<FlatList>(null);
  const headerHeight = useHeaderHeight();

  const insets = useSafeAreaInsets();

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, content: inputText.trim() }];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await aiAPI.chat(newMessages);
      setMessages([...newMessages, { role: 'model' as const, content: response.data.answer }]);
    } catch (error) {
      console.error('Failed to get AI response', error);
      setMessages([...newMessages, { role: 'model' as const, content: 'Sorry, I am having trouble connecting right now. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const renderMessage = ({ item }: { item: { role: 'user' | 'model', content: string } }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageWrapper, isUser ? styles.userWrapper : styles.aiWrapper]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: Colors.primary + '15' }]}>
            <Bot size={rf(18)} color={Colors.primary} />
          </View>
        )}
        <View style={[
          styles.messageBubble, 
          isUser ? styles.userBubble : [styles.aiBubble, { backgroundColor: themeColors.card }],
          { maxWidth: isTablet ? '65%' : '80%' }
        ]}>
          <Text style={[styles.messageText, isUser && styles.userText]}>{item.content}</Text>
        </View>
        {isUser && (
          <View style={[styles.avatar, { backgroundColor: themeColors.border + '40' }]}>
            <User size={rf(18)} color={themeColors.textLight} />
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      <Stack.Screen options={{ title: 'AI Assistant', presentation: 'modal' }} />
      
      <ResponsiveView maxWidth={800} style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Assistant is thinking...</Text>
          </View>
        )}

        <View style={[
          styles.inputContainer, 
          { 
            backgroundColor: themeColors.card, 
            borderTopColor: themeColors.border,
            paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 16
          }
        ]}>
          <TextInput
            style={[styles.input, { color: themeColors.text, backgroundColor: themeColors.background, borderColor: themeColors.border }]}
            placeholder="Ask me anything..."
            placeholderTextColor={themeColors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              !inputText.trim() 
                ? [styles.sendButtonDisabled, { backgroundColor: themeColors.border }] 
                : { backgroundColor: Colors.primary }
            ]} 
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.7}
          >
            <Send size={rf(20)} color={!inputText.trim() ? themeColors.textLight : "#fff"} />
          </TouchableOpacity>
        </View>
      </ResponsiveView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: ms(16),
    paddingBottom: vs(24),
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: vs(16),
    width: '100%',
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  aiWrapper: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: ms(6),
  },
  messageBubble: {
    paddingHorizontal: ms(16),
    paddingVertical: vs(10),
    borderRadius: ms(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: ms(4),
  },
  aiBubble: {
    borderBottomLeftRadius: ms(4),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  messageText: {
    fontSize: rf(15),
    lineHeight: rf(22),
  },
  userText: {
    color: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(24),
    paddingBottom: vs(16),
  },
  loadingText: {
    marginLeft: ms(10),
    fontSize: rf(13),
    color: '#64748b',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: ms(16),
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: vs(48),
    maxHeight: vs(120),
    paddingHorizontal: ms(18),
    paddingTop: vs(12),
    paddingBottom: vs(12),
    borderRadius: ms(24),
    fontSize: rf(16),
    marginRight: ms(12),
    borderWidth: 1,
  },
  sendButton: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    justifyContent: 'center',
    alignItems: 'center',
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
