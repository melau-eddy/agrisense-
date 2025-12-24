import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { RecommendationCard } from "@/components/RecommendationCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { mockRecommendations, mockWeatherForecast, Recommendation } from "@/lib/mockData";

type FilterType = "all" | "irrigation" | "nutrient" | "soil";

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const [filter, setFilter] = useState<FilterType>("all");
  const [recommendations, setRecommendations] = useState(mockRecommendations);

  const filteredRecommendations = recommendations.filter(
    (rec) => filter === "all" || rec.type === filter
  );

  const handleApply = (recommendation: Recommendation) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert(
      "Recommendation Applied",
      `"${recommendation.title}" has been applied to ${recommendation.fieldName}.`,
      [{ text: "OK" }]
    );
    setRecommendations((prev) => prev.filter((r) => r.id !== recommendation.id));
  };

  const getWeatherIcon = (condition: string): keyof typeof Feather.glyphMap => {
    switch (condition) {
      case "sunny":
        return "sun";
      case "cloudy":
        return "cloud";
      case "rain":
        return "cloud-rain";
      default:
        return "sun";
    }
  };

  const FilterButton = ({
    type,
    label,
    icon,
  }: {
    type: FilterType;
    label: string;
    icon: keyof typeof Feather.glyphMap;
  }) => (
    <Pressable
      onPress={() => setFilter(type)}
      style={[
        styles.filterButton,
        {
          backgroundColor:
            filter === type
              ? isDark
                ? Colors.dark.primary
                : Colors.light.primary
              : theme.backgroundSecondary,
          borderColor: filter === type ? "transparent" : theme.border,
        },
      ]}
    >
      <Feather
        name={icon}
        size={14}
        color={filter === type ? "#FFFFFF" : theme.textSecondary}
      />
      <ThemedText
        style={[
          styles.filterText,
          { color: filter === type ? "#FFFFFF" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const ListHeader = () => (
    <>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="h2">AI Insights</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Smart recommendations for your fields
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Weather Outlook
        </ThemedText>
        <View
          style={[
            styles.weatherCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <View style={styles.weatherRow}>
            {mockWeatherForecast.slice(0, 5).map((day, index) => (
              <View key={index} style={styles.weatherItem}>
                <ThemedText style={[styles.weatherDay, { color: theme.textSecondary }]}>
                  {day.day}
                </ThemedText>
                <Feather
                  name={getWeatherIcon(day.condition)}
                  size={20}
                  color={theme.text}
                  style={styles.weatherIcon}
                />
                <ThemedText style={styles.weatherTemp}>{day.temp}°</ThemedText>
                {day.rain > 0 ? (
                  <ThemedText
                    style={[
                      styles.weatherRain,
                      { color: isDark ? Colors.dark.accent : Colors.light.accent },
                    ]}
                  >
                    {day.rain}%
                  </ThemedText>
                ) : null}
              </View>
            ))}
          </View>
          <View style={[styles.weatherAlert, { backgroundColor: `${isDark ? Colors.dark.accent : Colors.light.accent}15` }]}>
            <Feather
              name="info"
              size={16}
              color={isDark ? Colors.dark.accent : Colors.light.accent}
            />
            <ThemedText
              style={[
                styles.weatherAlertText,
                { color: isDark ? Colors.dark.accent : Colors.light.accent },
              ]}
            >
              Rain expected Wed-Thu. Consider delaying irrigation.
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.filterSection}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Recommendations ({filteredRecommendations.length})
        </ThemedText>
        <View style={styles.filterRow}>
          <FilterButton type="all" label="All" icon="layers" />
          <FilterButton type="irrigation" label="Water" icon="droplet" />
          <FilterButton type="nutrient" label="Nutrients" icon="wind" />
          <FilterButton type="soil" label="Soil" icon="activity" />
        </View>
      </View>
    </>
  );

  const renderRecommendation = ({ item }: { item: Recommendation }) => (
    <RecommendationCard recommendation={item} onApply={() => handleApply(item)} />
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={filteredRecommendations}
        renderItem={renderRecommendation}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather
              name="check-circle"
              size={48}
              color={isDark ? Colors.dark.success : Colors.light.success}
            />
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              All caught up!
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No pending recommendations for this category.
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
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  subtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  weatherCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  weatherRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  weatherItem: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  weatherDay: {
    fontSize: 12,
    fontWeight: "500",
  },
  weatherIcon: {
    marginVertical: Spacing.xs,
  },
  weatherTemp: {
    fontSize: 14,
    fontWeight: "600",
  },
  weatherRain: {
    fontSize: 11,
  },
  weatherAlert: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  weatherAlertText: {
    flex: 1,
    fontSize: 13,
  },
  filterSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
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
  },
});
