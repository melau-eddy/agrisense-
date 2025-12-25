import React, { useState, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  Pressable, 
  Alert,
  TextInput,
  Modal
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";
import { mockFields, mockIrrigationLogs } from "@/lib/mockData";

// Types for irrigation settings
interface IrrigationSettings {
  autoMode: boolean;
  scheduleTime: string;
  duration: number;
  selectedFieldId: string;
  lastUpdated: string;
}

// Storage key
const IRRIGATION_SETTINGS_KEY = '@agrisense_irrigation_settings';

export default function ControlScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();

  const [selectedField, setSelectedField] = useState(mockFields[0]);
  const [autoMode, setAutoMode] = useState(true);
  const [scheduleTime, setScheduleTime] = useState("06:00");
  const [duration, setDuration] = useState(45);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customTime, setCustomTime] = useState("06:00");
  const [isLoading, setIsLoading] = useState(true);
  const [nextIrrigationTime, setNextIrrigationTime] = useState("2h 15m");

  // Load saved settings
  useEffect(() => {
    loadSettings();
  }, []);

  // Save settings when they change
  useEffect(() => {
    if (!isLoading) {
      saveSettings();
    }
  }, [autoMode, scheduleTime, duration, selectedField.id]);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(IRRIGATION_SETTINGS_KEY);
      if (savedSettings) {
        const settings: IrrigationSettings = JSON.parse(savedSettings);
        setAutoMode(settings.autoMode);
        setScheduleTime(settings.scheduleTime);
        setDuration(settings.duration);
        
        const field = mockFields.find(f => f.id === settings.selectedFieldId);
        if (field) {
          setSelectedField(field);
        }
      }
    } catch (error) {
      console.error('Failed to load irrigation settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const settings: IrrigationSettings = {
        autoMode,
        scheduleTime,
        duration,
        selectedFieldId: selectedField.id,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(IRRIGATION_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save irrigation settings:', error);
    }
  };

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
              triggerHaptic('warning');
              Alert.alert("Manual Mode Enabled", "You're now in full control of irrigation.");
            },
          },
        ]
      );
    } else {
      setAutoMode(true);
      triggerHaptic('success');
      Alert.alert("Auto Mode Enabled", "AI-optimized irrigation is now active.");
    }
  };

  const triggerHaptic = (type: 'success' | 'warning' | 'impact') => {
    if (Platform.OS === "web") return;
    
    try {
      switch (type) {
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'impact':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
      }
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      triggerHaptic('success');
      
      // In production, this would call your backend API
      // For now, we'll simulate the API call
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        "✅ Schedule Saved",
        `Irrigation scheduled for ${selectedField.name} at ${scheduleTime} for ${duration} minutes.`,
        [
          {
            text: "View Schedule",
            onPress: () => {
              // Navigate to schedule details
            },
          },
          { text: "OK", style: "default" },
        ]
      );

      // Update next irrigation time
      setNextIrrigationTime("Scheduled for " + scheduleTime);
    } catch (error) {
      Alert.alert("Error", "Failed to save schedule. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNow = async () => {
    Alert.alert(
      "🚀 Start Irrigation Now?",
      `This will start manual irrigation for ${selectedField.name} for ${duration} minutes.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          style: "destructive",
          onPress: async () => {
            try {
              triggerHaptic('impact');
              setIsLoading(true);
              
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              Alert.alert(
                "✅ Irrigation Started",
                `Manual irrigation started for ${selectedField.name}. Duration: ${duration} minutes.\n\nWater usage: ${Math.round(duration * 100)} liters`,
                [
                  {
                    text: "View Progress",
                    onPress: () => {
                      // Navigate to irrigation progress screen
                    },
                  },
                  { text: "OK", style: "default" },
                ]
              );
              
              // Update next irrigation time
              setNextIrrigationTime("Now - In Progress");
            } catch (error) {
              Alert.alert("Error", "Failed to start irrigation. Please check your connection.");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCustomTimeSelect = () => {
    if (customTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(customTime)) {
      setScheduleTime(customTime);
      setShowTimePicker(false);
      triggerHaptic('success');
    } else {
      Alert.alert("Invalid Time", "Please enter a valid time in HH:MM format.");
    }
  };

  const TimeButton = ({ time, selected }: { time: string; selected: boolean }) => (
    <Pressable
      onPress={() => {
        setScheduleTime(time);
        triggerHaptic('impact');
      }}
      style={[
        styles.timeButton,
        selected && styles.timeButtonSelected,
        {
          backgroundColor: selected
            ? theme.primary
            : theme.backgroundSecondary,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      <ThemedText
        style={[styles.timeText, selected && styles.timeTextSelected]}
      >
        {time}
      </ThemedText>
    </Pressable>
  );

  const DurationButton = ({ mins, selected }: { mins: number; selected: boolean }) => (
    <Pressable
      onPress={() => {
        setDuration(mins);
        triggerHaptic('impact');
      }}
      style={[
        styles.durationButton,
        selected && styles.durationButtonSelected,
        {
          backgroundColor: selected
            ? theme.primary
            : theme.backgroundSecondary,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      <ThemedText
        style={[styles.durationText, selected && styles.durationTextSelected]}
      >
        {mins}m
      </ThemedText>
      {selected && (
        <View style={styles.durationBadge}>
          <Feather name="check" size={12} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );

  const FieldStatusIndicator = ({ status }: { status: string }) => {
    let color = theme.success;
    if (status === 'attention') color = theme.warning;
    if (status === 'critical') color = theme.critical;

    return (
      <View style={[styles.statusDot, { backgroundColor: color }]} />
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <View style={[styles.loadingSpinner, { borderColor: theme.primary }]} />
        <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading irrigation controls...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="h2" style={styles.title}>
            Irrigation Control
          </ThemedText>
          <Pressable
            onPress={() => Alert.alert("Help", "Adjust irrigation settings for your fields.")}
            style={styles.helpButton}
          >
            <Feather name="help-circle" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Field Selection Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Select Field
            </ThemedText>
            <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Choose field to control
            </ThemedText>
          </View>
          <Pressable
            onPress={() => {
              setShowFieldPicker(!showFieldPicker);
              triggerHaptic('impact');
            }}
            style={[
              styles.fieldSelector,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
              Shadows.small,
            ]}
          >
            <View style={styles.fieldInfo}>
              <View style={styles.fieldHeader}>
                <ThemedText style={styles.fieldName}>{selectedField.name}</ThemedText>
                <FieldStatusIndicator status={selectedField.status} />
              </View>
              <View style={styles.fieldDetails}>
                <View style={styles.fieldDetail}>
                  <Feather name="map" size={12} color={theme.textSecondary} />
                  <ThemedText style={[styles.fieldDetailText, { color: theme.textSecondary }]}>
                    {selectedField.acres} acres
                  </ThemedText>
                </View>
                <View style={styles.fieldDetail}>
                  <Feather name="droplet" size={12} color={theme.textSecondary} />
                  <ThemedText style={[styles.fieldDetailText, { color: theme.textSecondary }]}>
                    {selectedField.moisture}% moisture
                  </ThemedText>
                </View>
              </View>
            </View>
            <Feather
              name={showFieldPicker ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>

          {showFieldPicker && (
            <View
              style={[
                styles.fieldList,
                { backgroundColor: theme.cardBackground, borderColor: theme.border },
                Shadows.small,
              ]}
            >
              {mockFields.map((field) => (
                <Pressable
                  key={field.id}
                  onPress={() => {
                    setSelectedField(field);
                    setShowFieldPicker(false);
                    triggerHaptic('impact');
                  }}
                  style={[
                    styles.fieldOption,
                    field.id === selectedField.id && styles.fieldOptionSelected,
                  ]}
                >
                  <View style={styles.fieldOptionContent}>
                    <FieldStatusIndicator status={field.status} />
                    <View style={styles.fieldOptionInfo}>
                      <ThemedText style={styles.fieldOptionName}>{field.name}</ThemedText>
                      <ThemedText style={[styles.fieldOptionDetails, { color: theme.textSecondary }]}>
                        {field.cropType} • {field.acres} acres
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.fieldOptionRight}>
                    <ThemedText style={[styles.fieldMoisture, { color: theme.textSecondary }]}>
                      {field.moisture}%
                    </ThemedText>
                    {field.id === selectedField.id && (
                      <Feather
                        name="check"
                        size={18}
                        color={theme.primary}
                      />
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Irrigation Mode Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Irrigation Mode
            </ThemedText>
            <View style={styles.modeBadge}>
              <ThemedText style={[
                styles.modeBadgeText,
                { color: autoMode ? theme.success : theme.warning }
              ]}>
                {autoMode ? "AI OPTIMIZED" : "MANUAL"}
              </ThemedText>
            </View>
          </View>
          
          <View style={[
            styles.modeCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
            Shadows.small,
          ]}>
            <View style={styles.modeContent}>
              <View style={styles.modeInfo}>
                <Feather 
                  name={autoMode ? "cpu" : "sliders"} 
                  size={24} 
                  color={autoMode ? theme.success : theme.warning} 
                />
                <View style={styles.modeText}>
                  <ThemedText style={styles.modeTitle}>
                    {autoMode ? "AI-Optimized Mode" : "Manual Control"}
                  </ThemedText>
                  <ThemedText style={[styles.modeDescription, { color: theme.textSecondary }]}>
                    {autoMode 
                      ? "AI automatically adjusts based on weather and soil data" 
                      : "You control all irrigation settings manually"}
                  </ThemedText>
                </View>
              </View>
              
              <Switch
                value={autoMode}
                onValueChange={handleToggleMode}
                trackColor={{
                  false: theme.backgroundTertiary,
                  true: theme.primary,
                }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.backgroundTertiary}
              />
            </View>
          </View>
        </View>

        {/* Schedule Time Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Schedule Time
            </ThemedText>
            <Pressable
              onPress={() => setShowTimePicker(true)}
              style={styles.customTimeButton}
            >
              <Feather name="clock" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.customTimeText, { color: theme.textSecondary }]}>
                Custom
              </ThemedText>
            </Pressable>
          </View>
          
          <View style={styles.timeGrid}>
            {["05:00", "06:00", "07:00", "18:00", "19:00", "20:00"].map((time) => (
              <TimeButton key={time} time={time} selected={scheduleTime === time} />
            ))}
          </View>
        </View>

        {/* Duration Section */}
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Duration
          </ThemedText>
          <View style={styles.durationGrid}>
            {[15, 30, 45, 60, 90].map((mins) => (
              <DurationButton key={mins} mins={mins} selected={duration === mins} />
            ))}
          </View>
          <ThemedText style={[styles.durationHint, { color: theme.textSecondary }]}>
            Estimated water usage: ~{Math.round(duration * 100)} liters
          </ThemedText>
        </View>

        {/* Status Card */}
        <View style={styles.section}>
          <View style={[
            styles.statusCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
            Shadows.small,
          ]}>
            <View style={styles.statusIcon}>
              <Feather
                name="clock"
                size={28}
                color={theme.primary}
              />
            </View>
            <View style={styles.statusInfo}>
              <ThemedText style={[styles.statusLabel, { color: theme.textSecondary }]}>
                Next Scheduled Irrigation
              </ThemedText>
              <ThemedText type="h3">{nextIrrigationTime}</ThemedText>
              <ThemedText style={[styles.statusField, { color: theme.textSecondary }]}>
                for {selectedField.name}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Recent Logs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Recent Irrigation Logs
            </ThemedText>
            <Pressable onPress={() => Alert.alert("View All", "Feature coming soon")}>
              <ThemedText style={[styles.viewAllText, { color: theme.link }]}>
                View All
              </ThemedText>
            </Pressable>
          </View>
          
          <View style={[
            styles.logsCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
            Shadows.small,
          ]}>
            {mockIrrigationLogs.slice(0, 3).map((log, index) => (
              <View
                key={log.id}
                style={[
                  styles.logRow,
                  index < 2 && { borderBottomColor: theme.border, borderBottomWidth: 1 },
                ]}
              >
                <View style={styles.logLeft}>
                  <View style={styles.logHeader}>
                    <ThemedText style={styles.logField}>{log.fieldName}</ThemedText>
                    <View style={[
                      styles.logModeBadge,
                      { 
                        backgroundColor: log.mode === 'auto' 
                          ? `${theme.success}15` 
                          : `${theme.warning}15` 
                      }
                    ]}>
                      <ThemedText style={[
                        styles.logModeText,
                        { 
                          color: log.mode === 'auto' 
                            ? theme.success 
                            : theme.warning 
                        }
                      ]}>
                        {log.mode.charAt(0).toUpperCase() + log.mode.slice(1)}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={[styles.logTime, { color: theme.textSecondary }]}>
                    <Feather name="clock" size={10} /> {log.timestamp}
                  </ThemedText>
                </View>
                <View style={styles.logRight}>
                  <ThemedText style={styles.logVolume}>{log.volume.toLocaleString()}L</ThemedText>
                  <ThemedText style={[styles.logDuration, { color: theme.textSecondary }]}>
                    {log.duration} min
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      <View
        style={[
          styles.floatingActions,
          {
            backgroundColor: theme.backgroundRoot,
            borderTopColor: theme.border,
          },
        ]}
      >
        <Button
          onPress={handleStartNow}
          variant="outline"
          icon="play"
          style={styles.secondaryButton}
          disabled={isLoading}
        >
          Start Now
        </Button>
        <Button
          onPress={handleSaveSchedule}
          variant="primary"
          icon="save"
          style={styles.primaryButton}
          loading={isLoading}
          disabled={isLoading}
        >
          Save Schedule
        </Button>
      </View>

      {/* Custom Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowTimePicker(false)}
        >
          <Pressable 
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBackground }
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Custom Time</ThemedText>
              <Pressable onPress={() => setShowTimePicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            
            <TextInput
              style={[
                styles.timeInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              value={customTime}
              onChangeText={setCustomTime}
              placeholder="HH:MM"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
            
            <View style={styles.modalButtons}>
              <Button
                onPress={() => setShowTimePicker(false)}
                variant="outline"
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleCustomTimeSelect}
                variant="primary"
                style={styles.modalButton}
              >
                Set Time
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderTopColor: 'transparent',
    marginBottom: Spacing.lg,
  },
  loadingText: {
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    flex: 1,
  },
  helpButton: {
    padding: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    // Style handled by ThemedText
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  fieldSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '600',
  },
  fieldDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  fieldDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  fieldDetailText: {
    fontSize: 12,
  },
  fieldList: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fieldOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  fieldOptionSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  fieldOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  fieldOptionInfo: {
    flex: 1,
  },
  fieldOptionName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  fieldOptionDetails: {
    fontSize: 12,
  },
  fieldOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  fieldMoisture: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modeCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  modeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  modeText: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  modeDescription: {
    fontSize: 13,
  },
  customTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.xs,
  },
  customTimeText: {
    fontSize: 12,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  timeButtonSelected: {
    ...Shadows.small,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeTextSelected: {
    color: '#FFFFFF',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  durationButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
    position: 'relative',
  },
  durationButtonSelected: {
    ...Shadows.small,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  durationTextSelected: {
    color: '#FFFFFF',
  },
  durationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  durationHint: {
    fontSize: 12,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statusField: {
    fontSize: 13,
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 13,
  },
  logsCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  logLeft: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  logField: {
    fontSize: 14,
    fontWeight: '600',
  },
  logModeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  logModeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  logTime: {
    fontSize: 12,
  },
  logRight: {
    alignItems: 'flex-end',
  },
  logVolume: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  logDuration: {
    fontSize: 11,
  },
  floatingActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
  },
  secondaryButton: {
    flex: 1,
  },
  primaryButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});