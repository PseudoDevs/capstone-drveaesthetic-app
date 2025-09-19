import React, { useEffect, useRef, useState } from 'react';
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
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Check if navigation context is ready
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 50; // Max 5 seconds of retrying

    const checkNavigation = () => {
      try {
        // Try to access router to see if navigation context is ready
        if (router && typeof router.push === 'function') {
          setIsNavigationReady(true);
          return;
        }
      } catch (error) {
      }

      // Retry with exponential backoff up to max retries
      retryCount++;
      if (retryCount < maxRetries) {
        const delay = Math.min(100 * retryCount, 1000); // Max 1 second delay
        setTimeout(checkNavigation, delay);
      } else {
      }
    };

    checkNavigation();
  }, [router]);

  // Safe navigation function that handles navigation context errors
  const safeNavigate = (path: string) => {
    if (!isNavigationReady) {
      // Retry navigation after a delay
      setTimeout(() => {
        if (isNavigationReady) {
          try {
            router.push(path as any);
          } catch (error) {
          }
        }
      }, 1000);
      return;
    }

    try {
      router.push(path as any);
    } catch (error) {
      // Retry once after a short delay
      setTimeout(() => {
        try {
          router.push(path as any);
        } catch (retryError) {
        }
      }, 500);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let notificationResponseUnsubscribe: (() => void) | null = null;

    const setupNotifications = async () => {
      try {
        // Setup notification response listener (when user taps notification)
        notificationResponseUnsubscribe = notificationService.setupNotificationResponseListener((data) => {

          // Navigate based on notification type
          if (data?.type === 'chat' || data?.message_type === 'chat') {
            const conversationId = data?.conversation_id || data?.chat_id;
            if (conversationId) {
              safeNavigate(`/chat/${conversationId}`);
            } else {
              safeNavigate('/chat');
            }
          } else if (data?.type === 'appointment') {
            safeNavigate('/appointments');
          } else {
            // Default navigation for unknown types
            safeNavigate('/home');
          }
        });

        // Initial unread count fetch
        try {
          const unreadCount = await AuthService.getUnreadMessageCount();
          onUnreadCountUpdate?.(unreadCount);
          notificationService.setUnreadCount(unreadCount);
        } catch (error) {
          // Set a default unread count of 0 for development
          onUnreadCountUpdate?.(0);
        }

        // Start chat polling service for AJAX-based notifications
        try {
          const userData = await AuthService.getCurrentUser();
          if (userData?.id) {
            chatPollingService.startPolling(userData.id, onUnreadCountUpdate);
          }
        } catch (error) {
        }

      } catch (error) {
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