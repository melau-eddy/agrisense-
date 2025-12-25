import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { useTheme } from '@/hooks/useTheme';

// Import screens
import LoginScreen from './screens/auth/LoginScreen';
import SignupScreen from './screens/auth/SignupScreen';
import DashboardScreen from './screens/DashboardScreen';
import ChatScreen from './screens/ChatScreen';
import ControlScreen from './screens/ControlScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import { Colors } from '@/constants/theme';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Chat: undefined;
  Control: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Feather.glyphMap = 'home';

          if (route.name === 'Dashboard') {
            iconName = 'home';
          } else if (route.name === 'Chat') {
            iconName = 'message-circle';
          } else if (route.name === 'Control') {
            iconName = 'sliders';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          }

          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.backgroundDefault,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ tabBarLabel: 'AI Chat' }}
      />
      <Tab.Screen 
        name="Control" 
        component={ControlScreen}
        options={{ tabBarLabel: 'Control' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <div style={{ 
          flex: 1, 
          backgroundColor: '#F8F9FA',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div>Loading AgriSense...</div>
        </div>
      </SafeAreaProvider>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Auth screens
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      ) : (
        // Main app with tabs
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ 
              headerShown: true,
              headerTitle: 'AI Settings',
              headerBackTitle: 'Back'
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ChatProvider>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </ChatProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}