import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KPICard } from "@/components/KPICard";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { mockKPIs, mockFields, mockWeatherForecast } from "@/lib/mockData";
import { subscribeToAlerts, Alert as AlertType } from "@/services/notifications/firebaseNotifications";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const { theme, isDark } = useTheme();
  const { openChat } = useChat();
  const { user } = useAuth();
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [unsubscribe, setUnsubscribe] = useState<() => void>(() => () => {});

  useEffect(() => {
    if (!user?.uid || !isFocused) return;

    setIsLoadingAlerts(true);

    const unsubscribeAlerts = subscribeToAlerts(
      user.uid,
      (newAlerts) => {
        setAlerts(newAlerts);
        const unread = newAlerts.filter(alert => !alert.read).length;
        setUnreadCount(unread);
        setTotalAlerts(newAlerts.length);
        setIsLoadingAlerts(false);
      },
      (error) => {
        console.error('Error in alerts subscription:', error);
        setIsLoadingAlerts(false);
      }
    );

    setUnsubscribe(() => unsubscribeAlerts);

    return () => {
      unsubscribeAlerts();
    };
  }, [user?.uid, isFocused]);

  useEffect(() => {
    if (isFocused) {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        setIsLoadingAlerts(true);
      }
    }
  }, [isFocused]);

  const getWeatherIcon = (condition: string): keyof typeof Feather.glyphMap => {
    switch (condition) {
      case "sunny":
        return "sun";
      case "cloudy":
        return "cloud";
      case "rain":
        return "cloud-rain";
      case "storm":
        return "cloud-lightning";
      case "wind":
        return "wind";
      default:
        return "sun";
    }
  };

  const handleAIChatPress = () => {
    openChat();
    navigation.navigate("Chat");
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "irrigation":
        navigation.navigate("Control");
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
      case "settings":
        navigation.navigate("Settings");
        break;
      case "notifications":
        navigation.navigate("Notifications");
        break;
      default:
        Alert.alert("Action", `${action} feature coming soon`);
    }
  };

  const getCriticalAlertsCount = () => {
    return alerts.filter(alert => 
      (alert.type === 'critical' || alert.type === 'warning') && !alert.read
    ).length;
  };

  const getRecentAlert = () => {
    const unreadAlerts = alerts.filter(alert => !alert.read);
    if (unreadAlerts.length > 0) {
      return unreadAlerts[0];
    }
    return alerts.length > 0 ? alerts[0] : null;
  };

  const recentAlert = getRecentAlert();

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
        <View style={styles.header}>
          <HeaderTitle title="AgriSense" />
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => navigation.navigate("Notifications")}
              style={[styles.notificationButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              {isLoadingAlerts ? (
                <ActivityIndicator size="small" color={theme.text} />
              ) : (
                <>
                  <Feather name="bell" size={20} color={theme.text} />
                  {unreadCount > 0 && (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: isDark ? Colors.dark.critical : Colors.light.critical },
                      ]}
                    >
                      <ThemedText style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </ThemedText>
                    </View>
                  )}
                </>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.welcomeSection}>
          <ThemedText type="h2" style={styles.welcomeTitle}>
            Welcome back, {user?.displayName?.split(' ')[0] || 'Farmer'}! 🌱
          </ThemedText>
          <ThemedText style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </ThemedText>
        </View>

        {recentAlert && (
          <Pressable
            style={[
              styles.alertBanner,
              { 
                backgroundColor: recentAlert.type === 'critical' 
                  ? (isDark ? Colors.dark.critical : Colors.light.critical) + '15'
                  : recentAlert.type === 'warning'
                    ? (isDark ? Colors.dark.warning : Colors.light.warning) + '15'
                    : theme.backgroundSecondary,
                borderColor: recentAlert.type === 'critical' 
                  ? isDark ? Colors.dark.critical : Colors.light.critical
                  : recentAlert.type === 'warning'
                    ? isDark ? Colors.dark.warning : Colors.light.warning
                    : theme.border,
              }
            ]}
            onPress={() => navigation.navigate("Notifications")}
          >
            <View style={styles.alertBannerContent}>
              <View style={styles.alertBannerLeft}>
                <Feather 
                  name={recentAlert.type === 'critical' ? "alert-triangle" : "bell"} 
                  size={20} 
                  color={recentAlert.type === 'critical' 
                    ? isDark ? Colors.dark.critical : Colors.light.critical
                    : recentAlert.type === 'warning'
                      ? isDark ? Colors.dark.warning : Colors.light.warning
                      : theme.text
                  } 
                />
                <View style={styles.alertBannerText}>
                  <ThemedText style={[
                    styles.alertBannerTitle,
                    { 
                      color: recentAlert.type === 'critical' 
                        ? isDark ? Colors.dark.critical : Colors.light.critical
                        : recentAlert.type === 'warning'
                          ? isDark ? Colors.dark.warning : Colors.light.warning
                          : theme.text
                    }
                  ]}>
                    {recentAlert.type === 'critical' ? 'Critical Alert' : 
                     recentAlert.type === 'warning' ? 'Warning' : 'Notification'}
                  </ThemedText>
                  <ThemedText 
                    style={[styles.alertBannerMessage, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {recentAlert.title}
                  </ThemedText>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </View>
          </Pressable>
        )}

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
                Get instant advice on crops, irrigation, and farm management
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color="#FFFFFF" />
          </View>
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Farm Overview
            </ThemedText>
            <Pressable onPress={() => Alert.alert("Analytics", "Detailed analytics will be available soon")}>
              <ThemedText type="link" style={{ color: theme.link }}>
                View Analytics
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
              title="Active Alerts"
              value={getCriticalAlertsCount()}
              icon="alert-triangle"
              color={isDark ? Colors.dark.critical : Colors.light.critical}
              trend={getCriticalAlertsCount() > 0 ? "up" : "neutral"}
              trendValue={getCriticalAlertsCount() > 0 ? "Needs attention" : "All clear"}
              onPress={() => handleQuickAction("notifications")}
            />
          </View>
        </View>

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
              <ThemedText style={styles.quickActionText}>Irrigation Control</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.quickActionButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => handleQuickAction("ai")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${isDark ? Colors.dark.primary : Colors.light.primary}15` }]}>
                <Feather name="cpu" size={24} color={isDark ? Colors.dark.primary : Colors.light.primary} />
              </View>
              <ThemedText style={styles.quickActionText}>AI Assistant</ThemedText>
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
              onPress={() => handleQuickAction("notifications")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${isDark ? Colors.dark.critical : Colors.light.critical}15` }]}>
                <Feather name="bell" size={24} color={isDark ? Colors.dark.critical : Colors.light.critical} />
              </View>
              <ThemedText style={styles.quickActionText}>
                {unreadCount > 0 ? `Alerts (${unreadCount})` : 'Notifications'}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Environmental Impact
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              7-Day Weather Forecast
            </ThemedText>
            <Pressable onPress={() => handleQuickAction("weather")}>
              <ThemedText type="link" style={{ color: theme.link }}>
                Detailed Forecast
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
                {day.rain > 0 && (
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
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Field Status
            </ThemedText>
            <Pressable onPress={() => Alert.alert("Fields", "All fields view will be available soon")}>
              <ThemedText type="link" style={{ color: theme.link }}>
                View All Fields
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
                onPress={() => Alert.alert("Field Details", `Details for ${field.name}`)}
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
                      {field.acres} acres • {field.cropType}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.summaryRight}>
                  <View style={styles.moistureContainer}>
                    <Feather
                      name="droplet"
                      size={14}
                      color={isDark ? Colors.dark.accent : Colors.light.accent}
                    />
                    <ThemedText style={styles.summaryMoisture}>{field.moisture}%</ThemedText>
                  </View>
                  <Feather name="chevron-right" size={16} color={theme.textSecondary} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Recent Activity
          </ThemedText>
          <View
            style={[
              styles.activityCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            {alerts.slice(0, 2).map((alert, index) => (
              <Pressable
                key={alert.id}
                onPress={() => navigation.navigate("Notifications")}
                style={[
                  styles.activityRow,
                  index < 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 },
                ]}
              >
                <View style={styles.activityLeft}>
                  <View style={[
                    styles.activityIcon,
                    { 
                      backgroundColor: alert.type === 'critical' 
                        ? `${Colors.light.critical}15`
                        : alert.type === 'warning'
                          ? `${Colors.light.warning}15`
                          : alert.type === 'success'
                            ? `${Colors.light.success}15`
                            : `${theme.primary}15`
                    }
                  ]}>
                    <Feather 
                      name={
                        alert.type === 'critical' ? "alert-triangle" :
                        alert.type === 'warning' ? "alert-circle" :
                        alert.type === 'success' ? "check-circle" : "info"
                      } 
                      size={16} 
                      color={
                        alert.type === 'critical' ? Colors.light.critical :
                        alert.type === 'warning' ? Colors.light.warning :
                        alert.type === 'success' ? Colors.light.success : theme.primary
                      } 
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <ThemedText style={styles.activityTitle}>{alert.title}</ThemedText>
                    <ThemedText style={[styles.activitySubtitle, { color: theme.textSecondary }]}>
                      {alert.category.charAt(0).toUpperCase() + alert.category.slice(1)}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.activityRight}>
                  <ThemedText style={[styles.activityTime, { color: theme.textSecondary }]}>
                    {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </ThemedText>
                  {!alert.read && (
                    <View style={[styles.activityUnread, { backgroundColor: theme.primary }]} />
                  )}
                </View>
              </Pressable>
            ))}
            
            {alerts.length === 0 && (
              <View style={styles.noActivity}>
                <Feather name="check-circle" size={24} color={theme.textSecondary} />
                <ThemedText style={[styles.noActivityText, { color: theme.textSecondary }]}>
                  No recent activity
                </ThemedText>
              </View>
            )}
            
            {alerts.length > 0 && (
              <Pressable
                onPress={() => navigation.navigate("Notifications")}
                style={styles.viewAllActivity}
              >
                <ThemedText style={[styles.viewAllText, { color: theme.link }]}>
                  View all activity
                </ThemedText>
                <Feather name="chevron-right" size={16} color={theme.link} />
              </Pressable>
            )}
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
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
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
  alertBanner: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
  },
  alertBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alertBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  alertBannerText: {
    flex: 1,
  },
  alertBannerTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  alertBannerMessage: {
    fontSize: 13,
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
    marginBottom: 0,
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
  moistureContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  summaryMoisture: {
    fontSize: 14,
    fontWeight: "600",
  },
  activityCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
  },
  activityRight: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  activityTime: {
    fontSize: 11,
  },
  activityUnread: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  noActivity: {
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  noActivityText: {
    fontSize: 14,
  },
  viewAllActivity: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
});