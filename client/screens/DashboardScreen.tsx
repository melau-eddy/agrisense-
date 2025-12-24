import React from "react";
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Alert 
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KPICard } from "@/components/KPICard";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { useChat } from "@/contexts/ChatContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { mockKPIs, mockFields, mockWeatherForecast } from "@/lib/mockData";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const { openChat } = useChat();

  const getWeatherIcon = (condition: string): keyof typeof Feather.glyphMap => {
    switch (condition) {
      case "sunny":
        return "sun";
      case "cloudy":
        return "cloud";
      case "rain":
        return "cloud-rain";
      default:
        return "sun";
    }
  };

  const activeAlerts = 2;

  const handleAIChatPress = () => {
    openChat();
    navigation.navigate("Chat");
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "irrigation":
        Alert.alert("Irrigation", "Opening irrigation controls...");
        break;
      case "soil":
        Alert.alert("Soil Analysis", "Opening soil analysis...");
        break;
      case "weather":
        Alert.alert("Weather", "Checking detailed weather forecast...");
        break;
      case "ai":
        handleAIChatPress();
        break;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <HeaderTitle title="AgriSense" />
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => navigation.navigate("Notifications")}
              style={[styles.notificationButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Feather name="bell" size={20} color={theme.text} />
              {activeAlerts > 0 ? (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: isDark ? Colors.dark.critical : Colors.light.critical },
                  ]}
                >
                  <ThemedText style={styles.badgeText}>{activeAlerts}</ThemedText>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate("Profile")}
              style={[styles.profileButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Feather name="user" size={20} color={theme.text} />
            </Pressable>
          </View>
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <ThemedText type="h2" style={styles.welcomeTitle}>
            Good morning, Farmer! 🌱
          </ThemedText>
          <ThemedText style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
            Your fields are looking healthy today
          </ThemedText>
        </View>

        {/* AI Assistant Quick Access */}
        <Pressable
          style={[
            styles.aiAssistantCard,
            { 
              backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
              borderColor: isDark ? Colors.dark.primaryVariant : Colors.light.primaryVariant,
            }
          ]}
          onPress={handleAIChatPress}
        >
          <View style={styles.aiAssistantContent}>
            <View style={styles.aiAssistantIcon}>
              <Feather name="cpu" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.aiAssistantText}>
              <ThemedText style={styles.aiAssistantTitle}>
                AgriSense AI Assistant
              </ThemedText>
              <ThemedText style={styles.aiAssistantDescription}>
                Ask questions about crops, weather, soil health, and more
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color="#FFFFFF" />
          </View>
        </Pressable>

        {/* Overview Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Overview
            </ThemedText>
            <Pressable onPress={() => navigation.navigate("DashboardDetails")}>
              <ThemedText type="link" style={{ color: theme.link }}>
                View All
              </ThemedText>
            </Pressable>
          </View>
          <View style={styles.kpiGrid}>
            <KPICard
              title="Water Savings"
              value={mockKPIs.waterSavings}
              unit="%"
              icon="droplet"
              color={isDark ? Colors.dark.accent : Colors.light.accent}
              trend="up"
              trendValue="+5% this week"
              onPress={() => handleQuickAction("irrigation")}
            />
            <KPICard
              title="Yield Improvement"
              value={mockKPIs.yieldImprovement}
              unit="%"
              icon="trending-up"
              color={isDark ? Colors.dark.success : Colors.light.success}
              trend="up"
              trendValue="+3% vs last season"
            />
          </View>
          <View style={styles.kpiGrid}>
            <KPICard
              title="Soil Health"
              value={mockKPIs.soilHealthScore}
              unit="/100"
              icon="activity"
              color={isDark ? Colors.dark.primary : Colors.light.primary}
              trend="neutral"
              trendValue="Stable"
              onPress={() => handleQuickAction("soil")}
            />
            <KPICard
              title="Active Fields"
              value={mockKPIs.activeFields}
              icon="grid"
              color={isDark ? Colors.dark.warning : Colors.light.warning}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <View style={styles.quickActionsGrid}>
            <Pressable
              style={[styles.quickActionButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => handleQuickAction("irrigation")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${isDark ? Colors.dark.accent : Colors.light.accent}15` }]}>
                <Feather name="droplet" size={24} color={isDark ? Colors.dark.accent : Colors.light.accent} />
              </View>
              <ThemedText style={styles.quickActionText}>Irrigation</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.quickActionButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => handleQuickAction("soil")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${isDark ? Colors.dark.primary : Colors.light.primary}15` }]}>
                <Feather name="thermometer" size={24} color={isDark ? Colors.dark.primary : Colors.light.primary} />
              </View>
              <ThemedText style={styles.quickActionText}>Soil Analysis</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.quickActionButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => handleQuickAction("weather")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${isDark ? Colors.dark.warning : Colors.light.warning}15` }]}>
                <Feather name="cloud" size={24} color={isDark ? Colors.dark.warning : Colors.light.warning} />
              </View>
              <ThemedText style={styles.quickActionText}>Weather</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.quickActionButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => handleQuickAction("ai")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${isDark ? Colors.dark.success : Colors.light.success}15` }]}>
                <Feather name="message-circle" size={24} color={isDark ? Colors.dark.success : Colors.light.success} />
              </View>
              <ThemedText style={styles.quickActionText}>AI Chat</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Impact Metrics */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Impact Metrics
          </ThemedText>
          <View
            style={[
              styles.impactCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <View style={styles.impactRow}>
              <View style={styles.impactItem}>
                <View
                  style={[
                    styles.impactIcon,
                    { backgroundColor: `${isDark ? Colors.dark.accent : Colors.light.accent}15` },
                  ]}
                >
                  <Feather
                    name="droplet"
                    size={24}
                    color={isDark ? Colors.dark.accent : Colors.light.accent}
                  />
                </View>
                <ThemedText type="h2" style={styles.impactValue}>
                  {(mockKPIs.totalWaterSaved / 1000).toFixed(0)}K
                </ThemedText>
                <ThemedText style={[styles.impactLabel, { color: theme.textSecondary }]}>
                  Liters Saved
                </ThemedText>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.impactItem}>
                <View
                  style={[
                    styles.impactIcon,
                    { backgroundColor: `${isDark ? Colors.dark.success : Colors.light.success}15` },
                  ]}
                >
                  <Feather
                    name="wind"
                    size={24}
                    color={isDark ? Colors.dark.success : Colors.light.success}
                  />
                </View>
                <ThemedText type="h2" style={styles.impactValue}>
                  {mockKPIs.co2Reduced}
                </ThemedText>
                <ThemedText style={[styles.impactLabel, { color: theme.textSecondary }]}>
                  kg CO2 Reduced
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Weather Forecast */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              7-Day Weather Forecast
            </ThemedText>
            <Pressable onPress={() => handleQuickAction("weather")}>
              <ThemedText type="link" style={{ color: theme.link }}>
                Details
              </ThemedText>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weatherScroll}
          >
            {mockWeatherForecast.map((day, index) => (
              <View
                key={index}
                style={[
                  styles.weatherCard,
                  { backgroundColor: theme.cardBackground, borderColor: theme.border },
                  index === 0 && {
                    backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
                    borderColor: "transparent",
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.weatherDay,
                    index === 0 && { color: "#FFFFFF" },
                    { color: index === 0 ? "#FFFFFF" : theme.textSecondary },
                  ]}
                >
                  {day.day}
                </ThemedText>
                <Feather
                  name={getWeatherIcon(day.condition)}
                  size={24}
                  color={index === 0 ? "#FFFFFF" : theme.text}
                />
                <ThemedText
                  style={[styles.weatherTemp, index === 0 && { color: "#FFFFFF" }]}
                >
                  {day.temp}°
                </ThemedText>
                {day.rain > 0 ? (
                  <View style={styles.rainRow}>
                    <Feather
                      name="droplet"
                      size={10}
                      color={index === 0 ? "#FFFFFF" : isDark ? Colors.dark.accent : Colors.light.accent}
                    />
                    <ThemedText
                      style={[
                        styles.rainText,
                        {
                          color:
                            index === 0
                              ? "#FFFFFF"
                              : isDark
                                ? Colors.dark.accent
                                : Colors.light.accent,
                        },
                      ]}
                    >
                      {day.rain}%
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Field Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Field Summary
            </ThemedText>
            <Pressable onPress={() => navigation.navigate("Fields")}>
              <ThemedText type="link" style={{ color: theme.link }}>
                View All
              </ThemedText>
            </Pressable>
          </View>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            {mockFields.slice(0, 3).map((field, index) => (
              <Pressable
                key={field.id}
                onPress={() => navigation.navigate("FieldDetail", { fieldId: field.id })}
                style={[
                  styles.summaryRow,
                  index < 2 && { borderBottomColor: theme.border, borderBottomWidth: 1 },
                ]}
              >
                <View style={styles.summaryLeft}>
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor:
                          field.status === "healthy"
                            ? isDark
                              ? Colors.dark.success
                              : Colors.light.success
                            : field.status === "attention"
                              ? isDark
                                ? Colors.dark.warning
                                : Colors.light.warning
                              : isDark
                                ? Colors.dark.critical
                                : Colors.light.critical,
                      },
                    ]}
                  />
                  <View>
                    <ThemedText style={styles.summaryName}>{field.name}</ThemedText>
                    <ThemedText style={[styles.summaryAcres, { color: theme.textSecondary }]}>
                      {field.acres} acres
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.summaryRight}>
                  <Feather
                    name="droplet"
                    size={14}
                    color={isDark ? Colors.dark.accent : Colors.light.accent}
                  />
                  <ThemedText style={styles.summaryMoisture}>{field.moisture}%</ThemedText>
                  <Feather name="chevron-right" size={16} color={theme.textSecondary} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent Alerts */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Recent Alerts
          </ThemedText>
          <View
            style={[
              styles.alertsCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <View style={styles.alertItem}>
              <View style={[styles.alertIcon, { backgroundColor: `${Colors.light.warning}15` }]}>
                <Feather name="alert-triangle" size={16} color={Colors.light.warning} />
              </View>
              <View style={styles.alertContent}>
                <ThemedText style={styles.alertTitle}>Low moisture detected</ThemedText>
                <ThemedText style={[styles.alertSubtitle, { color: theme.textSecondary }]}>
                  Field B - North Section
                </ThemedText>
              </View>
              <ThemedText style={[styles.alertTime, { color: theme.textSecondary }]}>
                2h ago
              </ThemedText>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: Spacing.md }]} />
            <View style={styles.alertItem}>
              <View style={[styles.alertIcon, { backgroundColor: `${Colors.light.success}15` }]}>
                <Feather name="check-circle" size={16} color={Colors.light.success} />
              </View>
              <View style={styles.alertContent}>
                <ThemedText style={styles.alertTitle}>Irrigation complete</ThemedText>
                <ThemedText style={[styles.alertSubtitle, { color: theme.textSecondary }]}>
                  Field C - Automated system
                </ThemedText>
              </View>
              <ThemedText style={[styles.alertTime, { color: theme.textSecondary }]}>
                5h ago
              </ThemedText>
            </View>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  welcomeSection: {
    marginBottom: Spacing.xl,
  },
  welcomeTitle: {
    marginBottom: Spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: 16,
  },
  aiAssistantCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
  },
  aiAssistantContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiAssistantIcon: {
    marginRight: Spacing.md,
  },
  aiAssistantText: {
    flex: 1,
  },
  aiAssistantTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  aiAssistantDescription: {
    color: "#FFFFFF",
    opacity: 0.9,
    fontSize: 13,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    // marginBottom is handled by sectionHeader
  },
  kpiGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  quickActionButton: {
    width: "48%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  impactCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
  },
  impactRow: {
    flexDirection: "row",
  },
  impactItem: {
    flex: 1,
    alignItems: "center",
  },
  impactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  impactValue: {
    marginBottom: Spacing.xs,
  },
  impactLabel: {
    fontSize: 13,
    textAlign: "center",
  },
  divider: {
    width: 1,
    marginHorizontal: Spacing.lg,
  },
  weatherScroll: {
    gap: Spacing.md,
  },
  weatherCard: {
    width: 72,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: Spacing.sm,
  },
  weatherDay: {
    fontSize: 12,
    fontWeight: "600",
  },
  weatherTemp: {
    fontSize: 16,
    fontWeight: "600",
  },
  rainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  rainText: {
    fontSize: 10,
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
  },
  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryName: {
    fontSize: 15,
    fontWeight: "500",
  },
  summaryAcres: {
    fontSize: 12,
    marginTop: 2,
  },
  summaryRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  summaryMoisture: {
    fontSize: 14,
    fontWeight: "600",
  },
  alertsCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
  },
  alertTime: {
    fontSize: 12,
  },
});