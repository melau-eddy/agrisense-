import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import type { Alert } from '@/services/notifications/firebaseNotifications';

interface AlertCardProps {
  alert: Alert;
  onPress: (alert: Alert) => void;
  onDismiss: (alertId: string) => void;
  onMarkAsRead?: (alertId: string) => void;
}

export function AlertCard({ alert, onPress, onDismiss, onMarkAsRead }: AlertCardProps) {
  const { theme, isDark } = useTheme();
  const [swipeAnim] = useState(new Animated.Value(0));
  const [isSwiping, setIsSwiping] = useState(false);

  const getAlertColor = () => {
    switch (alert.type) {
      case 'critical':
        return isDark ? Colors.dark.critical : Colors.light.critical;
      case 'warning':
        return isDark ? Colors.dark.warning : Colors.light.warning;
      case 'success':
        return isDark ? Colors.dark.success : Colors.light.success;
      case 'info':
      default:
        return isDark ? Colors.dark.primary : Colors.light.primary;
    }
  };

  const getAlertIcon = () => {
    switch (alert.type) {
      case 'critical':
        return 'alert-triangle';
      case 'warning':
        return 'alert-circle';
      case 'success':
        return 'check-circle';
      case 'info':
      default:
        return 'info';
    }
  };

  const getCategoryIcon = () => {
    switch (alert.category) {
      case 'irrigation':
        return 'droplet';
      case 'soil':
        return 'thermometer';
      case 'weather':
        return 'cloud';
      case 'crop':
        return 'leaf';
      case 'market':
        return 'trending-up';
      case 'security':
        return 'shield';
      case 'system':
      default:
        return 'cpu';
    }
  };

  const handlePress = () => {
    if (!isSwiping) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress(alert);
      onMarkAsRead?.(alert.id);
    }
  };

  const handleSwipeStart = () => {
    setIsSwiping(true);
  };

  const handleSwipeEnd = (event: any) => {
    const { translationX } = event.nativeEvent;
    setIsSwiping(false);

    if (translationX < -100) {
      // Swipe left to dismiss
      Animated.timing(swipeAnim, {
        toValue: -500,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onDismiss(alert.id);
      });
    } else {
      Animated.spring(swipeAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPriorityLabel = () => {
    switch (alert.priority) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return '';
    }
  };

  const animatedStyle = {
    transform: [{ translateX: swipeAnim }],
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: alert.read 
              ? theme.backgroundSecondary 
              : theme.cardBackground,
            borderColor: theme.border,
            opacity: pressed ? 0.9 : 1,
            borderLeftColor: getAlertColor(),
            borderLeftWidth: 4,
          }
        ]}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.iconContainer, { backgroundColor: getAlertColor() + '20' }]}>
              <Feather 
                name={getAlertIcon()} 
                size={16} 
                color={getAlertColor()} 
              />
            </View>
            <View style={styles.titleContainer}>
              <ThemedText style={[styles.title, !alert.read && styles.unreadTitle]}>
                {alert.title}
              </ThemedText>
              {alert.priority === 'high' && (
                <View style={[styles.priorityBadge, { backgroundColor: getAlertColor() + '20' }]}>
                  <ThemedText style={[styles.priorityText, { color: getAlertColor() }]}>
                    {getPriorityLabel()}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
          <ThemedText style={[styles.time, { color: theme.textSecondary }]}>
            {formatTime(alert.createdAt)}
          </ThemedText>
        </View>

        <ThemedText style={[styles.message, { color: theme.text }]}>
          {alert.message}
        </ThemedText>

        <View style={styles.footer}>
          <View style={styles.categoryRow}>
            <View style={styles.category}>
              <Feather 
                name={getCategoryIcon()} 
                size={12} 
                color={theme.textSecondary} 
              />
              <ThemedText style={[styles.categoryText, { color: theme.textSecondary }]}>
                {alert.category.charAt(0).toUpperCase() + alert.category.slice(1)}
              </ThemedText>
            </View>
            {alert.data?.fieldName && (
              <View style={styles.fieldTag}>
                <ThemedText style={[styles.fieldText, { color: theme.textSecondary }]}>
                  {alert.data.fieldName}
                </ThemedText>
              </View>
            )}
          </View>

          {!alert.read && (
            <View style={[styles.unreadDot, { backgroundColor: getAlertColor() }]} />
          )}
        </View>

        {alert.actionUrl && (
          <Pressable
            style={[styles.actionButton, { borderColor: theme.border }]}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.open(alert.actionUrl, '_blank');
              } else {
                // Handle deep linking in React Native
                console.log('Action URL:', alert.actionUrl);
              }
            }}
          >
            <ThemedText style={[styles.actionText, { color: theme.primary }]}>
              View Details
            </ThemedText>
            <Feather name="external-link" size={14} color={theme.primary} />
          </Pressable>
        )}
      </Pressable>

      {/* Swipe to dismiss indicator */}
      <View style={styles.swipeIndicator}>
        <Feather name="trash-2" size={20} color={theme.textSecondary} />
        <ThemedText style={[styles.swipeText, { color: theme.textSecondary }]}>
          Swipe to dismiss
        </ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    marginLeft: Spacing.sm,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryText: {
    fontSize: 12,
  },
  fieldTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  fieldText: {
    fontSize: 11,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  swipeIndicator: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -10 }],
    alignItems: 'center',
    opacity: 0.5,
  },
  swipeText: {
    fontSize: 10,
    marginTop: 2,
  },
});