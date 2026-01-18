import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DashboardScreen from "@/screens/DashboardScreen";
import FieldsScreen from "@/screens/FieldsScreen";
import ControlScreen from "@/screens/ControlScreen";
import InsightsScreen from "@/screens/InsightsScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { useTheme } from "@/hooks/useTheme";

export type MainTabParamList = {
  Dashboard: undefined;
  Fields: undefined;
  Control: undefined;
  Insights: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Calculate safe tab bar height
  const getTabBarHeight = () => {
    const baseHeight = Platform.OS === "ios" ? 52 : 60;
    const bottomInset = Platform.OS === "ios" ? insets.bottom : 0;
    return baseHeight + bottomInset;
  };

  const tabBarHeight = getTabBarHeight();

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.backgroundRoot,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: tabBarHeight,
          paddingBottom: Platform.OS === "ios" ? insets.bottom : 8,
          paddingTop: 8,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarItemStyle: {
          height: 44,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <Feather 
                name="home" 
                size={22} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Fields"
        component={FieldsScreen}
        options={{
          title: "Fields",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <Feather 
                name="grid" 
                size={22} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Control"
        component={ControlScreen}
        options={{
          title: "Control",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <View style={[
                styles.controlButton,
                { 
                  backgroundColor: focused ? theme.primary : theme.backgroundSecondary 
                }
              ]}>
                <Feather
                  name="sliders"
                  size={20}
                  color={focused ? "#FFFFFF" : color}
                />
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          title: "Insights",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <Feather 
                name="trending-up" 
                size={22} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <Feather 
                name="user" 
                size={22} 
                color={color} 
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 24,
    width: 24,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});