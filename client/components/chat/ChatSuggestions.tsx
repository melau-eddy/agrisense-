import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Pressable } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useChat } from '@/contexts/ChatContext';
import { Spacing, BorderRadius } from '@/constants/theme';

const suggestions = [
  { id: '1', text: 'Weather forecast for next week?', icon: '🌤️', category: 'weather' },
  { id: '2', text: 'Irrigation schedule advice', icon: '💧', category: 'irrigation' },
  { id: '3', text: 'Best crops for clay soil', icon: '🌽', category: 'crops' },
  { id: '4', text: 'Organic pest control methods', icon: '🐞', category: 'pest' },
  { id: '5', text: 'Soil pH testing procedure', icon: '🧪', category: 'soil' },
  { id: '6', text: 'Water conservation techniques', icon: '💦', category: 'conservation' },
  { id: '7', text: 'Fertilizer recommendations', icon: '🌱', category: 'fertilizer' },
  { id: '8', text: 'Market price trends', icon: '📈', category: 'market' },
];

export default function ChatSuggestions() {
  const { theme } = useTheme();
  const { sendMessage, showChat } = useChat();

  const handleSuggestionPress = (text: string) => {
    showChat();
    setTimeout(() => {
      sendMessage(text);
    }, 300);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: theme.textSecondary }]}>
          Quick Questions for AI Assistant
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Powered by Groq AI
        </ThemedText>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {suggestions.map((suggestion) => (
          <Pressable
            key={suggestion.id}
            style={[styles.suggestionButton, { 
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            }]}
            onPress={() => handleSuggestionPress(suggestion.text)}
          >
            <View style={styles.suggestionContent}>
              <ThemedText style={styles.suggestionIcon}>
                {suggestion.icon}
              </ThemedText>
              <ThemedText style={styles.suggestionText}>
                {suggestion.text}
              </ThemedText>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  suggestionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginRight: Spacing.sm,
    minWidth: 160,
  },
  suggestionContent: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  suggestionIcon: {
    fontSize: 20,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
