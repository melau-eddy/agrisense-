import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { GiftedChat, IMessage, Send, Bubble, InputToolbar } from 'react-native-gifted-chat';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useChat } from '@/contexts/ChatContext';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function ChatScreen() {
  const { theme } = useTheme();
  const { 
    messages, 
    loading, 
    isChatVisible, 
    hideChat, 
    sendMessage,
    selectedModel,
  } = useChat();

  const handleSend = useCallback((newMessages: IMessage[] = []) => {
    sendMessage(newMessages[0].text);
  }, [sendMessage]);

  const renderSend = (props: any) => (
    <Send
      {...props}
      containerStyle={styles.sendContainer}
    >
      <View style={[styles.sendButton, { backgroundColor: theme.primary }]}>
        <Feather name="send" size={20} color="#FFFFFF" />
      </View>
    </Send>
  );

  const renderBubble = (props: any) => (
    <Bubble
      {...props}
      wrapperStyle={{
        left: {
          backgroundColor: theme.backgroundSecondary,
          borderBottomLeftRadius: 0,
        },
        right: {
          backgroundColor: theme.primary,
          borderBottomRightRadius: 0,
        },
      }}
      textStyle={{
        left: {
          color: theme.text,
        },
        right: {
          color: '#FFFFFF',
        },
      }}
      timeTextStyle={{
        left: {
          color: theme.textSecondary,
        },
        right: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      }}
    />
  );

  const renderInputToolbar = (props: any) => (
    <InputToolbar
      {...props}
      containerStyle={[styles.inputToolbar, { 
        backgroundColor: theme.backgroundDefault,
        borderTopColor: theme.border,
      }]}
      primaryStyle={styles.inputPrimary}
    />
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
        🤔 AgriSense AI is thinking...
      </ThemedText>
    </View>
  );

  const renderChatEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="message-square" size={48} color={theme.textSecondary} />
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        Start a conversation with AgriSense AI
      </ThemedText>
    </View>
  );

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border }]}>
      <View style={styles.headerContent}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Feather name="zap" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="h4" style={styles.headerTitle}>AgriSense AI</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Powered by Groq • {selectedModel.replace('-', ' ').toUpperCase()}
          </ThemedText>
        </View>
      </View>
      <Pressable onPress={hideChat} style={styles.closeButton}>
        <Feather name="x" size={24} color={theme.text} />
      </Pressable>
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
              {renderHeader()}
              
              <GiftedChat
                messages={messages.map(msg => ({
                  ...msg,
                  createdAt: new Date(msg.createdAt),
                  user: {
                    ...msg.user,
                    avatar: msg.user.avatar || undefined,
                  },
                }))}
                onSend={handleSend}
                user={{
                  _id: 1,
                }}
                renderBubble={renderBubble}
                renderSend={renderSend}
                renderInputToolbar={renderInputToolbar}
                renderLoading={renderLoading}
                renderChatEmpty={renderChatEmpty}
                isLoadingEarlier={loading}
                alwaysShowSend={true}
                scrollToBottom={true}
                scrollToBottomComponent={() => (
                  <Feather name="chevron-down" size={24} color={theme.primary} />
                )}
                placeholder="Ask about farming, weather, crops..."
                textInputStyle={[styles.textInput, { 
                  color: theme.text,
                  backgroundColor: theme.backgroundSecondary,
                }]}
                textInputProps={{
                  placeholderTextColor: theme.textSecondary,
                }}
                minInputToolbarHeight={60}
                bottomOffset={Platform.OS === 'ios' ? 30 : 0}
              />
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
  inputToolbar: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  inputPrimary: {
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing["3xl"],
  },
  emptyText: {
    marginTop: Spacing.lg,
    fontSize: 16,
    textAlign: 'center',
  },
});
