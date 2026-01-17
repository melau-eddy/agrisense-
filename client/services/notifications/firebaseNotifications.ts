import { Platform } from 'react-native';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  Timestamp, 
  serverTimestamp,
  writeBatch,
  getDocs,
  deleteDoc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db } from '@/config/firebase';
import Constants from 'expo-constants';

// Conditional import for expo-notifications (only works on mobile)
let expoNotifications: any = null;
if (Platform.OS !== 'web') {
  try {
    expoNotifications = require('expo-notifications');
  } catch (error) {
    console.log('expo-notifications not available on web');
  }
}

export type AlertType = 'info' | 'warning' | 'critical' | 'success' | 'system';

export interface Alert {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: AlertType;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
  category: 'irrigation' | 'soil' | 'weather' | 'system' | 'crop' | 'market' | 'security';
}

export interface NotificationPreferences {
  enabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  categories: {
    irrigation: boolean;
    soil: boolean;
    weather: boolean;
    system: boolean;
    crop: boolean;
    market: boolean;
    security: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
}

// Collections
const ALERTS_COLLECTION = 'alerts';
const NOTIFICATION_PREFS_COLLECTION = 'notification_preferences';

/**
 * Initialize push notifications
 */
export async function initializeNotifications(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      // Request permission for web
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    } else {
      // For mobile, use Expo Notifications if available
      if (expoNotifications) {
        const { status } = await expoNotifications.requestPermissionsAsync();
        return status === 'granted';
      }
      return false;
    }
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
    return false;
  }
}

/**
 * Get FCM token for push notifications
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const auth = getAuth();
    if (!auth.currentUser) return null;

    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const messaging = getMessaging();
          const token = await getToken(messaging, {
            vapidKey: Constants.expoConfig?.extra?.firebaseVapidKey || 'YOUR_VAPID_KEY_HERE',
          });
          return token;
        } catch (error) {
          console.log('FCM not initialized for web, using fallback');
          return 'web-token-fallback';
        }
      }
      return null;
    }
    
    // For React Native, you would use @react-native-firebase/messaging
    return 'mobile-token-fallback';
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
}

/**
 * Subscribe to real-time alerts
 */
export function subscribeToAlerts(
  userId: string,
  callback: (alerts: Alert[]) => void,
  errorCallback?: (error: Error) => void
): () => void {
  try {
    const alertsRef = collection(db, ALERTS_COLLECTION);
    
    // Create query for non-expired alerts
    const now = new Date();
    const q = query(
      alertsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
      // Note: Firestore doesn't allow multiple inequality filters on different fields
      // We'll filter expired alerts client-side
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const alerts: Alert[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const expiresAt = data.expiresAt?.toDate();
          const createdAt = data.createdAt?.toDate() || new Date();
          
          // Filter expired alerts client-side
          if (expiresAt && expiresAt < now) {
            return;
          }
          
          alerts.push({
            id: doc.id,
            userId: data.userId,
            title: data.title,
            message: data.message,
            type: data.type,
            data: data.data || {},
            read: data.read || false,
            createdAt,
            expiresAt,
            actionUrl: data.actionUrl,
            priority: data.priority || 'medium',
            category: data.category || 'system',
          });
        });
        callback(alerts);
      },
      (error) => {
        console.error('Error subscribing to alerts:', error);
        errorCallback?.(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to alerts:', error);
    errorCallback?.(error as Error);
    return () => {};
  }
}

/**
 * Create a new alert
 */
export async function createAlert(alertData: Omit<Alert, 'id' | 'createdAt' | 'read'>): Promise<string> {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to create alerts');
    }

    const alertToCreate = {
      ...alertData,
      userId: auth.currentUser.uid,
      read: false,
      createdAt: serverTimestamp(),
      expiresAt: alertData.expiresAt ? Timestamp.fromDate(alertData.expiresAt) : null,
    };

    const docRef = await addDoc(collection(db, ALERTS_COLLECTION), alertToCreate);
    
    // Trigger push notification if enabled
    await triggerPushNotification({
      ...alertData,
      id: docRef.id,
      read: false,
      createdAt: new Date(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Failed to create alert:', error);
    throw error;
  }
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: string): Promise<void> {
  try {
    const alertRef = doc(db, ALERTS_COLLECTION, alertId);
    await updateDoc(alertRef, { read: true });
  } catch (error) {
    console.error('Failed to mark alert as read:', error);
    throw error;
  }
}

/**
 * Mark all alerts as read
 */
export async function markAllAlertsAsRead(userId: string): Promise<void> {
  try {
    const alertsRef = collection(db, ALERTS_COLLECTION);
    const q = query(alertsRef, where('userId', '==', userId), where('read', '==', false));
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Failed to mark all alerts as read:', error);
    throw error;
  }
}

/**
 * Delete an alert
 */
export async function deleteAlert(alertId: string): Promise<void> {
  try {
    const alertRef = doc(db, ALERTS_COLLECTION, alertId);
    await deleteDoc(alertRef);
  } catch (error) {
    console.error('Failed to delete alert:', error);
    throw error;
  }
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  try {
    const prefsRef = doc(db, NOTIFICATION_PREFS_COLLECTION, userId);
    const docSnap = await getDoc(prefsRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as NotificationPreferences;
    }
    
    // Return default preferences
    return {
      enabled: true,
      emailNotifications: false,
      pushNotifications: true,
      categories: {
        irrigation: true,
        soil: true,
        weather: true,
        system: true,
        crop: true,
        market: false,
        security: true,
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '06:00',
      },
    };
  } catch (error) {
    console.error('Failed to get notification preferences:', error);
    throw error;
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string, 
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  try {
    const prefsRef = doc(db, NOTIFICATION_PREFS_COLLECTION, userId);
    await setDoc(prefsRef, preferences, { merge: true });
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    throw error;
  }
}

/**
 * Create system alerts (for automated notifications)
 */
export async function createSystemAlert(
  title: string,
  message: string,
  type: AlertType,
  category: Alert['category'],
  priority: Alert['priority'] = 'medium',
  data?: Record<string, any>,
  expiresInHours: number = 24
): Promise<void> {
  try {
    // Get all users (in production, you might want to target specific users)
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const alerts: Omit<Alert, 'id' | 'createdAt' | 'read'>[] = [];
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);
    
    usersSnapshot.forEach((userDoc) => {
      alerts.push({
        userId: userDoc.id,
        title,
        message,
        type,
        category,
        priority,
        data,
        expiresAt,
      });
    });
    
    // Batch create alerts
    const batch = writeBatch(db);
    alerts.forEach((alert) => {
      const alertRef = doc(collection(db, ALERTS_COLLECTION));
      batch.set(alertRef, {
        ...alert,
        read: false,
        createdAt: serverTimestamp(),
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Failed to create system alert:', error);
    throw error;
  }
}

/**
 * Check for quiet hours
 */
function isQuietHours(quietHours?: { enabled: boolean; start: string; end: string }): boolean {
  if (!quietHours?.enabled) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  const [startHour, startMinute] = quietHours.start.split(':').map(Number);
  const [endHour, endMinute] = quietHours.end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  
  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    return currentTime >= startTime || currentTime < endTime;
  }
}

/**
 * Trigger push notification
 */
async function triggerPushNotification(alertData: Alert): Promise<void> {
  try {
    // Get user preferences
    const preferences = await getNotificationPreferences(alertData.userId);
    
    if (!preferences.enabled || !preferences.pushNotifications) return;
    if (!preferences.categories[alertData.category]) return;
    if (isQuietHours(preferences.quietHours)) return;
    
    if (Platform.OS === 'web' && 'Notification' in window) {
      // Web push notifications
      if (Notification.permission === 'granted') {
        const notification = new Notification(alertData.title, {
          body: alertData.message,
          icon: '/icon.png',
          badge: '/icon.png',
          tag: alertData.id,
          renotify: true,
          silent: alertData.priority === 'low',
          data: alertData.data,
        });
        
        notification.onclick = () => {
          if (alertData.actionUrl) {
            window.open(alertData.actionUrl, '_blank');
          }
          notification.close();
        };
        
        // Auto close after 10 seconds
        setTimeout(() => notification.close(), 10000);
      }
    } else if (Platform.OS !== 'web' && expoNotifications) {
      // React Native push notifications using expo-notifications
      await expoNotifications.scheduleNotificationAsync({
        content: {
          title: alertData.title,
          body: alertData.message,
          data: alertData.data,
          sound: true,
          priority: alertData.priority === 'high' ? 'max' : 'default',
        },
        trigger: null, // Send immediately
      });
    }
  } catch (error) {
    console.error('Failed to trigger push notification:', error);
  }
}

/**
 * Set up foreground message handler (for web)
 */
export function setupForegroundMessageHandler(): void {
  if (Platform.OS === 'web') {
    try {
      const messaging = getMessaging();
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        
        // Display in-app notification
        if (payload.notification) {
          const notification = new Notification(payload.notification.title || 'New Alert', {
            body: payload.notification.body,
            icon: '/icon.png',
            data: payload.data,
          });
          
          notification.onclick = () => {
            if (payload.data?.actionUrl) {
              window.open(payload.data.actionUrl, '_blank');
            }
            notification.close();
          };
        }
      });
    } catch (error) {
      console.log('Foreground messaging not available:', error);
    }
  }
}

/**
 * Utility function to create sample alerts for testing
 */
export async function createSampleAlerts(userId: string): Promise<void> {
  const sampleAlerts: Omit<Alert, 'id' | 'createdAt' | 'read'>[] = [
    {
      userId,
      title: '🚨 Critical: Low Soil Moisture',
      message: 'Field "North Field" has moisture level at 28%, which is below the optimal threshold of 40%.',
      type: 'critical',
      category: 'irrigation',
      priority: 'high',
      data: {
        fieldName: 'North Field',
        moistureLevel: 28,
        threshold: 40,
        action: 'schedule_irrigation',
      },
      actionUrl: '/control',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    {
      userId,
      title: '🌤️ Weather Update',
      message: 'Rain expected tomorrow with 80% chance. Consider delaying irrigation.',
      type: 'warning',
      category: 'weather',
      priority: 'medium',
      data: {
        condition: 'rain',
        rainChance: 80,
        recommendation: 'delay_irrigation',
      },
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    },
    {
      userId,
      title: '✅ Irrigation Complete',
      message: 'South Field irrigation finished successfully. 4,500L delivered over 45 minutes.',
      type: 'success',
      category: 'irrigation',
      priority: 'low',
      data: {
        fieldName: 'South Field',
        volume: 4500,
        duration: 45,
      },
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    },
    {
      userId,
      title: '📈 Market Update: Corn',
      message: 'Corn prices up by 8%. Consider selling some of your harvest.',
      type: 'info',
      category: 'market',
      priority: 'low',
      data: {
        cropType: 'corn',
        priceChange: 8,
        trend: 'up',
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  ];

  for (const alert of sampleAlerts) {
    await createAlert(alert);
  }
}