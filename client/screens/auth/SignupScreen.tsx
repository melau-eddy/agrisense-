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

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const { signup } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [secureTextEntry, setSecureTextEntry] = useState({
    password: true,
    confirmPassword: true,
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      // Navigation is handled by AuthContext in App.tsx
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSecureEntry = (field: "password" | "confirmPassword") => {
    setSecureTextEntry(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
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
            { paddingTop: insets.top + Spacing["2xl"] },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Feather name="chevron-left" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h1" style={styles.title}>
              Create Account
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Join AgriSense to optimize your farming operations
            </ThemedText>
          </View>

          <View style={styles.form}>
            <AuthInput
              label="Full Name"
              placeholder="Enter your full name"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              error={errors.name}
              autoCapitalize="words"
              autoComplete="name"
              leftIcon={
                <Feather
                  name="user"
                  size={20}
                  color={errors.name ? theme.critical : theme.textSecondary}
                />
              }
            />

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
              placeholder="Create a password"
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              error={errors.password}
              secureTextEntry={secureTextEntry.password}
              autoCapitalize="none"
              autoComplete="password-new"
              leftIcon={
                <Feather
                  name="lock"
                  size={20}
                  color={errors.password ? theme.critical : theme.textSecondary}
                />
              }
              rightIcon={
                <Pressable onPress={() => toggleSecureEntry("password")}>
                  <Feather
                    name={secureTextEntry.password ? "eye-off" : "eye"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>
              }
            />

            <AuthInput
              label="Confirm Password"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
              error={errors.confirmPassword}
              secureTextEntry={secureTextEntry.confirmPassword}
              autoCapitalize="none"
              autoComplete="password-new"
              leftIcon={
                <Feather
                  name="lock"
                  size={20}
                  color={errors.confirmPassword ? theme.critical : theme.textSecondary}
                />
              }
              rightIcon={
                <Pressable onPress={() => toggleSecureEntry("confirmPassword")}>
                  <Feather
                    name={secureTextEntry.confirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>
              }
            />

            <View style={styles.requirements}>
              <ThemedText style={[styles.requirementTitle, { color: theme.textSecondary }]}>
                Password must contain:
              </ThemedText>
              <View style={styles.requirementList}>
                <View style={styles.requirementItem}>
                  <Feather
                    name={form.password.length >= 6 ? "check-circle" : "circle"}
                    size={14}
                    color={form.password.length >= 6 ? theme.success : theme.textSecondary}
                  />
                  <ThemedText style={[styles.requirementText, { color: theme.textSecondary }]}>
                    At least 6 characters
                  </ThemedText>
                </View>
                <View style={styles.requirementItem}>
                  <Feather
                    name={form.password === form.confirmPassword && form.password.length > 0 ? "check-circle" : "circle"}
                    size={14}
                    color={form.password === form.confirmPassword && form.password.length > 0 ? theme.success : theme.textSecondary}
                  />
                  <ThemedText style={[styles.requirementText, { color: theme.textSecondary }]}>
                    Passwords match
                  </ThemedText>
                </View>
              </View>
            </View>

            <AuthButton
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              icon="user-plus"
              variant="primary"
              disabled={!form.name || !form.email || !form.password || !form.confirmPassword}
            />

            <View style={styles.loginContainer}>
              <ThemedText style={{ color: theme.textSecondary }}>
                Already have an account?
              </ThemedText>
              <Pressable onPress={() => navigation.navigate("Login")}>
                <ThemedText type="link" style={[styles.loginText, { color: theme.link }]}>
                  {" "}Sign In
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
    marginBottom: Spacing["2xl"],
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    paddingHorizontal: Spacing.xl,
  },
  form: {
    gap: Spacing.lg,
  },
  requirements: {
    marginTop: -Spacing.sm,
  },
  requirementTitle: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  requirementList: {
    gap: Spacing.xs,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  requirementText: {
    fontSize: 13,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xl,
  },
  loginText: {
    fontWeight: "600",
  },
});
