import { Alert, Platform } from 'react-native';

export interface NotificationData {
  type?: string;
  message_type?: string;
  conversation_id?: string;
  chat_id?: string;
  sender?: string;
  [key: string]: any;
}

export class NotificationService {
  private static instance: NotificationService;
  private unreadCount: number = 0;
  private notificationListeners: ((data: NotificationData) => void)[] = [];

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

      // Show alert-based notification
      Alert.alert(
        `💬 New Message from ${senderName}`,
        message,
        [
          { text: 'Close', style: 'cancel' },
          {
            text: 'Open Chat',
            onPress: () => {
              this.triggerNotificationResponse(notificationData);
            }
          }
        ]
      );

      console.log('🔔 Chat notification shown:', {
        sender: senderName,
        message,
        conversationId
      });
    } catch (error) {
      console.error('Error showing chat notification:', error);
    }
  }

  async showNotification(title: string, body: string, data: NotificationData = {}): Promise<void> {
    try {
      const notificationData: NotificationData = {
        ...data,
        timestamp: Date.now()
      };

      Alert.alert(
        title,
        body,
        [
          { text: 'Close', style: 'cancel' },
          {
            text: 'Open',
            onPress: () => {
              this.triggerNotificationResponse(notificationData);
            }
          }
        ]
      );

      console.log('🔔 Notification shown:', { title, body, data: notificationData });
    } catch (error) {
      console.error('Error showing notification:', error);
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
}

export default NotificationService.getInstance();