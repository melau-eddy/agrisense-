import React from "react";
import {
  Pressable,
  PressableProps,
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface AuthButtonProps extends PressableProps {
  title: string;
  loading?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  variant?: "primary" | "outline" | "ghost";
}

export function AuthButton({
  title,
  loading,
  icon,
  variant = "primary",
  style,
  disabled,
  ...props
}: AuthButtonProps) {
  const { theme, isDark } = useTheme();

  const getButtonStyle = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: disabled ? theme.backgroundTertiary : theme.primary,
          borderWidth: 0,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: disabled ? theme.border : theme.textSecondary,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: disabled ? theme.backgroundTertiary : theme.primary,
          borderWidth: 0,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "primary":
        return theme.buttonText;
      case "outline":
        return disabled ? theme.textSecondary : theme.text;
      case "ghost":
        return disabled ? theme.textSecondary : theme.text;
      default:
        return theme.buttonText;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case "primary":
        return theme.buttonText;
      default:
        return getTextColor();
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        getButtonStyle(),
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? theme.buttonText : theme.text}
          size="small"
        />
      ) : (
        <View style={styles.buttonContent}>
          {icon && (
            <Feather
              name={icon}
              size={20}
              color={getIconColor()}
              style={styles.icon}
            />
          )}
          <ThemedText
            style={[
              styles.buttonText,
              {
                color: getTextColor(),
                fontWeight: variant === "primary" ? "600" : "500",
              },
            ]}
          >
            {title}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  buttonText: {
    fontSize: 16,
  },
});