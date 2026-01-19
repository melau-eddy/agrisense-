import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { Platform, StyleSheet, View, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DashboardScreen from "@/screens/DashboardScreen";
import FieldsScreen from "@/screens/FieldsScreen";
import ControlScreen from "@/screens/ControlScreen";
import InsightsScreen from "@/screens/InsightsScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export type MainTabParamList = {
  Dashboard: undefined;
  Fields: undefined;
  Control: undefined;
  Insights: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const { width } = Dimensions.get('window');

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Responsive tab bar height calculation
  const getTabBarHeight = () => {
    const isSmallDevice = width < 375; // iPhone SE, small Android devices
    const baseHeight = isSmallDevice ? 48 : Platform.OS === "ios" ? 52 : 60;
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
          paddingBottom: Platform.OS === "ios" ? insets.bottom : Spacing.sm,
          paddingTop: Platform.OS === "ios" ? Spacing.sm : Spacing.xs,
          paddingHorizontal: width < 375 ? Spacing.xs : Spacing.sm,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: width < 375 ? 9 : 10,
          fontWeight: "600",
          marginBottom: Platform.OS === "ios" ? 0 : Spacing.xs,
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === "ios" ? 0 : Spacing.xxs,
        },
        tabBarItemStyle: {
          height: width < 375 ? 40 : 44,
          paddingHorizontal: width < 375 ? 2 : 4,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <Feather 
                name="home" 
                size={width < 375 ? 20 : 22} 
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
                size={width < 375 ? 20 : 22} 
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
                  backgroundColor: focused ? theme.primary : theme.backgroundSecondary,
                  width: width < 375 ? 36 : 40,
                  height: width < 375 ? 36 : 40,
                  borderRadius: width < 375 ? 18 : 20,
                }
              ]}>
                <Feather
                  name="sliders"
                  size={width < 375 ? 18 : 20}
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
                size={width < 375 ? 20 : 22} 
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
                size={width < 375 ? 20 : 22} 
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
  },
  controlButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});