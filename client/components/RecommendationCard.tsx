import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import type { Recommendation } from "@/lib/mockData";

interface RecommendationCardProps {
  recommendation: Recommendation;
  onApply?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RecommendationCard({
  recommendation,
  onApply,
}: RecommendationCardProps) {
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

  const getPriorityColor = () => {
    switch (recommendation.priority) {
      case "high":
        return isDark ? Colors.dark.critical : Colors.light.critical;
      case "medium":
        return isDark ? Colors.dark.warning : Colors.light.warning;
      case "low":
        return isDark ? Colors.dark.success : Colors.light.success;
    }
  };

  const getTypeIcon = (): keyof typeof Feather.glyphMap => {
    switch (recommendation.type) {
      case "irrigation":
        return "droplet";
      case "nutrient":
        return "wind";
      case "soil":
        return "layers";
    }
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${isDark ? Colors.dark.primary : Colors.light.primary}15` },
          ]}
        >
          <Feather
            name={getTypeIcon()}
            size={20}
            color={isDark ? Colors.dark.primary : Colors.light.primary}
          />
        </View>
        <View
          style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor()}15` }]}
        >
          <ThemedText style={[styles.priorityText, { color: getPriorityColor() }]}>
            {recommendation.priority.toUpperCase()}
          </ThemedText>
        </View>
      </View>

      <ThemedText type="h4" style={styles.title}>
        {recommendation.title}
      </ThemedText>
      <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
        {recommendation.description}
      </ThemedText>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Confidence
          </ThemedText>
          <ThemedText style={styles.statValue}>{recommendation.confidence}%</ThemedText>
        </View>
        {recommendation.savings > 0 ? (
          <View style={styles.stat}>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Projected Savings
            </ThemedText>
            <ThemedText
              style={[
                styles.statValue,
                { color: isDark ? Colors.dark.success : Colors.light.success },
              ]}
            >
              {recommendation.savings}%
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.fieldInfo}>
          <Feather name="map-pin" size={14} color={theme.textSecondary} />
          <ThemedText style={[styles.fieldName, { color: theme.textSecondary }]}>
            {recommendation.fieldName}
          </ThemedText>
        </View>
        <Button onPress={onApply} style={styles.applyButton}>
          Apply
        </Button>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing["2xl"],
    marginBottom: Spacing.lg,
  },
  stat: {},
  statLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  fieldName: {
    fontSize: 13,
  },
  applyButton: {
    paddingHorizontal: Spacing.xl,
    height: 40,
  },
});
