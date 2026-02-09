import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { useAuth } from "@/contexts/AuthContext";


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const { login, resetPassword } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(form.email, form.password);
      // Navigation is handled by AuthContext in App.tsx
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  // LoginScreen.tsx - Updated handleForgotPassword function
  // const handleForgotPassword = async () => {
  //   if (!form.email) {
  //     Alert.alert("Email Required", "Please enter your email address first.");
  //     return;
  //   }

  //   if (!/\S+@\S+\.\S+/.test(form.email)) {
  //     Alert.alert("Invalid Email", "Please enter a valid email address.");
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     const result = await resetPassword(form.email);
      
  //     if (result.success) {
  //       Alert.alert(
  //         "✅ Reset Email Sent",
  //         "Check your email for password reset instructions. The link will expire in 1 hour.",
  //         [{ text: "OK" }]
  //       );
  //     } else {
  //       Alert.alert("Reset Failed", result.error || "Failed to send reset email.");
  //     }
  //   } catch (error: any) {
  //     Alert.alert("Reset Failed", error.message || "An unexpected error occurred.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  // In LoginScreen.tsx
  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + Spacing["4xl"] },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View
              style={[
                styles.logoContainer,
                { backgroundColor: `${isDark ? Colors.dark.primary : Colors.light.primary}15` },
              ]}
            >
              <Feather
                name="droplet"
                size={40}
                color={isDark ? Colors.dark.primary : Colors.light.primary}
              />
            </View>
            <ThemedText type="h1" style={styles.title}>
              Welcome Back
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Sign in to access your AgriSense dashboard
            </ThemedText>
          </View>

          <View style={styles.form}>
            <AuthInput
              label="Email"
              placeholder="Enter your email"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              error={errors.email}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              leftIcon={
                <Feather
                  name="mail"
                  size={20}
                  color={errors.email ? theme.critical : theme.textSecondary}
                />
              }
            />

            <AuthInput
              label="Password"
              placeholder="Enter your password"
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              error={errors.password}
              secureTextEntry={secureTextEntry}
              autoCapitalize="none"
              autoComplete="password"
              leftIcon={
                <Feather
                  name="lock"
                  size={20}
                  color={errors.password ? theme.critical : theme.textSecondary}
                />
              }
              rightIcon={
                <Pressable onPress={() => setSecureTextEntry(!secureTextEntry)}>
                  <Feather
                    name={secureTextEntry ? "eye-off" : "eye"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>
              }
            />

            <Pressable
              onPress={handleForgotPassword}
              style={styles.forgotPassword}
            >
              <ThemedText type="link" style={{ color: theme.link }}>
                Forgot Password?
              </ThemedText>
            </Pressable>

            <AuthButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              icon="log-in"
              variant="primary"
              disabled={!form.email || !form.password}
            />

            <View style={styles.signupContainer}>
              <ThemedText style={{ color: theme.textSecondary }}>
                Don't have an account?
              </ThemedText>
              <Pressable onPress={() => navigation.navigate("Signup")}>
                <ThemedText type="link" style={[styles.signupText, { color: theme.link }]}>
                  {" "}Sign Up
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["4xl"],
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
  },
  form: {
    gap: Spacing.lg,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: -Spacing.sm,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xl,
  },
  signupText: {
    fontWeight: "600",
  },
});
