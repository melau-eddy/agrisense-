import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useChat } from '@/contexts/ChatContext';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function SimpleChatScreen() {
  const { theme } = useTheme();
  const { isChatVisible, hideChat, sendMessage } = useChat();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hello! I\'m AgriSense AI. How can I help with your farming today? 🌱',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Send to AI
      await sendMessage(inputText);
      
      // Note: The actual AI response will be added by the ChatContext
      // For now, we'll just clear loading state
    } catch (error) {
      console.error('Chat error:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message: ChatMessage) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <View style={[
        styles.messageBubble,
        { 
          backgroundColor: message.isUser ? theme.primary : theme.backgroundSecondary,
          alignSelf: message.isUser ? 'flex-end' : 'flex-start',
        }
      ]}>
        <ThemedText style={[
          styles.messageText,
          { color: message.isUser ? '#FFFFFF' : theme.text }
        ]}>
          {message.text}
        </ThemedText>
        <ThemedText style={[
          styles.messageTime,
          { color: message.isUser ? 'rgba(255, 255, 255, 0.7)' : theme.textSecondary }
        ]}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <Modal
      visible={isChatVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={hideChat}
    >
      <Pressable style={styles.modalOverlay} onPress={hideChat}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
        >
          <Pressable style={{ flex: 1 }} onPress={() => {}}>
            <ThemedView style={[styles.chatContent, { backgroundColor: theme.backgroundRoot }]}>
              {/* Header */}
              <View style={[styles.header, { backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border }]}>
                <View style={styles.headerContent}>
                  <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                    <Feather name="zap" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.headerText}>
                    <ThemedText type="h4" style={styles.headerTitle}>AgriSense AI</ThemedText>
                    <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                      Farming Assistant
                    </ThemedText>
                  </View>
                </View>
                <Pressable onPress={hideChat} style={styles.closeButton}>
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>

              {/* Messages */}
              <ScrollView 
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
              >
                {messages.map(renderMessage)}
                {loading && (
                  <View style={styles.loadingContainer}>
                    <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
                      AI is thinking...
                    </ThemedText>
                  </View>
                )}
              </ScrollView>

              {/* Input */}
              <View style={[styles.inputContainer, { backgroundColor: theme.backgroundDefault, borderTopColor: theme.border }]}>
                <TextInput
                  style={[
                    styles.textInput,
                    { 
                      color: theme.text,
                      backgroundColor: theme.backgroundSecondary,
                    }
                  ]}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask about farming..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  maxLength={500}
                  onSubmitEditing={handleSend}
                />
                <Pressable
                  onPress={handleSend}
                  style={[styles.sendButton, { backgroundColor: theme.primary }]}
                  disabled={!inputText.trim() || loading}
                >
                  <Feather 
                    name="send" 
                    size={20} 
                    color={!inputText.trim() || loading ? theme.textSecondary : '#FFFFFF'} 
                  />
                </Pressable>
              </View>
            </ThemedView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  chatContainer: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  chatContent: {
    flex: 1,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  messageContainer: {
    marginBottom: Spacing.md,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 10,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  loadingContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    fontSize: 16,
    minHeight: 40,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
