import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp,
  onSnapshot,
  getFirestore,
  Unsubscribe
} from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'alert' | 'warning' | 'info' | 'success' | 'irrigation' | 'weather' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  data?: {
    fieldId?: string;
    sensorId?: string;
    irrigationId?: string;
    weatherAlertId?: string;
    [key: string]: any;
  };
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  icon?: string;
}

export interface CreateNotificationDto {
  title: string;
  message: string;
  type: Notification['type'];
  priority?: Notification['priority'];
  data?: Notification['data'];
  expiresAt?: Date;
  actionUrl?: string;
  icon?: string;
}

// Request permissions for push notifications
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    // Get the token
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
    
    console.log('Push token:', token);
    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

// Setup notification handler
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// Get notifications for current user
export async function getNotifications(options: {
  limit?: number;
  unreadOnly?: boolean;
  types?: Notification['type'][];
  priority?: Notification['priority'][];
} = {}): Promise<Notification[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const notificationsRef = collection(db, 'notifications');
    let q = query(
      notificationsRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    if (options.unreadOnly) {
      q = query(q, where('read', '==', false));
    }

    if (options.types && options.types.length > 0) {
      q = query(q, where('type', 'in', options.types));
    }

    if (options.priority && options.priority.length > 0) {
      q = query(q, where('priority', 'in', options.priority));
    }

    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate(),
      } as Notification;
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

// Subscribe to real-time notifications
export function subscribeToNotifications(
  callback: (notifications: Notification[]) => void,
  options: {
    unreadOnly?: boolean;
    limit?: number;
  } = {}
): Unsubscribe {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('Cannot subscribe: User not authenticated');
      return () => {};
    }

    const notificationsRef = collection(db, 'notifications');
    let q = query(
      notificationsRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    if (options.unreadOnly) {
      q = query(q, where('read', '==', false));
    }

    if (options.limit) {
      q = query(q, limit(options.limit || 50));
    }

    return onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate(),
        } as Notification;
      });
      callback(notifications);
    });
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    return () => {};
  }
}

// Mark notification as read
export async function markAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Mark all notifications as read
export async function markAllAsRead(): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const notifications = await getNotifications({ unreadOnly: true });
    
    const batch = notifications.map(notification => 
      markAsRead(notification.id)
    );
    
    await Promise.all(batch);
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
}

// Delete notification
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notificationRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

// Delete all read notifications
export async function deleteAllRead(): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const notifications = await getNotifications();
    const readNotifications = notifications.filter(n => n.read);
    
    const batch = readNotifications.map(notification => 
      deleteNotification(notification.id)
    );
    
    await Promise.all(batch);
  } catch (error) {
    console.error('Error deleting all read:', error);
    throw error;
  }
}

// Create a notification (admin/system use)
export async function createNotification(dto: CreateNotificationDto): Promise<string> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const notificationsRef = collection(db, 'notifications');
    const docRef = await addDoc(notificationsRef, {
      userId: currentUser.uid,
      title: dto.title,
      message: dto.message,
      type: dto.type,
      priority: dto.priority || 'medium',
      read: false,
      data: dto.data || {},
      createdAt: Timestamp.now(),
      expiresAt: dto.expiresAt ? Timestamp.fromDate(dto.expiresAt) : null,
      actionUrl: dto.actionUrl,
      icon: dto.icon,
    });

    // Send push notification if available
    await sendPushNotification({
      title: dto.title,
      body: dto.message,
      data: dto.data,
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Send push notification
export async function sendPushNotification(payload: {
  title: string;
  body: string;
  data?: any;
}) {
  try {
    // In production, you would send this to your backend
    // which then sends to Expo Push Notification service
    console.log('Push notification payload:', payload);
    
    // For now, we'll use local notifications
    if (Platform.OS !== 'web') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

// Create system notifications
export async function createSystemNotifications() {
  const notifications: CreateNotificationDto[] = [
    {
      title: 'Welcome to AgriSense Pro!',
      message: 'Your agricultural management system is now active. Start monitoring your fields.',
      type: 'info',
      priority: 'low',
      icon: '🎉',
    },
    {
      title: 'Field Monitoring Active',
      message: 'All 4 fields are now being monitored for soil moisture and temperature.',
      type: 'success',
      priority: 'medium',
      icon: '🌱',
    },
    {
      title: 'Weather Alert: Rain Expected',
      message: 'Heavy rainfall forecasted for tomorrow. Consider adjusting irrigation schedule.',
      type: 'weather',
      priority: 'high',
      data: { weatherAlertId: 'rain-2024-01' },
      icon: '🌧️',
    },
    {
      title: 'Irrigation System Check',
      message: 'Scheduled maintenance recommended for irrigation system in 7 days.',
      type: 'irrigation',
      priority: 'medium',
      icon: '💧',
    },
  ];

  try {
    for (const notification of notifications) {
      await createNotification(notification);
    }
  } catch (error) {
    console.error('Error creating system notifications:', error);
  }
}

// Get notification statistics
export async function getNotificationStats(): Promise<{
  total: number;
  unread: number;
  byType: Record<Notification['type'], number>;
  byPriority: Record<Notification['priority'], number>;
}> {
  try {
    const notifications = await getNotifications();
    
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {} as Record<Notification['type'], number>,
      byPriority: {} as Record<Notification['priority'], number>,
    };

    // Count by type
    notifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return {
      total: 0,
      unread: 0,
      byType: {} as Record<Notification['type'], number>,
      byPriority: {} as Record<Notification['priority'], number>,
    };
  }
}