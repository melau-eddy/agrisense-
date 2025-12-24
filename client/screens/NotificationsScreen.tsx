import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AlertCard } from "@/components/AlertCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors } from "@/constants/theme";
import { mockAlerts, Alert } from "@/lib/mockData";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [alerts, setAlerts] = useState(mockAlerts);

  const unreadCount = alerts.filter((a) => !a.read).length;

  const handleDismiss = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleMarkAllRead = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const handlePress = (alert: Alert) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, read: true } : a))
    );
  };

  const renderAlert = ({ item }: { item: Alert }) => (
    <AlertCard
      alert={item}
      onPress={() => handlePress(item)}
      onDismiss={() => handleDismiss(item.id)}
    />
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </ThemedText>
        </View>
        {unreadCount > 0 ? (
          <Pressable onPress={handleMarkAllRead}>
            <ThemedText
              style={[
                styles.markAllRead,
                { color: isDark ? Colors.dark.primary : Colors.light.primary },
              ]}
            >
              Mark all as read
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather
              name="bell-off"
              size={48}
              color={theme.textSecondary}
            />
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              No notifications
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              You're all caught up. Check back later for updates.
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerLeft: {},
  subtitle: {
    fontSize: 14,
  },
  markAllRead: {
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: Spacing.lg,
  },
  separator: {
    height: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
});
