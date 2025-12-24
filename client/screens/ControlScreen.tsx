import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Switch, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { mockFields, mockIrrigationLogs } from "@/lib/mockData";

export default function ControlScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();

  const [selectedField, setSelectedField] = useState(mockFields[0]);
  const [autoMode, setAutoMode] = useState(true);
  const [scheduleTime, setScheduleTime] = useState("06:00");
  const [duration, setDuration] = useState(45);
  const [showFieldPicker, setShowFieldPicker] = useState(false);

  const handleToggleMode = (value: boolean) => {
    if (!value) {
      Alert.alert(
        "Switch to Manual Mode",
        "Manual mode disables AI-optimized irrigation. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm",
            onPress: () => {
              setAutoMode(false);
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
            },
          },
        ]
      );
    } else {
      setAutoMode(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const handleSaveSchedule = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert(
      "Schedule Saved",
      `Irrigation scheduled for ${selectedField.name} at ${scheduleTime} for ${duration} minutes.`
    );
  };

  const handleStartNow = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      "Irrigation Started",
      `Manual irrigation started for ${selectedField.name}. Duration: ${duration} minutes.`
    );
  };

  const TimeButton = ({ time, selected }: { time: string; selected: boolean }) => (
    <Pressable
      onPress={() => setScheduleTime(time)}
      style={[
        styles.timeButton,
        {
          backgroundColor: selected
            ? isDark
              ? Colors.dark.primary
              : Colors.light.primary
            : theme.backgroundSecondary,
          borderColor: selected ? "transparent" : theme.border,
        },
      ]}
    >
      <ThemedText
        style={[styles.timeText, { color: selected ? "#FFFFFF" : theme.text }]}
      >
        {time}
      </ThemedText>
    </Pressable>
  );

  const DurationButton = ({ mins, selected }: { mins: number; selected: boolean }) => (
    <Pressable
      onPress={() => setDuration(mins)}
      style={[
        styles.durationButton,
        {
          backgroundColor: selected
            ? isDark
              ? Colors.dark.primary
              : Colors.light.primary
            : theme.backgroundSecondary,
          borderColor: selected ? "transparent" : theme.border,
        },
      ]}
    >
      <ThemedText
        style={[styles.durationText, { color: selected ? "#FFFFFF" : theme.text }]}
      >
        {mins}m
      </ThemedText>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl + 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="h2" style={styles.title}>
          Irrigation Control
        </ThemedText>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Select Field
          </ThemedText>
          <Pressable
            onPress={() => setShowFieldPicker(!showFieldPicker)}
            style={[
              styles.fieldSelector,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <View style={styles.fieldInfo}>
              <ThemedText style={styles.fieldName}>{selectedField.name}</ThemedText>
              <ThemedText style={[styles.fieldAcres, { color: theme.textSecondary }]}>
                {selectedField.acres} acres
              </ThemedText>
            </View>
            <Feather
              name={showFieldPicker ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>

          {showFieldPicker ? (
            <View
              style={[
                styles.fieldList,
                { backgroundColor: theme.cardBackground, borderColor: theme.border },
              ]}
            >
              {mockFields.map((field) => (
                <Pressable
                  key={field.id}
                  onPress={() => {
                    setSelectedField(field);
                    setShowFieldPicker(false);
                  }}
                  style={[
                    styles.fieldOption,
                    field.id === selectedField.id && {
                      backgroundColor: `${isDark ? Colors.dark.primary : Colors.light.primary}15`,
                    },
                  ]}
                >
                  <ThemedText>{field.name}</ThemedText>
                  {field.id === selectedField.id ? (
                    <Feather
                      name="check"
                      size={18}
                      color={isDark ? Colors.dark.primary : Colors.light.primary}
                    />
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.modeHeader}>
            <View>
              <ThemedText type="h4">Irrigation Mode</ThemedText>
              <ThemedText style={[styles.modeSubtitle, { color: theme.textSecondary }]}>
                {autoMode ? "AI-optimized scheduling" : "Manual control enabled"}
              </ThemedText>
            </View>
            <View style={styles.modeToggle}>
              <ThemedText style={[styles.modeLabel, { color: theme.textSecondary }]}>
                Auto
              </ThemedText>
              <Switch
                value={autoMode}
                onValueChange={handleToggleMode}
                trackColor={{
                  false: theme.backgroundTertiary,
                  true: isDark ? Colors.dark.primary : Colors.light.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Schedule Time
          </ThemedText>
          <View style={styles.timeGrid}>
            <TimeButton time="05:00" selected={scheduleTime === "05:00"} />
            <TimeButton time="06:00" selected={scheduleTime === "06:00"} />
            <TimeButton time="07:00" selected={scheduleTime === "07:00"} />
            <TimeButton time="18:00" selected={scheduleTime === "18:00"} />
            <TimeButton time="19:00" selected={scheduleTime === "19:00"} />
            <TimeButton time="20:00" selected={scheduleTime === "20:00"} />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Duration
          </ThemedText>
          <View style={styles.durationGrid}>
            <DurationButton mins={15} selected={duration === 15} />
            <DurationButton mins={30} selected={duration === 30} />
            <DurationButton mins={45} selected={duration === 45} />
            <DurationButton mins={60} selected={duration === 60} />
            <DurationButton mins={90} selected={duration === 90} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.statusCard}>
            <View
              style={[
                styles.statusIcon,
                { backgroundColor: `${isDark ? Colors.dark.accent : Colors.light.accent}15` },
              ]}
            >
              <Feather
                name="clock"
                size={24}
                color={isDark ? Colors.dark.accent : Colors.light.accent}
              />
            </View>
            <View style={styles.statusInfo}>
              <ThemedText style={[styles.statusLabel, { color: theme.textSecondary }]}>
                Next Scheduled Irrigation
              </ThemedText>
              <ThemedText type="h3">2h 15m</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Recent Logs
          </ThemedText>
          <View
            style={[
              styles.logsCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            {mockIrrigationLogs.slice(0, 3).map((log, index) => (
              <View
                key={log.id}
                style={[
                  styles.logRow,
                  index < 2 && { borderBottomColor: theme.border, borderBottomWidth: 1 },
                ]}
              >
                <View style={styles.logLeft}>
                  <ThemedText style={styles.logField}>{log.fieldName}</ThemedText>
                  <ThemedText style={[styles.logTime, { color: theme.textSecondary }]}>
                    {log.timestamp}
                  </ThemedText>
                </View>
                <View style={styles.logRight}>
                  <View
                    style={[
                      styles.logBadge,
                      {
                        backgroundColor:
                          log.mode === "auto"
                            ? `${isDark ? Colors.dark.success : Colors.light.success}15`
                            : `${isDark ? Colors.dark.warning : Colors.light.warning}15`,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.logBadgeText,
                        {
                          color:
                            log.mode === "auto"
                              ? isDark
                                ? Colors.dark.success
                                : Colors.light.success
                              : isDark
                                ? Colors.dark.warning
                                : Colors.light.warning,
                        },
                      ]}
                    >
                      {log.mode.toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.logVolume}>{log.volume}L</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.floatingActions,
          {
            backgroundColor: theme.backgroundRoot,
            paddingBottom: tabBarHeight + Spacing.md,
            borderTopColor: theme.border,
          },
        ]}
      >
        <Pressable
          onPress={handleStartNow}
          style={[styles.secondaryButton, { borderColor: theme.border }]}
        >
          <Feather
            name="play"
            size={18}
            color={isDark ? Colors.dark.primary : Colors.light.primary}
          />
          <ThemedText
            style={[
              styles.secondaryButtonText,
              { color: isDark ? Colors.dark.primary : Colors.light.primary },
            ]}
          >
            Start Now
          </ThemedText>
        </Pressable>
        <Button onPress={handleSaveSchedule} style={styles.primaryButton}>
          Save Schedule
        </Button>
      </View>
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
  },
  title: {
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  fieldSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  fieldInfo: {},
  fieldName: {
    fontSize: 16,
    fontWeight: "500",
  },
  fieldAcres: {
    fontSize: 13,
    marginTop: 2,
  },
  fieldList: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  fieldOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  modeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modeSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  modeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  modeLabel: {
    fontSize: 13,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  timeButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 15,
    fontWeight: "500",
  },
  durationGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  durationButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  durationText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  statusInfo: {},
  statusLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  logsCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
  },
  logLeft: {},
  logField: {
    fontSize: 14,
    fontWeight: "500",
  },
  logTime: {
    fontSize: 12,
    marginTop: 2,
  },
  logRight: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  logBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  logBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  logVolume: {
    fontSize: 13,
    fontWeight: "500",
  },
  floatingActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1,
  },
});
