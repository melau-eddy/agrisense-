import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { mockFields } from "@/lib/mockData";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type FieldDetailRouteProp = RouteProp<RootStackParamList, "FieldDetail">;

interface SensorCardProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  color?: string;
}

interface TimeRangeButtonProps {
  range: "24h" | "7d" | "30d";
  label: string;
}

export default function FieldDetailScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<FieldDetailRouteProp>();
  const { theme, isDark } = useTheme();
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

  const field = mockFields.find((f) => f.id === route.params.fieldId) || mockFields[0];

  const handleManualIrrigation = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      "Start Manual Irrigation",
      `This will start irrigation for ${field.name}. Proceed?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert("Irrigation Started", "Manual irrigation has been initiated.");
          },
        },
      ]
    );
  };

  const getStatusColor = () => {
    switch (field.status) {
      case "healthy":
        return isDark ? Colors.dark.success : Colors.light.success;
      case "attention":
        return isDark ? Colors.dark.warning : Colors.light.warning;
      case "critical":
        return isDark ? Colors.dark.critical : Colors.light.critical;
      default:
        return isDark ? Colors.dark.success : Colors.light.success;
    }
  };

  const getStatusLabel = () => {
    switch (field.status) {
      case "healthy":
        return "Healthy";
      case "attention":
        return "Attention Needed";
      case "critical":
        return "Critical";
      default:
        return "Healthy";
    }
  };

  const SensorCard: React.FC<SensorCardProps> = ({ icon, label, value, unit, trend, color }) => {
    const trendIcon =
      trend === "up" ? "arrow-up" : trend === "down" ? "arrow-down" : "minus";
    const trendColor =
      trend === "up"
        ? isDark
          ? Colors.dark.success
          : Colors.light.success
        : trend === "down"
          ? isDark
            ? Colors.dark.critical
            : Colors.light.critical
          : theme.textSecondary;

    return (
      <View
        style={[
          styles.sensorCard,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        <View
          style={[
            styles.sensorIcon,
            {
              backgroundColor: `${color || (isDark ? Colors.dark.accent : Colors.light.accent)}15`,
            },
          ]}
        >
          <Feather
            name={icon}
            size={20}
            color={color || (isDark ? Colors.dark.accent : Colors.light.accent)}
          />
        </View>
        <ThemedText style={[styles.sensorLabel, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
        <View style={styles.sensorValueRow}>
          <ThemedText type="h2" style={styles.sensorValue}>
            {value}
          </ThemedText>
          <ThemedText style={[styles.sensorUnit, { color: theme.textSecondary }]}>
            {unit}
          </ThemedText>
        </View>
        <View style={styles.trendRow}>
          <Feather name={trendIcon} size={12} color={trendColor} />
          <ThemedText style={[styles.trendText, { color: trendColor }]}>
            {trend === "stable" ? "Stable" : trend === "up" ? "Rising" : "Falling"}
          </ThemedText>
        </View>
      </View>
    );
  };

  const TimeRangeButton: React.FC<TimeRangeButtonProps> = ({ range, label }) => (
    <Pressable
      onPress={() => setTimeRange(range)}
      style={[
        styles.timeRangeButton,
        {
          backgroundColor:
            timeRange === range
              ? isDark
                ? Colors.dark.primary
                : Colors.light.primary
              : "transparent",
        },
      ]}
    >
      <ThemedText
        style={[
          styles.timeRangeText,
          { color: timeRange === range ? "#FFFFFF" : theme.textSecondary },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <ThemedText type="h2">{field.name}</ThemedText>
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4">Sensor Readings</ThemedText>
            <View
              style={[styles.timeRangeContainer, { backgroundColor: theme.backgroundSecondary }]}
            >
              <TimeRangeButton range="24h" label="24H" />
              <TimeRangeButton range="7d" label="7D" />
              <TimeRangeButton range="30d" label="30D" />
            </View>
          </View>

          <View style={styles.sensorGrid}>
            <SensorCard
              icon="droplet"
              label="Soil Moisture"
              value={field.moisture}
              unit="%"
              trend={field.moisture < 50 ? "down" : "stable"}
              color={
                field.moisture < 40
                  ? isDark
                    ? Colors.dark.warning
                    : Colors.light.warning
                  : undefined
              }
            />
            <SensorCard
              icon="activity"
              label="pH Level"
              value={field.ph}
              unit=""
              trend="stable"
            />
          </View>

          <View style={styles.sensorGrid}>
            <SensorCard
              icon="thermometer"
              label="Temperature"
              value={field.temperature}
              unit="°C"
              trend="up"
            />
            <SensorCard
              icon="wind"
              label="Nitrogen (N)"
              value={field.nitrogen}
              unit="%"
              trend="stable"
              color={isDark ? Colors.dark.success : Colors.light.success}
            />
          </View>

          <View style={styles.sensorGrid}>
            <SensorCard
              icon="layers"
              label="Phosphorus (P)"
              value={field.phosphorus}
              unit="%"
              trend="down"
            />
            <SensorCard
              icon="box"
              label="Potassium (K)"
              value={field.potassium}
              unit="%"
              trend="stable"
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Sensor Health
          </ThemedText>
          <View
            style={[
              styles.healthCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <View style={styles.healthRow}>
              <View style={styles.healthItem}>
                <Feather
                  name="check-circle"
                  size={18}
                  color={isDark ? Colors.dark.success : Colors.light.success}
                />
                <ThemedText style={styles.healthLabel}>All sensors online</ThemedText>
              </View>
              <ThemedText style={[styles.healthMeta, { color: theme.textSecondary }]}>
                Last calibrated: 3 days ago
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <Button onPress={handleManualIrrigation} style={styles.actionButton}>
            Start Manual Irrigation
          </Button>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Field Notes
          </ThemedText>
          <View
            style={[
              styles.notesCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <ThemedText style={[styles.notesPlaceholder, { color: theme.textSecondary }]}>
              No notes added yet. Tap to add field observations.
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
  },
  acres: {
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  timeRangeContainer: {
    flexDirection: "row",
    borderRadius: BorderRadius.full,
    padding: 2,
  },
  timeRangeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sensorGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  sensorCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  sensorIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  sensorLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  sensorValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  sensorValue: {
    fontSize: 24,
    fontWeight: "600",
  },
  sensorUnit: {
    fontSize: 14,
    marginLeft: 2,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  trendText: {
    fontSize: 11,
  },
  healthCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  healthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  healthItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  healthLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  healthMeta: {
    fontSize: 12,
  },
  actionButton: {
    width: "100%",
  },
  notesCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
  },
  notesPlaceholder: {
    fontSize: 14,
    textAlign: "center",
  },
});