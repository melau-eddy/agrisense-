// Add to your existing RootStackNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import NotificationsScreen from "@/screens/NotificationsScreen";
import FieldDetailScreen from "@/screens/FieldDetailScreen";
import LoginScreen from "@/screens/auth/LoginScreen";
import SignupScreen from "@/screens/auth/SignupScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import ForgotPasswordScreen from "@/screens/auth/forgot-password";

export type RootStackParamList = {
  Auth: undefined;
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Notifications: undefined;
  FieldDetail: { fieldId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const opaqueScreenOptions = useScreenOptions({ transparent: false });

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {/* Auth Screens */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          ...opaqueScreenOptions,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{
          ...opaqueScreenOptions,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ 
          title: "Reset Password",
          headerShown: true 
        }}
      />
      
      {/* Main App */}
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          ...opaqueScreenOptions,
          presentation: "modal",
          headerTitle: "Notifications",
        }}
      />
      <Stack.Screen
        name="FieldDetail"
        component={FieldDetailScreen}
        options={{
          ...opaqueScreenOptions,
          headerTitle: "Field Details",
        }}
      />
    </Stack.Navigator>
  );
}
