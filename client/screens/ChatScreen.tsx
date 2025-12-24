import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useChat } from '@/contexts/ChatContext';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function ChatScreen() {
  const { theme } = useTheme();
  const { messages, isTyping, sendMessage, clearChat } = useChat();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const textToSend = inputText.trim();
    setInputText('');
    await sendMessage(textToSend);
    
    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isUser = item.user._id === 'user';
    
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.botMessage,
          { 
            alignSelf: isUser ? 'flex-end' : 'flex-start',
            backgroundColor: isUser 
              ? (theme.primary + '20') 
              : theme.backgroundSecondary,
            borderColor: isUser ? theme.primary : theme.border,
          }
        ]}
      >
        {!isUser && (
          <View style={styles.botHeader}>
            <Feather 
              name="cpu" 
              size={14} 
              color={theme.textSecondary} 
              style={styles.botIcon}
            />
            <ThemedText style={[styles.botName, { color: theme.textSecondary }]}>
              {item.user.name}
            </ThemedText>
          </View>
        )}
        
        <ThemedText style={[
          styles.messageText,
          { color: isUser ? theme.text : theme.text }
        ]}>
          {item.text}
        </ThemedText>
        
        {item.error && (
          <View style={styles.errorContainer}>
            <Feather name="alert-triangle" size={12} color={theme.critical} />
            <ThemedText style={[styles.errorText, { color: theme.critical }]}>
              Failed to send
            </ThemedText>
          </View>
        )}
        
        <ThemedText style={[styles.timeText, { color: theme.textSecondary }]}>
          {new Date(item.createdAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Feather name="message-circle" size={24} color={theme.primary} />
            <ThemedText type="h3" style={styles.headerTitle}>
              AgriSense AI
            </ThemedText>
          </View>
          <TouchableOpacity
            onPress={clearChat}
            style={[styles.clearButton, { backgroundColor: theme.backgroundSecondary }]}
          >
            <Feather name="trash-2" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}15` }]}>
                <Feather name="cpu" size={40} color={theme.primary} />
              </View>
              <ThemedText type="h3" style={styles.emptyTitle}>
                AgriSense AI Assistant
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                Ask me anything about agriculture, crops, weather, soil health, and farming practices.
              </ThemedText>
              <View style={styles.exampleContainer}>
                <ThemedText style={[styles.exampleTitle, { color: theme.textSecondary }]}>
                  Try asking:
                </ThemedText>
                <TouchableOpacity
                  style={[styles.exampleButton, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => setInputText('How can I improve my corn yield?')}
                >
                  <ThemedText style={styles.exampleText}>
                    "How can I improve my corn yield?"
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.exampleButton, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => setInputText('What is the best irrigation schedule for tomatoes?')}
                >
                  <ThemedText style={styles.exampleText}>
                    "Best irrigation for tomatoes?"
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          }
        />

        {isTyping && (
          <View style={styles.typingContainer}>
            <ThemedText style={[styles.typingText, { color: theme.textSecondary }]}>
              AgriSense AI is typing...
            </ThemedText>
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              }
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about agriculture, crops, weather..."
            placeholderTextColor={theme.textSecondary}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { 
                backgroundColor: inputText.trim() ? theme.primary : theme.backgroundTertiary,
                opacity: inputText.trim() ? 1 : 0.5,
              }
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isTyping}
          >
            <Feather 
              name="send" 
              size={20} 
              color={inputText.trim() ? '#FFFFFF' : theme.textSecondary} 
            />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    marginLeft: Spacing.sm,
  },
  clearButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  messagesList: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  userMessage: {
    borderTopRightRadius: BorderRadius.xs,
  },
  botMessage: {
    borderTopLeftRadius: BorderRadius.xs,
  },
  botHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  botIcon: {
    marginRight: Spacing.xs,
  },
  botName: {
    fontSize: 12,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timeText: {
    fontSize: 11,
    marginTop: Spacing.xs,
    alignSelf: 'flex-end',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  errorText: {
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    fontSize: 16,
    lineHeight: 24,
  },
  exampleContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  exampleButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  exampleText: {
    fontSize: 14,
  },
  typingContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 48,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
    marginBottom: 2,
  },
});
