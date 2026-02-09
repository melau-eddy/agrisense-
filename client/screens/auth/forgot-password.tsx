// app/forgot-password.tsx
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

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    
    setError("");
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      const result = await resetPassword(email);
      
      if (result.success) {
        setIsSubmitted(true);
        Alert.alert(
          "✅ Reset Email Sent",
          "Check your email for password reset instructions. The link will expire in 1 hour.",
          [{ text: "OK" }]
        );
      } else {
        setError(result.error || "Failed to send reset email");
      }
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
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
                name="lock"
                size={40}
                color={isDark ? Colors.dark.primary : Colors.light.primary}
              />
            </View>
            
            <ThemedText type="h1" style={styles.title}>
              {isSubmitted ? "Check Your Email" : "Reset Password"}
            </ThemedText>
            
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              {isSubmitted 
                ? `We've sent password reset instructions to ${email}`
                : "Enter your email to receive reset instructions"}
            </ThemedText>
          </View>

          {isSubmitted ? (
            <View style={styles.successContainer}>
              <View style={[styles.successIcon, { backgroundColor: `${theme.success}15` }]}>
                <Feather name="check-circle" size={48} color={theme.success} />
              </View>
              
              <ThemedText style={[styles.successTitle, { color: theme.text }]}>
                Email Sent Successfully
              </ThemedText>
              
              <ThemedText style={[styles.successText, { color: theme.textSecondary }]}>
                Check your inbox at {email} and follow the instructions to reset your password.
              </ThemedText>
              
              <ThemedText style={[styles.noteText, { color: theme.textSecondary }]}>
                💡 Can't find the email? Check your spam folder or request a new reset link.
              </ThemedText>
              
              <View style={styles.buttonContainer}>
                <AuthButton
                  title="Back to Login"
                  onPress={handleBackToLogin}
                  variant="primary"
                  icon="arrow-left"
                  style={styles.backButton}
                />
                
                <AuthButton
                  title="Resend Email"
                  onPress={handleResetPassword}
                  variant="outline"
                  icon="refresh-cw"
                  style={styles.resendButton}
                />
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              <AuthInput
                label="Email Address"
                placeholder="Enter your registered email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError("");
                }}
                error={error}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                leftIcon={
                  <Feather
                    name="mail"
                    size={20}
                    color={error ? theme.critical : theme.textSecondary}
                  />
                }
              />

              <ThemedText style={[styles.instructions, { color: theme.textSecondary }]}>
                We'll send a password reset link to your email address.
              </ThemedText>

              <AuthButton
                title="Send Reset Instructions"
                onPress={handleResetPassword}
                loading={loading}
                icon="send"
                variant="primary"
                disabled={!email.trim() || loading}
              />

              <View style={styles.backToLoginContainer}>
                <Pressable
                  onPress={handleBackToLogin}
                  style={styles.backToLoginButton}
                >
                  <Feather name="arrow-left" size={16} color={theme.textSecondary} />
                  <ThemedText style={[styles.backToLoginText, { color: theme.textSecondary }]}>
                    Back to Login
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          )}
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
    paddingHorizontal: Spacing.xl,
  },
  form: {
    gap: Spacing.lg,
  },
  instructions: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  backToLoginContainer: {
    marginTop: Spacing.xl,
  },
  backToLoginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  backToLoginText: {
    fontSize: 14,
  },
  successContainer: {
    alignItems: "center",
    gap: Spacing.lg,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  successText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  noteText: {
    fontSize: 13,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  buttonContainer: {
    width: "100%",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  backButton: {
    width: "100%",
  },
  resendButton: {
    width: "100%",
  },
});
