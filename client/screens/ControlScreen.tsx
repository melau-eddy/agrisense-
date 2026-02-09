import React, { useState, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  Pressable, 
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  getDatabase, 
  ref, 
  get, 
  set, 
  update, 
  push, 
  onValue, 
  off,
  remove
} from "firebase/database";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

type RootStackParamList = {
  Control: undefined;
  Farms: undefined;
  AddFarm: undefined;
  FieldDetail: { fieldId: string };
};

interface Farm {
  id: string;
  name: string;
  location: string;
  totalAcres: number;
  cropTypes: string[];
  soilType: string;
  irrigationType: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  description?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  status: 'healthy' | 'attention' | 'critical';
  sensorData?: {
    soilMoisture: number;
    pH: number;
    temperature: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    lastUpdated: string;
  };
  irrigationSchedule?: {
    autoMode: boolean;
    scheduleTime: string;
    duration: number;
    lastUpdated: string;
  };
}

interface IrrigationSettings {
  autoMode: boolean;
  scheduleTime: string;
  duration: number;
  selectedFarmId: string;
  lastUpdated: string;
}

const IRRIGATION_SETTINGS_KEY = '@agrisense_irrigation_settings';

// Helper function to extract sensor data from any object structure
const extractSensorData = (data: any) => {
  if (!data) return { soilMoisture: 0, pH: 0, temperature: 0, nitrogen: 0, phosphorus: 0, potassium: 0 };
  
  return {
    soilMoisture: Number(data['soil moisture'] || data.soilMoisture || 0),
    pH: Number(data.ph || data.pH || 0),
    temperature: Number(data.temperature || 0),
    nitrogen: Number(data.nitrogen || 0),
    phosphorus: Number(data.phosphorus || 0),
    potassium: Number(data.potassium || 0)
  };
};

export default function ControlScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { user } = useAuth();

  // State
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [autoMode, setAutoMode] = useState(true);
  const [scheduleTime, setScheduleTime] = useState("06:00");
  const [duration, setDuration] = useState(45);
  const [showFarmPicker, setShowFarmPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customTime, setCustomTime] = useState("06:00");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isIrrigating, setIsIrrigating] = useState(false);
  const [nextIrrigationTime, setNextIrrigationTime] = useState("No schedule set");
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickFarmName, setQuickFarmName] = useState("");
  const [quickAddError, setQuickAddError] = useState("");
  const [realTimeSensorData, setRealTimeSensorData] = useState({
    soilMoisture: 0,
    pH: 0,
    temperature: 0
  });

  // Initialize Firebase
  const database = getDatabase();

  // Load farms and settings
  useEffect(() => {
    loadSettings();
    loadUserFarms();
    
    return () => {
      // Clean up any listeners
    };
  }, [user]);

  // Listen to real-time sensor data
  useEffect(() => {
    if (!selectedFarm) return;
    
    // Listen to sensor data from the correct location
    let sensorRef;
    if (selectedFarm.id.startsWith('farm')) {
      // For farm1-farm5, listen at root level
      sensorRef = ref(database, `${selectedFarm.id}`);
    } else {
      // For user-added farms in the "farms" node
      sensorRef = ref(database, `farms/${selectedFarm.id}/sensorData`);
    }
    
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        const sensorData = extractSensorData(data);
        
        setRealTimeSensorData({
          soilMoisture: sensorData.soilMoisture,
          pH: sensorData.pH,
          temperature: sensorData.temperature
        });
        
        // Update the farm in the list with latest sensor data
        setFarms(prevFarms => 
          prevFarms.map(farm => 
            farm.id === selectedFarm.id 
              ? { 
                  ...farm, 
                  sensorData: {
                    ...sensorData,
                    lastUpdated: new Date().toISOString()
                  }
                } 
              : farm
          )
        );
      }
    }, (error) => {
      console.error(`Error listening to ${selectedFarm.id}:`, error);
    });
    
    return () => {
      off(sensorRef);
    };
  }, [selectedFarm?.id, database]);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(IRRIGATION_SETTINGS_KEY);
      if (savedSettings) {
        const settings: IrrigationSettings = JSON.parse(savedSettings);
        setAutoMode(settings.autoMode);
        setScheduleTime(settings.scheduleTime);
        setDuration(settings.duration);
        
        // Try to find and select the saved farm (only if it belongs to current user)
        if (settings.selectedFarmId && farms.length > 0) {
          const savedFarm = farms.find(farm => farm.id === settings.selectedFarmId);
          if (savedFarm) {
            setSelectedFarm(savedFarm);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadUserFarms = async () => {
    if (!user) {
      setFarms([]);
      setSelectedFarm(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setIsRefreshing(true);
      
      const farmsArray: Farm[] = [];
      
      // Load only farms that belong to the current user from the "farms" node
      const farmsRef = ref(database, 'farms');
      const farmsSnapshot = await get(farmsRef);
      
      if (farmsSnapshot.exists()) {
        const farmsData = farmsSnapshot.val();
        
        Object.keys(farmsData).forEach(key => {
          const farm = farmsData[key];
          
          // Only include farms that belong to the current user
          if (farm.userId !== user.uid) return;
          
          // Extract sensor data - check both sensorData object and direct properties
          let sensorData;
          if (farm.sensorData) {
            sensorData = extractSensorData(farm.sensorData);
          } else {
            // Check if sensor data is stored directly on the farm object
            sensorData = extractSensorData(farm);
          }
          
          farmsArray.push({
            id: key,
            name: farm.name || `Farm ${key}`,
            location: farm.location || "",
            totalAcres: farm.totalAcres || 0,
            cropTypes: farm.cropTypes || [],
            soilType: farm.soilType || "",
            irrigationType: farm.irrigationType || "Manual",
            description: farm.description,
            coordinates: farm.coordinates,
            createdAt: farm.createdAt || new Date().toISOString(),
            updatedAt: farm.updatedAt || new Date().toISOString(),
            userId: farm.userId,
            status: farm.status || "healthy",
            sensorData: {
              ...sensorData,
              lastUpdated: farm.lastUpdated || new Date().toISOString()
            },
            irrigationSchedule: farm.irrigationSchedule
          });
        });
      }
      
      // Sort farms by name
      farmsArray.sort((a, b) => a.name.localeCompare(b.name));
      setFarms(farmsArray);
      
      // Select first farm if none selected
      if (farmsArray.length > 0 && !selectedFarm) {
        const firstFarm = farmsArray[0];
        setSelectedFarm(firstFarm);
        
        // Load farm-specific settings
        if (firstFarm.irrigationSchedule) {
          setAutoMode(firstFarm.irrigationSchedule.autoMode);
          setScheduleTime(firstFarm.irrigationSchedule.scheduleTime || "06:00");
          setDuration(firstFarm.irrigationSchedule.duration || 45);
        }
        
        // Load initial sensor data
        if (firstFarm.sensorData) {
          setRealTimeSensorData({
            soilMoisture: firstFarm.sensorData.soilMoisture,
            pH: firstFarm.sensorData.pH,
            temperature: firstFarm.sensorData.temperature
          });
        }
      }
      
    } catch (error) {
      console.error('Error loading farms:', error);
      Alert.alert("Error", "Failed to load farms. Please check your connection.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadUserFarms();
  };

  const handleDeleteFarm = async (farm: Farm) => {
    Alert.alert(
      "Delete Farm",
      `Are you sure you want to delete "${farm.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              
              const farmRef = ref(database, `farms/${farm.id}`);
              await remove(farmRef);
              
              // Update local state
              setFarms(prev => prev.filter(f => f.id !== farm.id));
              
              // If the deleted farm was selected, select another one or clear selection
              if (selectedFarm?.id === farm.id) {
                const remainingFarms = farms.filter(f => f.id !== farm.id);
                if (remainingFarms.length > 0) {
                  setSelectedFarm(remainingFarms[0]);
                } else {
                  setSelectedFarm(null);
                }
              }
              
              triggerHaptic('success');
              Alert.alert("✅ Farm Deleted", `Farm "${farm.name}" has been deleted successfully.`);
              
            } catch (error) {
              console.error('Error deleting farm:', error);
              Alert.alert("❌ Error", "Failed to delete farm. Please try again.");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const saveSettings = async () => {
    if (!selectedFarm) return;
    
    try {
      const settings: IrrigationSettings = {
        autoMode,
        scheduleTime,
        duration,
        selectedFarmId: selectedFarm.id,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(IRRIGATION_SETTINGS_KEY, JSON.stringify(settings));
      
      // Save to farm in database (only for user-added farms)
      if (!selectedFarm.id.startsWith('farm')) {
        const farmRef = ref(database, `farms/${selectedFarm.id}/irrigationSchedule`);
        await set(farmRef, {
          autoMode,
          scheduleTime,
          duration,
          lastUpdated: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleToggleMode = (value: boolean) => {
    setAutoMode(value);
    triggerHaptic('impact');
    saveSettings();
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
    if (!selectedFarm) {
      Alert.alert("No Farm Selected", "Please select a farm first.");
      return;
    }

    // For demo farms, we can't save schedules at root level
    if (selectedFarm.id.startsWith('farm')) {
      Alert.alert(
        "Schedule Saved Locally",
        `Irrigation schedule saved for ${selectedFarm.name}. Note: This schedule is saved locally as this is a demo farm.`,
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    try {
      triggerHaptic('success');
      
      // Save to Firebase (only for user-added farms)
      const scheduleRef = ref(database, `farms/${selectedFarm.id}/irrigationSchedule`);
      await set(scheduleRef, {
        autoMode,
        scheduleTime,
        duration,
        lastUpdated: new Date().toISOString(),
        nextIrrigation: scheduleTime
      });
      
      setNextIrrigationTime(`Scheduled for ${scheduleTime}`);
      
      Alert.alert(
        "✅ Schedule Saved",
        `Irrigation scheduled for ${selectedFarm.name} at ${scheduleTime} for ${duration} minutes.`,
        [{ text: "OK", style: "default" }]
      );

    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert("Error", "Failed to save schedule. Please try again.");
    }
  };

  const handleStartNow = async () => {
    if (!selectedFarm) {
      Alert.alert("No Farm Selected", "Please select a farm first.");
      return;
    }

    Alert.alert(
      "🚀 Start Irrigation Now?",
      `This will start manual irrigation for ${selectedFarm.name} for ${duration} minutes.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          style: "destructive",
          onPress: async () => {
            try {
              triggerHaptic('impact');
              setIsIrrigating(true);
              
              // Save irrigation log (only for user-added farms)
              if (!selectedFarm.id.startsWith('farm')) {
                const irrigationLogRef = push(ref(database, `farms/${selectedFarm.id}/irrigationLogs`));
                await set(irrigationLogRef, {
                  mode: 'manual',
                  duration,
                  startTime: new Date().toISOString(),
                  status: 'in_progress',
                  estimatedWaterUsage: duration * 100
                });
              }
              
              setNextIrrigationTime("Now - In Progress");
              
              Alert.alert(
                "✅ Irrigation Started",
                `Manual irrigation started for ${selectedFarm.name}. Duration: ${duration} minutes.\n\nEstimated water usage: ${duration * 100} liters`,
                [{ text: "OK", style: "default" }]
              );
              
              // Simulate completion
              setTimeout(async () => {
                setIsIrrigating(false);
                
                // Update log (only for user-added farms)
                if (!selectedFarm.id.startsWith('farm')) {
                  // In real implementation, you would update the log here
                }
                
                setNextIrrigationTime("Completed just now");
                
              }, 5000); // 5 seconds for demo
              
            } catch (error) {
              console.error('Error starting irrigation:', error);
              Alert.alert("Error", "Failed to start irrigation.");
              setIsIrrigating(false);
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

  const handleQuickAddFarm = async () => {
    if (!quickFarmName.trim()) {
      setQuickAddError("Farm name is required");
      return;
    }

    if (!user) {
      Alert.alert("Authentication Required", "Please login to add a farm.");
      return;
    }

    try {
      setIsLoading(true);
      
      const newFarm: any = {
        name: quickFarmName.trim(),
        location: "", // Leave empty until populated
        totalAcres: 0, // Leave as 0 until populated
        cropTypes: [], // Empty array until populated
        soilType: "", // Leave empty until populated
        irrigationType: "Manual", // Default
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user.uid, // Tie to current user
        status: 'healthy',
        sensorData: {
          soilMoisture: 0,
          pH: 0,
          temperature: 0,
          nitrogen: 0,
          phosphorus: 0,
          potassium: 0,
          lastUpdated: new Date().toISOString()
        }
      };
      
      const farmsRef = ref(database, 'farms');
      const newFarmRef = push(farmsRef);
      await set(newFarmRef, newFarm);
      
      const newFarmWithId: Farm = {
        id: newFarmRef.key!,
        ...newFarm
      };
      
      // Update local state
      setFarms(prev => [...prev, newFarmWithId]);
      setSelectedFarm(newFarmWithId);
      
      triggerHaptic('success');
      setShowQuickAddModal(false);
      
      Alert.alert(
        "✅ Farm Added",
        `Farm "${quickFarmName}" has been added to your account.\n\nPlease add more details in the Farms screen.`,
        [{ text: "OK", style: "default" }]
      );
      
      setQuickFarmName("");
      setQuickAddError("");
      
    } catch (error) {
      console.error("Error adding farm:", error);
      Alert.alert("❌ Error", "Failed to add farm.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return theme.success;
      case 'attention': return theme.warning;
      case 'critical': return theme.critical;
      default: return theme.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return "check-circle";
      case 'attention': return "alert-circle";
      case 'critical': return "alert-triangle";
      default: return "circle";
    }
  };

  // Calculate farm status based on sensor data
  const calculateFarmStatus = (farm: Farm): 'healthy' | 'attention' | 'critical' => {
    const moisture = farm.sensorData?.soilMoisture || 0;
    const ph = farm.sensorData?.pH || 0;
    
    // Simple logic for demo - adjust based on your requirements
    if (moisture < 30 || moisture > 70 || ph < 5 || ph > 8) {
      return 'attention';
    } else if (moisture < 20 || moisture > 80 || ph < 4 || ph > 9) {
      return 'critical';
    }
    return 'healthy';
  };

  // Loading State
  if (isLoading && !showQuickAddModal) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top + 100 }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
            Loading your farms...
          </ThemedText>
        </View>
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="h2" style={styles.title}>
            Irrigation Control
          </ThemedText>
          <View style={styles.headerActions}>
            {user ? (
              <Pressable
                onPress={() => setShowAddFarmModal(true)}
                style={[styles.addFarmButton, { backgroundColor: theme.backgroundSecondary }]}
              >
                <Feather name="plus" size={18} color={theme.primary} />
                <ThemedText style={[styles.addFarmText, { color: theme.primary }]}>
                  Add Farm
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => navigation.navigate('Login' as never)}
                style={[styles.loginButton, { backgroundColor: theme.primary }]}
              >
                <Feather name="log-in" size={18} color="#FFFFFF" />
                <ThemedText style={[styles.loginButtonText, { color: '#FFFFFF' }]}>
                  Login
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>

        {/* Farm Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Select Farm
            </ThemedText>
            <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              {farms.length} farm{farms.length !== 1 ? 's' : ''} in your account
            </ThemedText>
          </View>
          
          {!user ? (
            <Pressable
              onPress={() => navigation.navigate('Login' as never)}
              style={[
                styles.notLoggedInCard,
                { backgroundColor: theme.cardBackground, borderColor: theme.border },
                Shadows.small,
              ]}
            >
              <View style={styles.notLoggedInContent}>
                <View style={[styles.notLoggedInIcon, { backgroundColor: `${theme.warning}15` }]}>
                  <Feather name="lock" size={28} color={theme.warning} />
                </View>
                <View style={styles.notLoggedInText}>
                  <ThemedText style={styles.notLoggedInTitle}>Login Required</ThemedText>
                  <ThemedText style={[styles.notLoggedInDescription, { color: theme.textSecondary }]}>
                    Please login to view and manage your farms
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </View>
            </Pressable>
          ) : farms.length === 0 ? (
            <Pressable
              onPress={() => setShowAddFarmModal(true)}
              style={[
                styles.noFarmsCard,
                { backgroundColor: theme.cardBackground, borderColor: theme.border },
                Shadows.small,
              ]}
            >
              <View style={styles.noFarmsContent}>
                <View style={[styles.noFarmsIcon, { backgroundColor: `${theme.primary}15` }]}>
                  <Feather name="map" size={28} color={theme.primary} />
                </View>
                <View style={styles.noFarmsText}>
                  <ThemedText style={styles.noFarmsTitle}>No Farms Added</ThemedText>
                  <ThemedText style={[styles.noFarmsDescription, { color: theme.textSecondary }]}>
                    Add your first farm to start controlling irrigation
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </View>
            </Pressable>
          ) : (
            <>
              <Pressable
                onPress={() => setShowFarmPicker(!showFarmPicker)}
                style={[
                  styles.farmSelector,
                  { backgroundColor: theme.cardBackground, borderColor: theme.border },
                  Shadows.small,
                ]}
              >
                <View style={styles.farmInfo}>
                  <View style={styles.farmHeader}>
                    <View style={styles.farmNameRow}>
                      <ThemedText style={styles.farmName}>
                        {selectedFarm?.name || "Select a Farm"}
                      </ThemedText>
                      {selectedFarm && (
                        <Feather 
                          name={getStatusIcon(selectedFarm.status)} 
                          size={16} 
                          color={getStatusColor(selectedFarm.status)} 
                        />
                      )}
                    </View>
                    <ThemedText style={[styles.farmStatus, { color: getStatusColor(selectedFarm?.status || 'healthy') }]}>
                      {selectedFarm?.status.toUpperCase() || "HEALTHY"}
                    </ThemedText>
                  </View>
                  {selectedFarm && selectedFarm.sensorData && (
                    <View style={styles.farmDetails}>
                      <View style={styles.farmDetail}>
                        <Feather name="droplet" size={12} color={theme.textSecondary} />
                        <ThemedText style={[styles.farmDetailText, { color: theme.textSecondary }]}>
                          {selectedFarm.sensorData.soilMoisture}% moisture
                        </ThemedText>
                      </View>
                      {selectedFarm.totalAcres > 0 && (
                        <View style={styles.farmDetail}>
                          <Feather name="maximize" size={12} color={theme.textSecondary} />
                          <ThemedText style={[styles.farmDetailText, { color: theme.textSecondary }]}>
                            {selectedFarm.totalAcres} acres
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                <Feather
                  name={showFarmPicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>

              {showFarmPicker && (
                <View
                  style={[
                    styles.farmList,
                    { backgroundColor: theme.cardBackground, borderColor: theme.border },
                    Shadows.small,
                  ]}
                >
                  {farms.map((farm) => {
                    const farmStatus = calculateFarmStatus(farm);
                    const hasSensorData = farm.sensorData && (farm.sensorData.soilMoisture > 0 || farm.sensorData.pH > 0);
                    
                    return (
                      <View key={farm.id} style={styles.farmOptionContainer}>
                        <Pressable
                          onPress={() => {
                            const updatedFarm = { ...farm, status: farmStatus };
                            setSelectedFarm(updatedFarm);
                            setShowFarmPicker(false);
                            triggerHaptic('impact');
                            
                            // Load farm settings
                            if (farm.irrigationSchedule) {
                              setAutoMode(farm.irrigationSchedule.autoMode);
                              setScheduleTime(farm.irrigationSchedule.scheduleTime || "06:00");
                              setDuration(farm.irrigationSchedule.duration || 45);
                            }
                            
                            // Load initial sensor data
                            if (farm.sensorData) {
                              setRealTimeSensorData({
                                soilMoisture: farm.sensorData.soilMoisture,
                                pH: farm.sensorData.pH,
                                temperature: farm.sensorData.temperature
                              });
                            }
                          }}
                          style={[
                            styles.farmOption,
                            farm.id === selectedFarm?.id && styles.farmOptionSelected,
                          ]}
                        >
                          <View style={styles.farmOptionLeft}>
                            <Feather 
                              name={getStatusIcon(farmStatus)} 
                              size={14} 
                              color={getStatusColor(farmStatus)} 
                            />
                            <View style={styles.farmOptionInfo}>
                              <ThemedText style={styles.farmOptionName}>{farm.name}</ThemedText>
                              <ThemedText style={[styles.farmOptionDetails, { color: theme.textSecondary }]}>
                                {farm.cropTypes.length > 0 ? farm.cropTypes[0] : "Field"} • {farm.sensorData?.soilMoisture || 0}% moisture
                              </ThemedText>
                            </View>
                          </View>
                          <View style={styles.farmOptionRight}>
                            {farm.id.startsWith('farm') && (
                              <View style={[styles.sensorOnlyBadge, { backgroundColor: `${theme.accent}15` }]}>
                                <ThemedText style={[styles.sensorOnlyText, { color: theme.accent }]}>
                                  Demo
                                </ThemedText>
                              </View>
                            )}
                            {!hasSensorData && !farm.id.startsWith('farm') && (
                              <View style={[styles.noDataBadge, { backgroundColor: `${theme.warning}15` }]}>
                                <ThemedText style={[styles.noDataText, { color: theme.warning }]}>
                                  No Data
                                </ThemedText>
                              </View>
                            )}
                            {farm.id === selectedFarm?.id && (
                              <Feather name="check" size={18} color={theme.primary} />
                            )}
                          </View>
                        </Pressable>
                        
                        {/* Delete button for user-added farms */}
                        {!farm.id.startsWith('farm') && (
                          <TouchableOpacity
                            onPress={() => handleDeleteFarm(farm)}
                            style={styles.deleteOptionButton}
                          >
                            <Feather name="trash-2" size={16} color={theme.critical} />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                  
                  <Pressable
                    onPress={() => {
                      setShowFarmPicker(false);
                      setShowAddFarmModal(true);
                    }}
                    style={[
                      styles.addNewFarmOption,
                      { borderTopColor: theme.border }
                    ]}
                  >
                    <View style={styles.addNewFarmContent}>
                      <View style={[styles.addNewFarmIcon, { backgroundColor: `${theme.primary}15` }]}>
                        <Feather name="plus" size={16} color={theme.primary} />
                      </View>
                      <ThemedText style={[styles.addNewFarmText, { color: theme.primary }]}>
                        Add New Farm
                      </ThemedText>
                    </View>
                    <Feather name="chevron-right" size={18} color={theme.textSecondary} />
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>

        {/* Real-time Sensor Data */}
        {selectedFarm && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Live Sensor Data
            </ThemedText>
            <View style={[
              styles.sensorCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
              Shadows.small,
            ]}>
              <View style={styles.sensorGrid}>
                <View style={styles.sensorItem}>
                  <View style={[styles.sensorIcon, { backgroundColor: `${theme.accent}15` }]}>
                    <Feather name="droplet" size={20} color={theme.accent} />
                  </View>
                  <ThemedText type="h2" style={styles.sensorValue}>
                    {realTimeSensorData.soilMoisture}%
                  </ThemedText>
                  <ThemedText style={[styles.sensorLabel, { color: theme.textSecondary }]}>
                    Soil Moisture
                  </ThemedText>
                </View>
                <View style={styles.sensorItem}>
                  <View style={[styles.sensorIcon, { backgroundColor: `${theme.primary}15` }]}>
                    <Feather name="activity" size={20} color={theme.primary} />
                  </View>
                  <ThemedText type="h2" style={styles.sensorValue}>
                    {realTimeSensorData.pH}
                  </ThemedText>
                  <ThemedText style={[styles.sensorLabel, { color: theme.textSecondary }]}>
                    pH Level
                  </ThemedText>
                </View>
                <View style={styles.sensorItem}>
                  <View style={[styles.sensorIcon, { backgroundColor: `${theme.warning}15` }]}>
                    <Feather name="thermometer" size={20} color={theme.warning} />
                  </View>
                  <ThemedText type="h2" style={styles.sensorValue}>
                    {realTimeSensorData.temperature || 0}°C
                  </ThemedText>
                  <ThemedText style={[styles.sensorLabel, { color: theme.textSecondary }]}>
                    Temperature
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.sensorNote, { color: theme.textSecondary }]}>
                {selectedFarm.id.startsWith('farm') 
                  ? "Demo farm data" 
                  : "Real-time data from your sensors"}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Irrigation Controls - Only show for user-added farms */}
        {selectedFarm && !selectedFarm.id.startsWith('farm') && (
          <>
            {/* Mode Selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="h4" style={styles.sectionTitle}>
                  Irrigation Mode
                </ThemedText>
                <View style={[
                  styles.modeBadge,
                  { backgroundColor: autoMode ? `${theme.success}15` : `${theme.warning}15` }
                ]}>
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
                          ? "AI automatically adjusts irrigation based on sensor data" 
                          : "You have full manual control over irrigation settings"}
                      </ThemedText>
                    </View>
                  </View>
                  <Switch
                    value={autoMode}
                    onValueChange={handleToggleMode}
                    trackColor={{ false: theme.backgroundTertiary, true: theme.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </View>

            {/* Schedule Time */}
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
                  <Pressable
                    key={time}
                    onPress={() => {
                      setScheduleTime(time);
                      triggerHaptic('impact');
                    }}
                    style={[
                      styles.timeButton,
                      scheduleTime === time && styles.timeButtonSelected,
                      {
                        backgroundColor: scheduleTime === time ? theme.primary : theme.backgroundSecondary,
                        borderColor: scheduleTime === time ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[styles.timeText, scheduleTime === time && styles.timeTextSelected]}
                    >
                      {time}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Duration */}
            <View style={styles.section}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Duration
              </ThemedText>
              <View style={styles.durationGrid}>
                {[15, 30, 45, 60, 90].map((mins) => (
                  <Pressable
                    key={mins}
                    onPress={() => {
                      setDuration(mins);
                      triggerHaptic('impact');
                    }}
                    style={[
                      styles.durationButton,
                      duration === mins && styles.durationButtonSelected,
                      {
                        backgroundColor: duration === mins ? theme.primary : theme.backgroundSecondary,
                        borderColor: duration === mins ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[styles.durationText, duration === mins && styles.durationTextSelected]}
                    >
                      {mins}m
                    </ThemedText>
                    {duration === mins && (
                      <View style={styles.durationBadge}>
                        <Feather name="check" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </Pressable>
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
                    name={isIrrigating ? "play-circle" : "clock"}
                    size={28}
                    color={isIrrigating ? theme.success : theme.primary}
                  />
                </View>
                <View style={styles.statusInfo}>
                  <ThemedText style={[styles.statusLabel, { color: theme.textSecondary }]}>
                    {isIrrigating ? "Currently Irrigating" : "Next Scheduled Irrigation"}
                  </ThemedText>
                  <ThemedText type="h3">{nextIrrigationTime}</ThemedText>
                  <ThemedText style={[styles.statusField, { color: theme.textSecondary }]}>
                    for {selectedFarm.name}
                  </ThemedText>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Info for demo farms */}
        {selectedFarm && selectedFarm.id.startsWith('farm') && (
          <View style={styles.section}>
            <View style={[
              styles.infoCard,
              { backgroundColor: `${theme.info}15`, borderColor: theme.info },
              Shadows.small,
            ]}>
              <View style={styles.infoIcon}>
                <Feather name="info" size={24} color={theme.info} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoTitle, { color: theme.info }]}>
                  Demo Farm
                </ThemedText>
                <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
                  This is a demo farm for testing sensor data. To add your own farm and control irrigation, please add a new farm.
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* User not logged in message */}
        {!user && (
          <View style={styles.section}>
            <View style={[
              styles.infoCard,
              { backgroundColor: `${theme.warning}15`, borderColor: theme.warning },
              Shadows.small,
            ]}>
              <View style={styles.infoIcon}>
                <Feather name="user-x" size={24} color={theme.warning} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoTitle, { color: theme.warning }]}>
                  Login Required
                </ThemedText>
                <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
                  Please login to add your own farms and access irrigation controls.
                </ThemedText>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons - Only show for user-added farms */}
      {selectedFarm && !selectedFarm.id.startsWith('farm') && (
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
            icon={isIrrigating ? "pause" : "play"}
            style={styles.secondaryButton}
            disabled={isIrrigating}
          >
            {isIrrigating ? "Stop" : "Start Now"}
          </Button>
          <Button
            onPress={handleSaveSchedule}
            variant="primary"
            icon="save"
            style={styles.primaryButton}
            disabled={isIrrigating}
          >
            Save Schedule
          </Button>
        </View>
      )}

      {/* Custom Time Modal */}
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

      {/* Add Farm Modal */}
      <Modal
        visible={showAddFarmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddFarmModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowAddFarmModal(false)}
        >
          <Pressable 
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBackground }
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Add New Farm</ThemedText>
              <Pressable onPress={() => setShowAddFarmModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            
            <ThemedText style={[styles.modalDescription, { color: theme.textSecondary }]}>
              Choose how you want to add a farm
            </ThemedText>
            
            <View style={styles.modalOptions}>
              <Pressable
                onPress={() => {
                  setShowAddFarmModal(false);
                  setTimeout(() => setShowQuickAddModal(true), 100);
                }}
                style={[
                  styles.modalOption,
                  { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }
                ]}
              >
                <View style={styles.optionIconContainer}>
                  <Feather name="plus-circle" size={24} color={theme.primary} />
                </View>
                <View style={styles.optionContent}>
                  <ThemedText style={styles.optionTitle}>Quick Add</ThemedText>
                  <ThemedText style={[styles.optionDescription, { color: theme.textSecondary }]}>
                    Add a farm with just a name for now, add more details later
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </Pressable>
              
              <Pressable
                onPress={() => {
                  setShowAddFarmModal(false);
                  navigation.navigate('AddFarm');
                }}
                style={[
                  styles.modalOption,
                  { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }
                ]}
              >
                <View style={styles.optionIconContainer}>
                  <Feather name="edit" size={24} color={theme.primary} />
                </View>
                <View style={styles.optionContent}>
                  <ThemedText style={styles.optionTitle}>Full Details</ThemedText>
                  <ThemedText style={[styles.optionDescription, { color: theme.textSecondary }]}>
                    Add all farm details including location, crops, soil type, etc.
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
            
            <View style={styles.modalButtons}>
              <Button
                onPress={() => setShowAddFarmModal(false)}
                variant="outline"
                style={styles.modalButton}
              >
                Cancel
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Quick Add Modal */}
      <Modal
        visible={showQuickAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isLoading) {
            setShowQuickAddModal(false);
          }
        }}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => {
            if (!isLoading) {
              setShowQuickAddModal(false);
            }
          }}
        >
          <Pressable 
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBackground }
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Quick Add Farm</ThemedText>
              {!isLoading && (
                <Pressable onPress={() => setShowQuickAddModal(false)}>
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              )}
            </View>
            
            <ThemedText style={[styles.modalDescription, { color: theme.textSecondary }]}>
              Enter a name for your new farm
            </ThemedText>
            
            <TextInput
              style={[
                styles.quickAddInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: quickAddError ? theme.critical : theme.border,
                }
              ]}
              value={quickFarmName}
              onChangeText={(text) => {
                setQuickFarmName(text);
                if (quickAddError) setQuickAddError("");
              }}
              placeholder="e.g., North Field, Main Farm, etc."
              placeholderTextColor={theme.textSecondary}
              autoFocus
              onSubmitEditing={handleQuickAddFarm}
              editable={!isLoading}
            />
            
            {quickAddError && (
              <ThemedText style={[styles.errorText, { color: theme.critical }]}>
                {quickAddError}
              </ThemedText>
            )}
            
            <View style={styles.modalButtons}>
              <Button
                onPress={() => {
                  if (!isLoading) {
                    setShowQuickAddModal(false);
                  }
                }}
                variant="outline"
                style={styles.modalButton}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onPress={handleQuickAddFarm}
                variant="primary"
                style={styles.modalButton}
                disabled={!quickFarmName.trim() || isLoading || !user}
                loading={isLoading}
              >
                {user ? 'Add Farm' : 'Login Required'}
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
  loadingText: {
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    flex: 1,
  },
  addFarmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addFarmText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  loginButtonText: {
    fontSize: 13,
    fontWeight: '600',
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
  notLoggedInCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  notLoggedInContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  notLoggedInIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notLoggedInText: {
    flex: 1,
  },
  notLoggedInTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notLoggedInDescription: {
    fontSize: 13,
  },
  noFarmsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  noFarmsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  noFarmsIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noFarmsText: {
    flex: 1,
  },
  noFarmsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  noFarmsDescription: {
    fontSize: 13,
  },
  farmSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  farmInfo: {
    flex: 1,
  },
  farmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  farmNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  farmName: {
    fontSize: 16,
    fontWeight: '600',
  },
  farmStatus: {
    fontSize: 11,
    fontWeight: '700',
  },
  farmDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  farmDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  farmDetailText: {
    fontSize: 12,
  },
  farmList: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  farmOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    flex: 1,
  },
  farmOptionSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  farmOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  farmOptionInfo: {
    flex: 1,
  },
  farmOptionName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  farmOptionDetails: {
    fontSize: 12,
  },
  farmOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  deleteOptionButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  sensorOnlyBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  sensorOnlyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  noDataBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  noDataText: {
    fontSize: 10,
    fontWeight: '600',
  },
  addNewFarmOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  addNewFarmContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  addNewFarmIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewFarmText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sensorCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  sensorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sensorItem: {
    alignItems: 'center',
    flex: 1,
  },
  sensorIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  sensorValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  sensorLabel: {
    fontSize: 12,
  },
  sensorNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  modeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
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
  modalDescription: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  modalOptions: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  quickAddInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: 12,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
