import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useChat } from '@/contexts/ChatContext';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface ChatFloatingButtonProps {
  onPress?: () => void;
}

export function ChatFloatingButton({ onPress }: ChatFloatingButtonProps) {
  const { theme } = useTheme();
  const { messages, unreadCount } = useChat(); // You might want to add unreadCount to context

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  const hasUnread = false; // Implement your unread logic

  return (
    <Pressable
      style={[
        styles.container,
        { 
          backgroundColor: theme.primary,
          ...Shadows.large,
        }
      ]}
      onPress={handlePress}
    >
      <Feather name="message-circle" size={24} color="#FFFFFF" />
      
      {hasUnread && (
        <View style={[styles.badge, { backgroundColor: theme.critical }]}>
          <ThemedText style={styles.badgeText}>1</ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Spacing["2xl"],
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
