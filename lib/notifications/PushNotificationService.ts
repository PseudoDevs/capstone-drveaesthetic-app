import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class PushNotificationService {
  private static expoPushToken: string | null = null;

  /**
   * Register for push notifications
   */
  static async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

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

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      this.expoPushToken = token.data;
      console.log('Expo push token:', this.expoPushToken);
      
      return this.expoPushToken;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Get the current push token
   */
  static getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Schedule a local notification
   */
  static async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: trigger || null,
    });
  }

  /**
   * Schedule appointment reminder
   */
  static async scheduleAppointmentReminder(
    appointmentId: string,
    appointmentDate: string,
    appointmentTime: string,
    serviceName: string
  ): Promise<void> {
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const reminderTime = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours before

    if (reminderTime > new Date()) {
      await this.scheduleLocalNotification(
        'Appointment Reminder',
        `You have an appointment for ${serviceName} tomorrow at ${appointmentTime}`,
        {
          appointmentId,
          type: 'appointment_reminder',
        },
        {
          date: reminderTime,
        }
      );
    }

    // Also schedule a reminder 1 hour before
    const oneHourBefore = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);
    if (oneHourBefore > new Date()) {
      await this.scheduleLocalNotification(
        'Appointment Reminder',
        `Your appointment for ${serviceName} is in 1 hour`,
        {
          appointmentId,
          type: 'appointment_reminder_1hour',
        },
        {
          date: oneHourBefore,
        }
      );
    }
  }

  /**
   * Schedule form completion reminder
   */
  static async scheduleFormReminder(
    appointmentId: string,
    formType: 'medical' | 'consent'
  ): Promise<void> {
    await this.scheduleLocalNotification(
      'Form Reminder',
      `Please complete your ${formType} form for your upcoming appointment`,
      {
        appointmentId,
        type: 'form_reminder',
        formType,
      },
      {
        seconds: 60 * 60 * 24, // 24 hours from now
      }
    );
  }

  /**
   * Cancel all notifications for an appointment
   */
  static async cancelAppointmentNotifications(appointmentId: string): Promise<void> {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.appointmentId === appointmentId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  /**
   * Cancel all notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get all scheduled notifications
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Handle notification received while app is in foreground
   */
  static addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Handle notification tapped
   */
  static addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  /**
   * Remove notification listener
   */
  static removeNotificationSubscription(subscription: Notifications.Subscription): void {
    Notifications.removeNotificationSubscription(subscription);
  }
}
