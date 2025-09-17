import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { NotificationService } from '~/lib/notifications/NotificationService';
import { AuthService } from '~/lib/api/auth';
import ChatPollingServiceInstance from '~/lib/services/ChatPollingService';

interface NotificationHandlerProps {
  isAuthenticated: boolean;
  onUnreadCountUpdate?: (count: number) => void;
}

export function NotificationHandler({ isAuthenticated, onUnreadCountUpdate }: NotificationHandlerProps) {
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const notificationService = NotificationService.getInstance();
  const chatPollingService = ChatPollingServiceInstance;

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let notificationResponseUnsubscribe: (() => void) | null = null;

    const setupNotifications = async () => {
      try {
        // Setup notification response listener (when user taps notification)
        notificationResponseUnsubscribe = notificationService.setupNotificationResponseListener((data) => {
          console.log('Notification tapped with data:', data);

          // Navigate based on notification type
          if (data?.type === 'chat' || data?.message_type === 'chat') {
            const conversationId = data?.conversation_id || data?.chat_id;
            if (conversationId) {
              router.push(`/chat/${conversationId}`);
            } else {
              router.push('/chat');
            }
          } else if (data?.type === 'appointment') {
            router.push('/appointments');
          } else {
            // Default navigation for unknown types
            router.push('/home');
          }
        });

        // Initial unread count fetch
        try {
          const unreadCount = await AuthService.getUnreadMessageCount();
          onUnreadCountUpdate?.(unreadCount);
          notificationService.setUnreadCount(unreadCount);
        } catch (error) {
          console.warn('Failed to fetch initial unread count (backend may be offline):', error);
          // Set a default unread count of 0 for development
          onUnreadCountUpdate?.(0);
        }

        // Start chat polling service for AJAX-based notifications
        try {
          const userData = await AuthService.getCurrentUser();
          if (userData?.id) {
            console.log('🔄 Starting chat polling service...');
            chatPollingService.startPolling(userData.id, onUnreadCountUpdate);
          }
        } catch (error) {
          console.warn('Failed to start chat polling service:', error);
        }

      } catch (error) {
        console.error('Failed to setup notifications:', error);
      }
    };

    setupNotifications();

    // Setup app state change listener for updating unread count
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground, refresh unread count
        try {
          const unreadCount = await AuthService.getUnreadMessageCount();
          onUnreadCountUpdate?.(unreadCount);
          notificationService.setUnreadCount(unreadCount);
        } catch (error) {
          console.warn('Failed to refresh unread count on app focus (backend may be offline):', error);
        }
      }
      appState.current = nextAppState;
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup function
    return () => {
      notificationResponseUnsubscribe?.();
      appStateSubscription?.remove();

      // Stop chat polling when component unmounts
      chatPollingService.stopPolling();
    };

  }, [isAuthenticated, onUnreadCountUpdate, router]);

  // Cleanup on logout
  useEffect(() => {
    if (!isAuthenticated) {
      // Stop chat polling
      chatPollingService.stopPolling();

      // Clear unread count
      notificationService.clearUnreadCount();
    }
  }, [isAuthenticated]);

  // This component doesn't render anything
  return null;
}

export default NotificationHandler;