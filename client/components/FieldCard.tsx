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
import type { Field } from "@/lib/mockData";

interface FieldCardProps {
  field: Field;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FieldCard({ field, onPress }: FieldCardProps) {
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

  const getStatusColor = () => {
    switch (field.status) {
      case "healthy":
        return isDark ? Colors.dark.success : Colors.light.success;
      case "attention":
        return isDark ? Colors.dark.warning : Colors.light.warning;
      case "critical":
        return isDark ? Colors.dark.critical : Colors.light.critical;
    }
  };

  const getStatusLabel = () => {
    switch (field.status) {
      case "healthy":
        return "Healthy";
      case "attention":
        return "Attention";
      case "critical":
        return "Critical";
    }
  };

  const SensorItem = ({
    icon,
    value,
    label,
    color,
  }: {
    icon: keyof typeof Feather.glyphMap;
    value: string;
    label: string;
    color?: string;
  }) => (
    <View style={styles.sensorItem}>
      <Feather
        name={icon}
        size={16}
        color={color || (isDark ? Colors.dark.accent : Colors.light.accent)}
      />
      <ThemedText style={styles.sensorValue}>{value}</ThemedText>
      <ThemedText style={[styles.sensorLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
    </View>
  );

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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText type="h4" numberOfLines={1} style={styles.name}>
            {field.name}
          </ThemedText>
          <ThemedText style={[styles.acres, { color: theme.textSecondary }]}>
            {field.acres} acres
          </ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <ThemedText style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusLabel()}
          </ThemedText>
        </View>
      </View>

      <View style={styles.sensorsGrid}>
        <SensorItem
          icon="droplet"
          value={`${field.moisture}%`}
          label="Moisture"
          color={
            field.moisture < 40
              ? isDark
                ? Colors.dark.warning
                : Colors.light.warning
              : undefined
          }
        />
        <SensorItem icon="activity" value={field.ph.toFixed(1)} label="pH" />
        <SensorItem icon="thermometer" value={`${field.temperature}°C`} label="Temp" />
        <SensorItem icon="wind" value={`${field.nitrogen}%`} label="N-P-K" />
      </View>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Feather name="clock" size={14} color={theme.textSecondary} />
        <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
          Last irrigation: {field.lastIrrigation}
        </ThemedText>
        <Feather name="chevron-right" size={18} color={theme.textSecondary} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  acres: {
    fontSize: 13,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sensorsGrid: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  sensorItem: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  sensorValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  sensorLabel: {
    fontSize: 11,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  footerText: {
    flex: 1,
    fontSize: 13,
  },
});
