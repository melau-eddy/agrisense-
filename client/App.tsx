import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { Alert, Platform, View, Text } from 'react-native';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { NotificationsProvider, useNotifications } from '@/contexts/NotificationsContext';
import { useTheme } from '@/hooks/useTheme';
import { useResponsive } from '@/hooks/useResponsive';
import ResponsiveTabBar from '@/components/ResponsiveTabBar';

// Import screens
import LoginScreen from './screens/auth/LoginScreen';
import SignupScreen from './screens/auth/SignupScreen';
import DashboardScreen from './screens/DashboardScreen';
import ChatScreen from './screens/ChatScreen';
import ControlScreen from './screens/ControlScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SettingsScreen from './screens/SettingsScreen';
import FarmsScreen from './screens/FarmsScreen';
import AddFarmScreen from './screens/AddFarmScreen';
import { Colors } from '@/constants/theme';
import { FarmProvider } from './contexts/FarmContext';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
  Notifications: undefined;
  Settings: undefined;
  FieldDetail: { fieldId: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Chat: undefined;
  Control: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom tab bar icon component with notification badge
function TabBarIcon({ 
  name, 
  color, 
  size,
  showBadge,
  badgeCount 
}: { 
  name: keyof typeof Feather.glyphMap; 
  color: string; 
  size: number;
  showBadge?: boolean;
  badgeCount?: number;
}) {
  return (
    <div style={{ 
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Feather name={name} size={size} color={color} />
      {showBadge && (
        <div style={{
          position: 'absolute',
          top: -6,
          right: -6,
          backgroundColor: Colors.light.critical,
          borderRadius: 9,
          minWidth: 18,
          height: 18,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 4px',
          borderWidth: 2,
          borderStyle: 'solid',
          borderColor: '#FFFFFF',
          zIndex: 10,
        }}>
          <span style={{
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 'bold',
            lineHeight: 1,
          }}>
            {badgeCount && badgeCount > 99 ? '99+' : badgeCount}
          </span>
        </div>
      )}
    </div>
  );
}

function MainTabs() {
  const { theme } = useTheme();
  const { unreadCount } = useNotifications();
  const { isDesktop, isWeb } = useResponsive();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Feather.glyphMap = 'home';
          let showBadge = false;
          let badgeCount = 0;

          if (route.name === 'Dashboard') {
            iconName = 'home';
            showBadge = unreadCount > 0;
            badgeCount = unreadCount;
          } else if (route.name === 'Chat') {
            iconName = focused ? 'message-circle' : 'message-circle';
          } else if (route.name === 'Control') {
            iconName = 'sliders';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          }

          return (
            <TabBarIcon 
              name={iconName} 
              color={color} 
              size={size}
              showBadge={showBadge}
              badgeCount={badgeCount}
            />
          );
        },
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.backgroundDefault,
          borderTopColor: theme.border,
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
          ...(isWeb && {
            maxWidth: isDesktop ? 1200 : '100%',
            alignSelf: 'center',
            marginHorizontal: 'auto',
            width: '100%',
            borderTopLeftRadius: isDesktop ? 12 : 0,
            borderTopRightRadius: isDesktop ? 12 : 0,
            borderLeftWidth: isDesktop ? 1 : 0,
            borderRightWidth: isDesktop ? 1 : 0,
            borderLeftColor: isDesktop ? '#E5E7EB' : 'transparent',
            borderRightColor: isDesktop ? '#E5E7EB' : 'transparent',
            boxShadow: isDesktop ? '0 -2px 10px rgba(0, 0, 0, 0.05)' : 'none',
          }),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarItemStyle: {
          ...(isWeb && {
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }),
        },
      })}
      tabBar={(props) => <ResponsiveTabBar {...props} />}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ 
          tabBarLabel: 'Home',
        }}
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
  const { isWeb } = useResponsive();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setInitialized(true);
      } catch (error) {
        console.error('App initialization error:', error);
        Alert.alert('Initialization Error', 'Failed to initialize app. Please restart.');
        setInitialized(true);
      }
    };

    init();
  }, []);

  if (loading || !initialized) {
    return (
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <div style={{ 
          flex: 1, 
          backgroundColor: '#F8F9FA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(isWeb && {
            minHeight: '100vh',
            width: '100%',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          })
        }}>
          <div style={{
            width: 40,
            height: 40,
            border: `4px solid #2D7A4F`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: 16
          }} />
          <div style={{
            color: '#6B7280',
            fontSize: 16,
            fontWeight: 500,
            textAlign: 'center',
          }}>
            Loading AgriSense...
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </SafeAreaProvider>
    );
  }

  return (
    <Stack.Navigator 
      key={user ? 'authenticated' : 'unauthenticated'} // ← THIS IS THE KEY FIX
      screenOptions={{ 
        headerShown: false,
        contentStyle: {
          backgroundColor: '#F8F9FA'
        },
        ...(isWeb && {
          animation: 'none',
          gestureEnabled: false,
        }),
      }}
    >
      {!user ? (
        // Auth screens
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{
              ...(isWeb && {
                presentation: 'transparentModal',
              }),
            }}
          />
          <Stack.Screen 
            name="Signup" 
            component={SignupScreen}
            options={{
              ...(isWeb && {
                presentation: 'transparentModal',
              }),
            }}
          />
        </>
      ) : (
        // Main app with tabs
        <>
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabs}
            options={{
              ...(isWeb && {
                headerShown: false,
                contentStyle: {
                  backgroundColor: '#F8F9FA',
                  maxWidth: 1200,
                  marginHorizontal: 'auto',
                  width: '100%',
                },
              }),
            }}
          />
          <Stack.Screen 
            name="Notifications" 
            component={NotificationsScreen}
            options={{ 
              headerShown: true,
              headerTitle: 'Notifications',
              headerBackTitle: 'Back',
              headerStyle: {
                backgroundColor: '#FFFFFF',
                ...(isWeb && {
                  maxWidth: 1200,
                  marginHorizontal: 'auto',
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB',
                }),
              },
              headerTitleStyle: {
                fontSize: 18,
                fontWeight: '600',
              },
              headerTintColor: '#1A1A1A',
              ...(isWeb && {
                contentStyle: {
                  backgroundColor: '#F8F9FA',
                  maxWidth: 1200,
                  marginHorizontal: 'auto',
                },
              }),
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ 
              headerShown: true,
              headerTitle: 'AI Settings',
              headerBackTitle: 'Back',
              headerStyle: {
                backgroundColor: '#FFFFFF',
                ...(isWeb && {
                  maxWidth: 1200,
                  marginHorizontal: 'auto',
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB',
                }),
              },
              headerTitleStyle: {
                fontSize: 18,
                fontWeight: '600',
              },
              headerTintColor: '#1A1A1A',
              ...(isWeb && {
                contentStyle: {
                  backgroundColor: '#F8F9FA',
                  maxWidth: 1200,
                  marginHorizontal: 'auto',
                },
              }),
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// Main App component
export default function App() {
  const { isWeb } = useResponsive();
  
  return (
    <SafeAreaProvider>
      <AuthProvider>
      <FarmProvider> {/* Add this */}
        <ChatProvider>
          <NotificationsProvider>
            <NavigationContainer>
              {isWeb && (
                <div style={{
                  width: '100%',
                  minHeight: '100vh',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#F8F9FA',
                }}>
                  <AppNavigator />
                </div>
              )}
              {!isWeb && <AppNavigator />}
              <StatusBar style="auto" />
            </NavigationContainer>
          </NotificationsProvider>
        </ChatProvider>
        </FarmProvider> {/* Add this */}
      </AuthProvider>
    </SafeAreaProvider>
  );
}