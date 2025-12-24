import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="h1" style={styles.greeting}>
              Welcome back, {user?.displayName?.split(' ')[0] || 'Farmer'}!
            </ThemedText>
            <ThemedText style={[styles.date, { color: theme.textSecondary }]}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </ThemedText>
          </View>
          
          <Pressable 
            style={[styles.notificationButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => console.log('Notifications')}
          >
            <Feather name="bell" size={24} color={theme.text} />
          </Pressable>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.primary}15` }]}>
              <Feather name="droplet" size={24} color={theme.primary} />
            </View>
            <ThemedText type="h2" style={styles.statValue}>85%</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Soil Moisture
            </ThemedText>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.success}15` }]}>
              <Feather name="thermometer" size={24} color={theme.success} />
            </View>
            <ThemedText type="h2" style={styles.statValue}>24°C</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Temperature
            </ThemedText>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.actionsGrid}>
            <Pressable style={[styles.actionCard, { backgroundColor: theme.cardBackground }]}>
              <View style={[styles.actionIcon, { backgroundColor: `${theme.primary}15` }]}>
                <Feather name="cloud" size={24} color={theme.primary} />
              </View>
              <ThemedText style={styles.actionText}>Weather</ThemedText>
            </Pressable>

            <Pressable style={[styles.actionCard, { backgroundColor: theme.cardBackground }]}>
              <View style={[styles.actionIcon, { backgroundColor: `${theme.accent}15` }]}>
                <Feather name="bar-chart-2" size={24} color={theme.accent} />
              </View>
              <ThemedText style={styles.actionText}>Analytics</ThemedText>
            </Pressable>

            <Pressable style={[styles.actionCard, { backgroundColor: theme.cardBackground }]}>
              <View style={[styles.actionIcon, { backgroundColor: `${theme.success}15` }]}>
                <Feather name="calendar" size={24} color={theme.success} />
              </View>
              <ThemedText style={styles.actionText}>Schedule</ThemedText>
            </Pressable>

            <Pressable style={[styles.actionCard, { backgroundColor: theme.cardBackground }]}>
              <View style={[styles.actionIcon, { backgroundColor: `${theme.warning}15` }]}>
                <Feather name="alert-triangle" size={24} color={theme.warning} />
              </View>
              <ThemedText style={styles.actionText}>Alerts</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>Recent Activity</ThemedText>
          <View style={[styles.activityCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.activityItem}>
              <Feather name="check-circle" size={20} color={theme.success} />
              <View style={styles.activityContent}>
                <ThemedText style={styles.activityTitle}>Irrigation completed</ThemedText>
                <ThemedText style={[styles.activityTime, { color: theme.textSecondary }]}>
                  2 hours ago
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <Feather name="alert-triangle" size={20} color={theme.warning} />
              <View style={styles.activityContent}>
                <ThemedText style={styles.activityTitle}>Low moisture detected</ThemedText>
                <ThemedText style={[styles.activityTime, { color: theme.textSecondary }]}>
                  5 hours ago
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <Feather name="droplet" size={20} color={theme.accent} />
              <View style={styles.activityContent}>
                <ThemedText style={styles.activityTitle}>Water level normal</ThemedText>
                <ThemedText style={[styles.activityTime, { color: theme.textSecondary }]}>
                  1 day ago
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  greeting: {
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: 14,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 14,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    width: '48%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    aspectRatio: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  activityCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
});
