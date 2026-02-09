import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { getDatabase, ref, get, onValue, off } from "firebase/database";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KPICard } from "@/components/KPICard";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { subscribeToAlerts, Alert as AlertType } from "@/services/notifications/firebaseNotifications";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Helper function to extract sensor data
const extractSensorData = (data: any) => {
  if (!data) return { soilMoisture: 0, pH: 0, temperature: 0 };
  
  return {
    soilMoisture: Number(data['soil moisture'] || data.soilMoisture || 0),
    pH: Number(data.ph || data.pH || 0),
    temperature: Number(data.temperature || 0)
  };
};

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
  const [farms, setFarms] = useState<any[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalWaterSaved: 0,
    waterSavingsPercentage: 0,
    yieldImprovement: 0,
    soilHealthScore: 0,
    co2Reduced: 0,
    averageMoisture: 0,
    averagePH: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [weatherForecast, setWeatherForecast] = useState([
    { day: "Today", condition: "sunny", temp: 28, rain: 10 },
    { day: "Tue", condition: "cloudy", temp: 26, rain: 20 },
    { day: "Wed", condition: "rain", temp: 22, rain: 80 },
    { day: "Thu", condition: "cloudy", temp: 24, rain: 30 },
    { day: "Fri", condition: "sunny", temp: 27, rain: 0 },
    { day: "Sat", condition: "wind", temp: 25, rain: 10 },
    { day: "Sun", condition: "sunny", temp: 29, rain: 5 },
  ]);
  const [unsubscribe, setUnsubscribe] = useState<() => void>(() => () => {});

  // Initialize Firebase
  const database = getDatabase();

  // Load all data from Firebase
  const loadAllData = async () => {
    if (!user) {
      setFarms([]);
      setOverallStats({
        totalWaterSaved: 0,
        waterSavingsPercentage: 0,
        yieldImprovement: 0,
        soilHealthScore: 0,
        co2Reduced: 0,
        averageMoisture: 0,
        averagePH: 0
      });
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      setIsLoading(true);
      setIsRefreshing(true);
      
      const farmsArray: any[] = [];
      let totalMoisture = 0;
      let totalPH = 0;
      let farmCount = 0;
      let healthyFarms = 0;
      
      // Load only farms that belong to the current user from the "farms" node
      const farmsRef = ref(database, 'farms');
      const farmsSnapshot = await get(farmsRef);
      
      if (farmsSnapshot.exists()) {
        const farmsData = farmsSnapshot.val();
        
        Object.keys(farmsData).forEach(key => {
          const farm = farmsData[key];
          
          // Only include farms that belong to the current user
          if (farm.userId !== user.uid) return;
          
          // Extract sensor data
          let sensorData;
          if (farm.sensorData) {
            sensorData = extractSensorData(farm.sensorData);
          } else {
            sensorData = extractSensorData(farm);
          }
          
          totalMoisture += sensorData.soilMoisture;
          totalPH += sensorData.pH;
          farmCount++;
          
          // Determine status
          let status: 'healthy' | 'attention' | 'critical' = farm.status || 'healthy';
          if (!farm.status) {
            if (sensorData.soilMoisture < 30 || sensorData.pH < 5 || sensorData.pH > 8) {
              status = 'attention';
            }
            if (sensorData.soilMoisture < 20 || sensorData.pH < 4 || sensorData.pH > 9) {
              status = 'critical';
            }
          }
          
          if (status === 'healthy') healthyFarms++;
          
          farmsArray.push({
            id: key,
            name: farm.name || `Farm ${key}`,
            acres: farm.totalAcres || 0,
            cropType: farm.cropTypes?.[0] || "Unknown",
            status,
            moisture: sensorData.soilMoisture,
            pH: sensorData.pH,
            temperature: sensorData.temperature,
            location: farm.location,
            soilType: farm.soilType,
            userId: farm.userId // Ensure we track the user ID
          });
        });
      }
      
      // Calculate overall statistics
      const averageMoisture = farmCount > 0 ? Math.round(totalMoisture / farmCount) : 0;
      const averagePH = farmCount > 0 ? parseFloat((totalPH / farmCount).toFixed(1)) : 0;
      const soilHealthScore = calculateSoilHealthScore(averageMoisture, averagePH);
      
      // Calculate water savings based on moisture levels
      // (Higher moisture = less need for irrigation = more water saved)
      const waterSavingsPercentage = calculateWaterSavings(farmsArray);
      
      // Calculate yield improvement based on soil health
      const yieldImprovement = calculateYieldImprovement(soilHealthScore);
      
      // Calculate CO2 reduction based on water savings
      const co2Reduced = Math.round(waterSavingsPercentage * 15); // 15kg CO2 per % water saved
      
      // Calculate total water saved (in liters)
      // Assuming average farm uses 10,000L per irrigation, 2 irrigations per week
      const totalWaterSaved = Math.round((waterSavingsPercentage / 100) * 10000 * 2 * farmsArray.length);
      
      setFarms(farmsArray);
      setOverallStats({
        totalWaterSaved,
        waterSavingsPercentage,
        yieldImprovement,
        soilHealthScore,
        co2Reduced,
        averageMoisture,
        averagePH
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Helper functions for calculations
  const calculateSoilHealthScore = (moisture: number, ph: number): number => {
    // Score based on moisture (optimal: 40-60%) and pH (optimal: 6-7)
    let score = 0;
    
    // Moisture score (max 50 points)
    if (moisture >= 40 && moisture <= 60) {
      score += 50; // Optimal range
    } else if (moisture >= 30 && moisture <= 70) {
      score += 30; // Acceptable range
    } else if (moisture >= 20 && moisture <= 80) {
      score += 15; // Marginal range
    } else {
      score += 5; // Poor
    }
    
    // pH score (max 50 points)
    if (ph >= 6 && ph <= 7) {
      score += 50; // Optimal for most crops
    } else if (ph >= 5.5 && ph <= 7.5) {
      score += 30; // Acceptable
    } else if (ph >= 5 && ph <= 8) {
      score += 15; // Marginal
    } else {
      score += 5; // Poor
    }
    
    return Math.min(score, 100);
  };

  const calculateWaterSavings = (farms: any[]): number => {
    if (farms.length === 0) return 0;
    
    // Calculate based on how many farms have optimal moisture (40-60%)
    // This reduces need for irrigation
    const optimalFarms = farms.filter(farm => farm.moisture >= 40 && farm.moisture <= 60).length;
    const savingsPercentage = (optimalFarms / farms.length) * 40; // Max 25% savings
    
    return Math.round(savingsPercentage);
  };

  const calculateYieldImprovement = (soilHealthScore: number): number => {
    // Yield improvement correlates with soil health
    // Perfect soil health (100) = 20% improvement
    return Math.round((soilHealthScore / 100) * 25);
  };

  useEffect(() => {
    if (isFocused) {
      loadAllData();
    }
    
    return () => {
      // Clean up any listeners
    };
  }, [isFocused, user]);

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

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAllData();
  };

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
    if (!user && action !== 'ai' && action !== 'settings') {
      Alert.alert("Login Required", "Please login to access this feature.");
      return;
    }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return theme.success;
      case 'attention': return theme.warning;
      case 'critical': return theme.critical;
      default: return theme.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top + 100 }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
            {user ? "Loading your farm data..." : "Loading..."}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const userFarms = farms.filter(farm => farm.userId === user?.uid);

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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
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
                        { backgroundColor: theme.critical },
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
          {user ? (
            <>
              <ThemedText type="h2" style={styles.welcomeTitle}>
                Welcome back, {user?.displayName?.split(' ')[0] || 'Farmer'}! 🌱
              </ThemedText>
              <ThemedText style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • {userFarms.length} farm{userFarms.length !== 1 ? 's' : ''}
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText type="h2" style={styles.welcomeTitle}>
                Welcome to AgriSense! 🌱
              </ThemedText>
              <ThemedText style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • Please login to access your farms
              </ThemedText>
            </>
          )}
        </View>

        {!user ? (
          <Pressable
            onPress={() => navigation.navigate('Login' as never)}
            style={[
              styles.loginRequiredCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <View style={styles.loginRequiredContent}>
              <View style={[styles.loginRequiredIcon, { backgroundColor: `${theme.warning}15` }]}>
                <Feather name="log-in" size={28} color={theme.warning} />
              </View>
              <View style={styles.loginRequiredText}>
                <ThemedText style={styles.loginRequiredTitle}>Login Required</ThemedText>
                <ThemedText style={[styles.loginRequiredDescription, { color: theme.textSecondary }]}>
                  Please login to view your farm dashboard and access all features
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </View>
          </Pressable>
        ) : recentAlert && (
          <Pressable
            style={[
              styles.alertBanner,
              { 
                backgroundColor: recentAlert.type === 'critical' 
                  ? `${theme.critical}15`
                  : recentAlert.type === 'warning'
                    ? `${theme.warning}15`
                    : theme.backgroundSecondary,
                borderColor: recentAlert.type === 'critical' 
                  ? theme.critical
                  : recentAlert.type === 'warning'
                    ? theme.warning
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
                    ? theme.critical
                    : recentAlert.type === 'warning'
                      ? theme.warning
                      : theme.text
                  } 
                />
                <View style={styles.alertBannerText}>
                  <ThemedText style={[
                    styles.alertBannerTitle,
                    { 
                      color: recentAlert.type === 'critical' 
                        ? theme.critical
                        : recentAlert.type === 'warning'
                          ? theme.warning
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
              backgroundColor: theme.primary,
              borderColor: theme.primaryVariant || theme.primary,
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

        {user && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="h3" style={styles.sectionTitle}>
                  My Farm Overview
                </ThemedText>
                <Pressable onPress={() => Alert.alert("Analytics", "Detailed analytics will be available soon")}>
                  <ThemedText type="link" style={{ color: theme.link }}>
                    View Analytics
                  </ThemedText>
                </Pressable>
              </View>
              
              {userFarms.length > 0 ? (
                <>
                  <View style={styles.kpiGrid}>
                    <KPICard
                      title="Water Savings"
                      value={overallStats.waterSavingsPercentage}
                      unit="%"
                      icon="droplet"
                      color={theme.accent}
                      trend="up"
                      trendValue="Based on sensor data"
                      onPress={() => handleQuickAction("irrigation")}
                    />
                    <KPICard
                      title="Yield Improvement"
                      value={overallStats.yieldImprovement}
                      unit="%"
                      icon="trending-up"
                      color={theme.success}
                      trend="up"
                      trendValue="Estimated from soil health"
                    />
                  </View>
                  <View style={styles.kpiGrid}>
                    <KPICard
                      title="Soil Health"
                      value={overallStats.soilHealthScore}
                      unit="/100"
                      icon="activity"
                      color={theme.primary}
                      trend="neutral"
                      trendValue={`Avg moisture: ${overallStats.averageMoisture}%`}
                      onPress={() => handleQuickAction("soil")}
                    />
                    <KPICard
                      title="Active Alerts"
                      value={getCriticalAlertsCount()}
                      icon="alert-triangle"
                      color={theme.critical}
                      trend={getCriticalAlertsCount() > 0 ? "up" : "neutral"}
                      trendValue={getCriticalAlertsCount() > 0 ? "Needs attention" : "All clear"}
                      onPress={() => handleQuickAction("notifications")}
                    />
                  </View>
                </>
              ) : (
                <Pressable
                  onPress={() => navigation.navigate('AddFarm' as never)}
                  style={[
                    styles.noFarmsKPICard,
                    { backgroundColor: theme.cardBackground, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.noFarmsKPIContent}>
                    <View style={[styles.noFarmsKPIIcon, { backgroundColor: `${theme.primary}15` }]}>
                      <Feather name="map" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.noFarmsKPIText}>
                      <ThemedText style={styles.noFarmsKPITitle}>No Farms Added Yet</ThemedText>
                      <ThemedText style={[styles.noFarmsKPIDescription, { color: theme.textSecondary }]}>
                        Add your first farm to start tracking metrics
                      </ThemedText>
                    </View>
                    <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                  </View>
                </Pressable>
              )}
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
                  <View style={[styles.quickActionIcon, { backgroundColor: `${theme.accent}15` }]}>
                    <Feather name="droplet" size={24} color={theme.accent} />
                  </View>
                  <ThemedText style={styles.quickActionText}>Irrigation Control</ThemedText>
                </Pressable>

                <Pressable
                  style={[styles.quickActionButton, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => handleQuickAction("ai")}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: `${theme.primary}15` }]}>
                    <Feather name="cpu" size={24} color={theme.primary} />
                  </View>
                  <ThemedText style={styles.quickActionText}>AI Assistant</ThemedText>
                </Pressable>

                <Pressable
                  style={[styles.quickActionButton, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => handleQuickAction("weather")}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: `${theme.warning}15` }]}>
                    <Feather name="cloud" size={24} color={theme.warning} />
                  </View>
                  <ThemedText style={styles.quickActionText}>Weather</ThemedText>
                </Pressable>

                <Pressable
                  style={[styles.quickActionButton, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => handleQuickAction("notifications")}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: `${theme.critical}15` }]}>
                    <Feather name="bell" size={24} color={theme.critical} />
                  </View>
                  <ThemedText style={styles.quickActionText}>
                    {unreadCount > 0 ? `Alerts (${unreadCount})` : 'Notifications'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {userFarms.length > 0 && (
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
                          { backgroundColor: `${theme.accent}15` },
                        ]}
                      >
                        <Feather
                          name="droplet"
                          size={24}
                          color={theme.accent}
                        />
                      </View>
                      <ThemedText type="h2" style={styles.impactValue}>
                        {(overallStats.totalWaterSaved / 1000).toFixed(0)}K
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
                          { backgroundColor: `${theme.success}15` },
                        ]}
                      >
                        <Feather
                          name="wind"
                          size={24}
                          color={theme.success}
                        />
                      </View>
                      <ThemedText type="h2" style={styles.impactValue}>
                        {overallStats.co2Reduced}
                      </ThemedText>
                      <ThemedText style={[styles.impactLabel, { color: theme.textSecondary }]}>
                        kg CO2 Reduced
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            )}

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
                {weatherForecast.map((day, index) => (
                  <View
                    key={index}
                    style={[
                      styles.weatherCard,
                      { backgroundColor: theme.cardBackground, borderColor: theme.border },
                      index === 0 && {
                        backgroundColor: theme.primary,
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
                          color={index === 0 ? "#FFFFFF" : theme.accent}
                        />
                        <ThemedText
                          style={[
                            styles.rainText,
                            {
                              color: index === 0 ? "#FFFFFF" : theme.accent,
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
                  My Fields ({userFarms.length} farm{userFarms.length !== 1 ? 's' : ''})
                </ThemedText>
                <Pressable onPress={() => navigation.navigate("Farms")}>
                  <ThemedText type="link" style={{ color: theme.link }}>
                    Manage Fields
                  </ThemedText>
                </Pressable>
              </View>
              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: theme.cardBackground, borderColor: theme.border },
                ]}
              >
                {userFarms.slice(0, 3).map((field, index) => (
                  <Pressable
                    key={field.id}
                    onPress={() => navigation.navigate("Farms")}
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
                            backgroundColor: getStatusColor(field.status),
                          },
                        ]}
                      />
                      <View>
                        <ThemedText style={styles.summaryName}>{field.name}</ThemedText>
                        <ThemedText style={[styles.summaryAcres, { color: theme.textSecondary }]}>
                          {field.acres > 0 ? `${field.acres} acres` : 'Unknown size'} • {field.cropType}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.summaryRight}>
                      <View style={styles.moistureContainer}>
                        <Feather
                          name="droplet"
                          size={14}
                          color={theme.accent}
                        />
                        <ThemedText style={styles.summaryMoisture}>{field.moisture}%</ThemedText>
                      </View>
                      <Feather name="chevron-right" size={16} color={theme.textSecondary} />
                    </View>
                  </Pressable>
                ))}
                
                {userFarms.length === 0 && (
                  <View style={styles.noData}>
                    <Feather name="map" size={24} color={theme.textSecondary} />
                    <ThemedText style={[styles.noDataText, { color: theme.textSecondary }]}>
                      No farms found. Add your first farm!
                    </ThemedText>
                    <Pressable
                      onPress={() => navigation.navigate('AddFarm' as never)}
                      style={[styles.addFirstFarmButton, { backgroundColor: theme.primary }]}
                    >
                      <Feather name="plus" size={16} color="#FFFFFF" />
                      <ThemedText style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginLeft: 6 }}>
                        Add First Farm
                      </ThemedText>
                    </Pressable>
                  </View>
                )}
                
                {userFarms.length > 3 && (
                  <Pressable
                    onPress={() => navigation.navigate("Farms")}
                    style={styles.viewAllFields}
                  >
                    <ThemedText style={[styles.viewAllText, { color: theme.link }]}>
                      View all {userFarms.length} fields
                    </ThemedText>
                    <Feather name="chevron-right" size={16} color={theme.link} />
                  </Pressable>
                )}
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
                            ? `${theme.critical}15`
                            : alert.type === 'warning'
                              ? `${theme.warning}15`
                              : alert.type === 'success'
                                ? `${theme.success}15`
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
                            alert.type === 'critical' ? theme.critical :
                            alert.type === 'warning' ? theme.warning :
                            alert.type === 'success' ? theme.success : theme.primary
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
          </>
        )}

        {!user && (
          <View style={styles.section}>
            <View style={[
              styles.infoCard,
              { backgroundColor: `${theme.primary}15`, borderColor: theme.primary },
              Shadows.small,
            ]}>
              <View style={styles.infoIcon}>
                <Feather name="info" size={24} color={theme.primary} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoTitle, { color: theme.primary }]}>
                  Get Started with AgriSense
                </ThemedText>
                <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
                  Login to access all features:
                  • Monitor your farms in real-time
                  • Control irrigation systems
                  • Get AI-powered insights
                  • Track environmental impact
                </ThemedText>
                <Pressable
                  onPress={() => navigation.navigate('Login' as never)}
                  style={[styles.loginActionButton, { backgroundColor: theme.primary }]}
                >
                  <Feather name="log-in" size={18} color="#FFFFFF" />
                  <ThemedText style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
                    Login to Get Started
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
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
  loginRequiredCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
  },
  loginRequiredContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  loginRequiredIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  loginRequiredText: {
    flex: 1,
  },
  loginRequiredTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  loginRequiredDescription: {
    fontSize: 13,
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
  noFarmsKPICard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  noFarmsKPIContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  noFarmsKPIIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  noFarmsKPIText: {
    flex: 1,
  },
  noFarmsKPITitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  noFarmsKPIDescription: {
    fontSize: 13,
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
  noData: {
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  noDataText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  addFirstFarmButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  viewAllFields: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
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
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginTop: 4,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  loginActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-start",
  },
});
