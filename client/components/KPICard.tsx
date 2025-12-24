import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: keyof typeof Feather.glyphMap;
  color?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function KPICard({
  title,
  value,
  unit,
  icon,
  color,
  trend,
  trendValue,
  onPress,
}: KPICardProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const iconColor = color || (isDark ? Colors.dark.primary : Colors.light.primary);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const getTrendColor = () => {
    if (trend === "up") return isDark ? Colors.dark.success : Colors.light.success;
    if (trend === "down") return isDark ? Colors.dark.critical : Colors.light.critical;
    return theme.textSecondary;
  };

  const getTrendIcon = () => {
    if (trend === "up") return "trending-up";
    if (trend === "down") return "trending-down";
    return "minus";
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
        animatedStyle,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Feather name={icon} size={20} color={iconColor} />
      </View>
      <ThemedText
        style={[styles.title, { color: theme.textSecondary }]}
        numberOfLines={1}
      >
        {title}
      </ThemedText>
      <View style={styles.valueRow}>
        <ThemedText type="h2" style={styles.value}>
          {value}
        </ThemedText>
        {unit ? (
          <ThemedText style={[styles.unit, { color: theme.textSecondary }]}>
            {unit}
          </ThemedText>
        ) : null}
      </View>
      {trend && trendValue ? (
        <View style={styles.trendRow}>
          <Feather name={getTrendIcon()} size={14} color={getTrendColor()} />
          <ThemedText style={[styles.trendText, { color: getTrendColor() }]}>
            {trendValue}
          </ThemedText>
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    minWidth: 140,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  value: {
    fontSize: 28,
  },
  unit: {
    fontSize: 14,
    marginLeft: Spacing.xs,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
