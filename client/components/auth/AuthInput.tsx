import React from "react";
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface AuthInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function AuthInput({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  ...props
}: AuthInputProps) {
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
      )}
      
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundSecondary,
            borderColor: error ? theme.critical : theme.border,
          },
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            {
              color: theme.text,
              paddingLeft: leftIcon ? Spacing.md : Spacing.lg,
              paddingRight: rightIcon ? Spacing.md : Spacing.lg,
            },
            style,
          ]}
          placeholderTextColor={theme.textSecondary}
          selectionColor={isDark ? Colors.dark.primary : Colors.light.primary}
          {...props}
        />
        
        {rightIcon && (
          <Pressable style={styles.rightIcon}>
            {rightIcon}
          </Pressable>
        )}
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={12} color={theme.critical} />
          <ThemedText style={[styles.errorText, { color: theme.critical }]}>
            {error}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    height: Spacing.inputHeight,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  leftIcon: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
  },
  rightIcon: {
    paddingRight: Spacing.lg,
    paddingLeft: Spacing.sm,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  errorText: {
    fontSize: 12,
  },
});