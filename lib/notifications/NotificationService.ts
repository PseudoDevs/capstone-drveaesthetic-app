import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export interface NotificationData {
  type?: string;
  message_type?: string;
  conversation_id?: string;
  chat_id?: string;
  sender?: string;
  [key: string]: any;
}

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private unreadCount: number = 0;
  private notificationListeners: ((data: NotificationData) => void)[] = [];
  private pushToken: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async showChatNotification(senderName: string, message: string, conversationId?: string): Promise<void> {
    try {
      const notificationData: NotificationData = {
        type: 'chat',
        message_type: 'chat',
        conversation_id: conversationId,
        chat_id: conversationId,
        sender: senderName,
      };

      // Schedule a local push notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `💬 ${senderName}`,
          body: message,
          data: notificationData,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });

      console.log('🔔 Chat notification scheduled:', {
        sender: senderName,
        message,
        conversationId
      });
    } catch (error) {
      console.error('Error showing chat notification:', error);
      // Fallback to Alert if push notification fails
      Alert.alert(
        `💬 New Message from ${senderName}`,
        message,
        [
          { text: 'Close', style: 'cancel' },
          {
            text: 'Open Chat',
            onPress: () => {
              this.triggerNotificationResponse({
                type: 'chat',
                message_type: 'chat',
                conversation_id: conversationId,
                chat_id: conversationId,
                sender: senderName,
              });
            }
          }
        ]
      );
    }
  }

  async showAppointmentNotification(title: string, message: string, appointmentData: NotificationData): Promise<void> {
    try {
      const notificationData: NotificationData = {
        ...appointmentData,
        type: 'appointment',
        timestamp: Date.now()
      };

      // Schedule a local push notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          data: notificationData,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });

      console.log('🔔 Appointment notification scheduled:', {
        title,
        message,
        data: notificationData
      });
    } catch (error) {
      console.error('Error showing appointment notification:', error);
      // Fallback to Alert if push notification fails
      Alert.alert(
        title,
        message,
        [
          { text: 'Close', style: 'cancel' },
          {
            text: 'View Appointments',
            onPress: () => {
              this.triggerNotificationResponse({
                type: 'appointment',
                ...appointmentData
              });
            }
          }
        ]
      );
    }
  }

  async showNotification(title: string, body: string, data: NotificationData = {}): Promise<void> {
    try {
      const notificationData: NotificationData = {
        ...data,
        timestamp: Date.now()
      };

      // Schedule a local push notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: notificationData,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });

      console.log('🔔 Notification scheduled:', { title, body, data: notificationData });
    } catch (error) {
      console.error('Error showing notification:', error);
      // Fallback to Alert if push notification fails
      Alert.alert(
        title,
        body,
        [
          { text: 'Close', style: 'cancel' },
          {
            text: 'Open',
            onPress: () => {
              this.triggerNotificationResponse(data);
            }
          }
        ]
      );
    }
  }

  setupNotificationResponseListener(onResponse: (data: NotificationData) => void): () => void {
    this.notificationListeners.push(onResponse);

    return () => {
      const index = this.notificationListeners.indexOf(onResponse);
      if (index > -1) {
        this.notificationListeners.splice(index, 1);
      }
    };
  }

  private triggerNotificationResponse(data: NotificationData): void {
    // Add a small delay to ensure navigation context is ready
    setTimeout(() => {
      this.notificationListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in notification listener (will retry in 500ms):', error);
          // Retry once after a longer delay
          setTimeout(() => {
            try {
              listener(data);
            } catch (retryError) {
              console.error('Notification listener failed on retry:', retryError);
            }
          }, 500);
        }
      });
    }, 100);
  }

  setUnreadCount(count: number): void {
    this.unreadCount = count;
    console.log(`📱 Unread count updated to: ${count}`);
  }

  getUnreadCount(): number {
    return this.unreadCount;
  }

  clearUnreadCount(): void {
    this.unreadCount = 0;
    console.log('📱 Unread count cleared');
  }

  async showTestNotification(): Promise<void> {
    await this.showNotification(
      'Test Notification',
      'This is a test notification from Dr. Ve Aesthetic App!',
      { type: 'test' }
    );
  }

  // Request notification permissions and get push token
  async requestPermissionsAndGetToken(): Promise<string | null> {
    try {
      // Check and request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Notification permission not granted');
        return null;
      }

      // Get push token (for Expo Push Notifications)
      // If you want to use Firebase/APNs directly, you'll need different configuration
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '0ef114e3-7926-46d0-8936-d0b84c90612f',
      });

      this.pushToken = tokenData.data;
      console.log('📱 Push notification token:', this.pushToken);

      // Set notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('chat-messages', {
          name: 'Chat Messages',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
      }

      return this.pushToken;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return null;
    }
  }

  getPushToken(): string | null {
    return this.pushToken;
  }

  // Setup notification received listener
  setupNotificationReceivedListener(
    onReceived: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(onReceived);
  }

  // Setup notification response (tap) listener
  setupNotificationResponseReceivedListener(
    onResponse: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(onResponse);
  }
}

export default NotificationService.getInstance();