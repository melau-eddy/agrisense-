import React, { useState, useRef, useEffect } from 'react';
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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useChat } from '@/contexts/ChatContext';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function ChatScreen() {
  const { theme } = useTheme();
  const { 
    messages, 
    isTyping, 
    sendMessage, 
    clearChat, 
    apiStatus,
    testConnection,
    retryMessage 
  } = useChat();
  
  const [inputText, setInputText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;
    
    const textToSend = inputText.trim();
    setInputText('');
    await sendMessage(textToSend);
  };

  const handleRetry = (messageId: string) => {
    Alert.alert(
      'Retry Message',
      'Send this message again?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retry',
          onPress: () => retryMessage(messageId)
        }
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await testConnection();
    setRefreshing(false);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isUser = item.user._id === 'user';
    const isError = item.error;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.botMessage,
          isError && styles.errorMessage,
          { 
            alignSelf: isUser ? 'flex-end' : 'flex-start',
            backgroundColor: isUser 
              ? (theme.primary + '20') 
              : isError
                ? (theme.critical + '15')
                : theme.backgroundSecondary,
            borderColor: isUser 
              ? theme.primary 
              : isError
                ? theme.critical
                : theme.border,
          }
        ]}
      >
        {!isUser && !isError && (
          <View style={styles.botHeader}>
            <View style={[styles.botAvatar, { backgroundColor: theme.primary + '20' }]}>
              <Feather name="cpu" size={14} color={theme.primary} />
            </View>
            <ThemedText style={[styles.botName, { color: theme.textSecondary }]}>
              AgriSense AI
            </ThemedText>
            {apiStatus === 'connected' && (
              <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
            )}
          </View>
        )}
        
        <ThemedText style={[
          styles.messageText,
          { 
            color: isUser 
              ? theme.text 
              : isError
                ? theme.critical
                : theme.text
          }
        ]}>
          {item.text}
        </ThemedText>
        
        <View style={styles.messageFooter}>
          <ThemedText style={[styles.timeText, { color: theme.textSecondary }]}>
            {new Date(item.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </ThemedText>
          
          {isError && item.user._id === 'bot' && (
            <TouchableOpacity
              onPress={() => handleRetry(item._id)}
              style={styles.retryButton}
            >
              <Feather name="refresh-cw" size={12} color={theme.critical} />
              <ThemedText style={[styles.retryText, { color: theme.critical }]}>
                Retry
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => (
    <View style={[styles.messageContainer, styles.botMessage, { alignSelf: 'flex-start' }]}>
      <View style={styles.botHeader}>
        <View style={[styles.botAvatar, { backgroundColor: theme.primary + '20' }]}>
          <Feather name="cpu" size={14} color={theme.primary} />
        </View>
        <ThemedText style={[styles.botName, { color: theme.textSecondary }]}>
          AgriSense AI
        </ThemedText>
      </View>
      <View style={styles.typingIndicator}>
        <ActivityIndicator size="small" color={theme.text} />
        <ThemedText style={[styles.typingText, { color: theme.textSecondary }]}>
          Thinking...
        </ThemedText>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header with connection status */}
        <View style={[
          styles.header,
          { 
            backgroundColor: theme.backgroundDefault,
            borderBottomColor: theme.border 
          }
        ]}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIcon, { backgroundColor: theme.primary + '20' }]}>
              <Feather name="message-circle" size={24} color={theme.primary} />
            </View>
            <View>
              <ThemedText type="h3" style={styles.headerTitle}>
                AgriSense AI
              </ThemedText>
              <View style={styles.statusRow}>
                <View style={[
                  styles.statusIndicator,
                  { 
                    backgroundColor: apiStatus === 'connected' 
                      ? theme.success 
                      : apiStatus === 'checking'
                        ? theme.warning
                        : theme.critical
                  }
                ]} />
                <ThemedText style={[
                  styles.statusText,
                  { 
                    color: apiStatus === 'connected' 
                      ? theme.success 
                      : apiStatus === 'checking'
                        ? theme.warning
                        : theme.critical
                  }
                ]}>
                  {apiStatus === 'connected' ? 'Connected' : 
                   apiStatus === 'checking' ? 'Checking...' : 'Disconnected'}
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={testConnection}
              style={[styles.headerButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Feather name="wifi" size={18} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={clearChat}
              style={[styles.headerButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Feather name="trash-2" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Connection warning banner */}
        {apiStatus === 'disconnected' && (
          <View style={[styles.warningBanner, { backgroundColor: theme.critical + '15' }]}>
            <Feather name="alert-triangle" size={16} color={theme.critical} />
            <ThemedText style={[styles.warningText, { color: theme.critical }]}>
              Connection issue. Some features may be limited.
            </ThemedText>
            <TouchableOpacity onPress={testConnection}>
              <ThemedText style={[styles.warningAction, { color: theme.critical }]}>
                Retry
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Messages list */}
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
              <View style={[styles.emptyIcon, { backgroundColor: theme.primary + '15' }]}>
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
                  onPress={() => setInputText('How can I optimize corn yield this season?')}
                >
                  <ThemedText style={styles.exampleText}>
                    "How can I optimize corn yield this season?"
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.exampleButton, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => setInputText('What irrigation schedule is best for tomatoes in dry climate?')}
                >
                  <ThemedText style={styles.exampleText}>
                    "Best irrigation for tomatoes in dry climate?"
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          }
          ListFooterComponent={isTyping ? renderTypingIndicator() : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        />

        {/* Input area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.inputWrapper}>
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
              maxLength={2000}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!isTyping && apiStatus !== 'disconnected'}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { 
                  backgroundColor: inputText.trim() && !isTyping ? theme.primary : theme.backgroundTertiary,
                  opacity: (inputText.trim() && !isTyping && apiStatus !== 'disconnected') ? 1 : 0.5,
                }
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping || apiStatus === 'disconnected'}
            >
              {isTyping ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather 
                  name="send" 
                  size={20} 
                  color={inputText.trim() ? '#FFFFFF' : theme.textSecondary} 
                />
              )}
            </TouchableOpacity>
          </View>
          <ThemedText style={[styles.inputHint, { color: theme.textSecondary }]}>
            Powered by Groq AI • Ask detailed agricultural questions
          </ThemedText>
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  warningText: {
    fontSize: 13,
    flex: 1,
  },
  warningAction: {
    fontSize: 13,
    fontWeight: '600',
  },
  messagesList: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },
  messageContainer: {
    maxWidth: '85%',
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
  errorMessage: {
    borderWidth: 1.5,
  },
  botHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  botAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botName: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  retryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  typingText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    minHeight: 400,
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
  inputContainer: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 48,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  inputHint: {
    fontSize: 11,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});