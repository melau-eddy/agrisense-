import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from './AuthContext';
import {
  Alert,
  subscribeToAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  deleteAlert,
  createAlert,
  getNotificationPreferences,
  updateNotificationPreferences,
  NotificationPreferences,
  initializeNotifications,
  getFCMToken,
  setupForegroundMessageHandler,
  createSampleAlerts,
} from '@/services/notifications/firebaseNotifications';

interface NotificationsContextType {
  alerts: Alert[];
  unreadCount: number;
  loading: boolean;
  preferences: NotificationPreferences | null;
  markAsRead: (alertId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  createNewAlert: (alertData: Omit<Alert, 'id' | 'createdAt' | 'read'>) => Promise<string>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  refreshAlerts: () => void;
  sendTestNotification: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<() => void>(() => () => {});

  const unreadCount = alerts.filter(alert => !alert.read).length;

  // Initialize notifications on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initializeNotifications();
        const token = await getFCMToken();
        if (token) {
          console.log('Notifications initialized with token:', token);
        }
        setupForegroundMessageHandler();
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    init();
  }, []);

  // Load notification preferences
  useEffect(() => {
    if (!user?.uid) return;

    const loadPreferences = async () => {
      try {
        const prefs = await getNotificationPreferences(user.uid);
        setPreferences(prefs);
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      }
    };

    loadPreferences();
  }, [user?.uid]);

  // Subscribe to real-time alerts
  useEffect(() => {
    if (!user?.uid) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribeAlerts = subscribeToAlerts(
      user.uid,
      (newAlerts) => {
        setAlerts(newAlerts);
        setLoading(false);
      },
      (error) => {
        console.error('Error in alerts subscription:', error);
        setLoading(false);
      }
    );

    setUnsubscribe(() => unsubscribeAlerts);

    return () => {
      unsubscribeAlerts();
    };
  }, [user?.uid]);

  // Refresh alerts when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Force refresh by re-subscribing
        if (unsubscribe) {
          unsubscribe();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [unsubscribe]);

  const markAsRead = async (alertId: string) => {
    try {
      await markAlertAsRead(alertId);
      // Optimistic update
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, read: true } : alert
      ));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    if (!user?.uid) return;

    try {
      await markAllAlertsAsRead(user.uid);
      // Optimistic update
      setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
    } catch (error) {
      console.error('Failed to mark all alerts as read:', error);
      throw error;
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      await deleteAlert(alertId);
      // Optimistic update
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
      throw error;
    }
  };

  const createNewAlert = async (alertData: Omit<Alert, 'id' | 'createdAt' | 'read'>): Promise<string> => {
    try {
      const alertId = await createAlert(alertData);
      return alertId;
    } catch (error) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user?.uid) return;

    try {
      await updateNotificationPreferences(user.uid, newPreferences);
      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  };

  const refreshAlerts = () => {
    // This will trigger the subscription to refresh
    setLoading(true);
  };

  const sendTestNotification = async () => {
    if (!user?.uid) return;

    try {
      // Create a test alert
      await createSampleAlerts(user.uid);
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  };

  const value: NotificationsContextType = {
    alerts,
    unreadCount,
    loading,
    preferences,
    markAsRead,
    markAllAsRead,
    dismissAlert,
    createNewAlert,
    updatePreferences,
    refreshAlerts,
    sendTestNotification,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}