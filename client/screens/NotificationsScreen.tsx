import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AlertCard } from '@/components/AlertCard';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { 
  subscribeToAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  deleteAlert,
  createAlert,
  Alert as AlertType,
  initializeNotifications,
  getFCMToken,
  setupForegroundMessageHandler,
} from '@/services/notifications/firebaseNotifications';
import { Spacing, Colors, BorderRadius } from '@/constants/theme';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState<() => void>(() => () => {});

  const unreadCount = alerts.filter((a) => !a.read).length;

  // Initialize notifications on mount
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await initializeNotifications();
        const token = await getFCMToken();
        if (token) {
          console.log('FCM Token:', token);
          // Store token in user profile or send to your backend
        }
        setupForegroundMessageHandler();
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initNotifications();
  }, []);

  // Subscribe to real-time alerts
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribeAlerts = subscribeToAlerts(
      user.uid,
      (newAlerts) => {
        setAlerts(newAlerts);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error in alerts subscription:', error);
        setLoading(false);
        setRefreshing(false);
        Alert.alert('Connection Error', 'Failed to load notifications. Please check your connection.');
      }
    );

    setUnsubscribe(() => unsubscribeAlerts);

    return () => {
      unsubscribeAlerts();
    };
  }, [user?.uid]);

  // Refresh alerts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setRefreshing(true);
      // Subscription will automatically update
      return () => {};
    }, [])
  );

  const handleMarkAllRead = async () => {
    if (!user?.uid) return;

    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      await markAllAlertsAsRead(user.uid);
      
      // Update local state immediately for better UX
      setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read.');
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAlertAsRead(alertId);
      
      // Update local state immediately for better UX
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      ));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const handleDismiss = async (alertId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      await deleteAlert(alertId);
      
      // Update local state immediately for better UX
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to delete alert:', error);
      Alert.alert('Error', 'Failed to delete notification.');
    }
  };

  const handlePress = (alert: AlertType) => {
    // Mark as read when pressed
    handleMarkAsRead(alert.id);
    
    // Handle alert-specific actions
    if (alert.actionUrl) {
      if (Platform.OS === 'web') {
        window.open(alert.actionUrl, '_blank');
      } else {
        // Handle deep linking in React Native
        console.log('Navigate to:', alert.actionUrl);
      }
    }
    
    // Show alert details if no action URL
    if (!alert.actionUrl && alert.data) {
      Alert.alert(
        alert.title,
        `${alert.message}\n\nAdditional details: ${JSON.stringify(alert.data, null, 2)}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Subscription will automatically update
  };

  const handleTestNotification = async () => {
    if (!user?.uid) return;

    try {
      const alertData: Omit<AlertType, 'id' | 'createdAt' | 'read'> = {
        userId: user.uid,
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working correctly.',
        type: 'info',
        category: 'system',
        priority: 'low',
        data: {
          test: true,
          timestamp: new Date().toISOString(),
        },
      };

      await createAlert(alertData);
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      console.error('Failed to create test notification:', error);
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  const renderAlert = ({ item }: { item: AlertType }) => (
    <AlertCard
      alert={item}
      onPress={handlePress}
      onDismiss={handleDismiss}
      onMarkAsRead={handleMarkAsRead}
    />
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading notifications...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[
        styles.header,
        { backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border }
      ]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Feather name="bell" size={24} color={theme.primary} style={styles.headerIcon} />
            <View>
              <ThemedText type="h3">Notifications</ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            {__DEV__ && (
              <Pressable
                onPress={handleTestNotification}
                style={[styles.testButton, { backgroundColor: theme.backgroundSecondary }]}
              >
                <Feather name="plus" size={16} color={theme.text} />
              </Pressable>
            )}
            
            {unreadCount > 0 ? (
              <Pressable onPress={handleMarkAllRead}>
                <ThemedText
                  style={[
                    styles.markAllRead,
                    { color: isDark ? Colors.dark.primary : Colors.light.primary },
                  ]}
                >
                  Mark all read
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: theme.backgroundSecondary }]}>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: theme.primary }]}>
            {alerts.length}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Total
          </ThemedText>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: theme.warning }]}>
            {alerts.filter(a => a.type === 'warning' || a.type === 'critical').length}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Warnings
          </ThemedText>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: theme.success }]}>
            {alerts.filter(a => a.type === 'success').length}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Success
          </ThemedText>
        </View>
      </View>

      {/* Alerts List */}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather
              name="bell-off"
              size={64}
              color={theme.textSecondary}
              style={styles.emptyIcon}
            />
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              No notifications yet
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              You'll see important alerts about your fields, irrigation, weather, and system updates here.
            </ThemedText>
            <Pressable
              onPress={handleTestNotification}
              style={[styles.testEmptyButton, { borderColor: theme.border }]}
            >
              <Feather name="bell" size={16} color={theme.textSecondary} />
              <ThemedText style={[styles.testEmptyText, { color: theme.textSecondary }]}>
                Send test notification
              </ThemedText>
            </Pressable>
          </View>
        }
        ListHeaderComponent={
          alerts.length > 0 ? (
            <View style={styles.listHeader}>
              <ThemedText style={[styles.listHeaderText, { color: theme.textSecondary }]}>
                Recent notifications ({alerts.length})
              </ThemedText>
            </View>
          ) : null
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: 14,
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerIcon: {
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  testButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllRead: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  list: {
    paddingHorizontal: Spacing.lg,
  },
  listHeader: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    marginBottom: Spacing.md,
  },
  listHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  separator: {
    height: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing["5xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    marginBottom: Spacing.lg,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  testEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  testEmptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});