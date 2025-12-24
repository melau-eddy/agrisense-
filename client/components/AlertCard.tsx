import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import type { Alert } from "@/lib/mockData";

interface AlertCardProps {
  alert: Alert;
  onPress?: () => void;
  onDismiss?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AlertCard({ alert, onPress, onDismiss }: AlertCardProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const getTypeColor = () => {
    switch (alert.type) {
      case "info":
        return isDark ? Colors.dark.accent : Colors.light.accent;
      case "warning":
        return isDark ? Colors.dark.warning : Colors.light.warning;
      case "critical":
        return isDark ? Colors.dark.critical : Colors.light.critical;
    }
  };

  const getTypeIcon = (): keyof typeof Feather.glyphMap => {
    switch (alert.type) {
      case "info":
        return "info";
      case "warning":
        return "alert-triangle";
      case "critical":
        return "alert-circle";
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
          opacity: alert.read ? 0.7 : 1,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${getTypeColor()}15` }]}>
        <Feather name={getTypeIcon()} size={20} color={getTypeColor()} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <ThemedText type="h4" style={styles.title} numberOfLines={1}>
            {alert.title}
          </ThemedText>
          {!alert.read ? <View style={[styles.unreadDot, { backgroundColor: getTypeColor() }]} /> : null}
        </View>
        <ThemedText style={styles.message} numberOfLines={2}>
          {alert.message}
        </ThemedText>
        <View style={styles.meta}>
          <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
            {alert.fieldName}
          </ThemedText>
          <View style={styles.metaDot} />
          <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
            {alert.timestamp}
          </ThemedText>
        </View>
      </View>

      {onDismiss ? (
        <Pressable onPress={onDismiss} style={styles.dismissButton}>
          <Feather name="x" size={18} color={theme.textSecondary} />
        </Pressable>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  title: {
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  message: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#999",
    marginHorizontal: Spacing.sm,
  },
  dismissButton: {
    padding: Spacing.xs,
  },
});
