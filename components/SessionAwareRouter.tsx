import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '~/lib/context/AuthContext';
import { NotificationService } from '~/lib/notifications/NotificationService';
import { AppointmentPollingService } from '~/lib/services/AppointmentPollingService';
import { ChatPollingService } from '~/lib/services/ChatPollingService';
import * as Notifications from 'expo-notifications';

interface SessionAwareRouterProps {
  children: React.ReactNode;
  navigationReady?: boolean;
}

/**
 * SessionAwareRouter automatically redirects users based on authentication status
 * and current route. It also initializes notification services.
 */
export function SessionAwareRouter({ children }: SessionAwareRouterProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize notification services when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const userId = user?.data?.id || user?.id;
    if (!userId) return;

    console.log('🔔 Initializing notification services for user:', userId);

    // Initialize notification service and request permissions
    const initializeNotifications = async () => {
      try {
        const notificationService = NotificationService.getInstance();
        await notificationService.requestPermissionsAndGetToken();

        // Setup notification response listener (when user taps on a notification)
        const responseSubscription = notificationService.setupNotificationResponseReceivedListener(
          (response) => {
            const data = response.notification.request.content.data;
            console.log('📱 Notification tapped:', data);

            // Handle appointment notifications
            if (data.type === 'appointment') {
              router.push('/appointments');
            }
            // Handle chat notifications
            else if (data.type === 'chat' && data.conversation_id) {
              router.push('/chat');
            }
          }
        );

        // Start appointment polling service
        const appointmentPollingService = AppointmentPollingService.getInstance();
        appointmentPollingService.startPolling(userId, (change) => {
          console.log('📅 Appointment status changed:', change);
          // Optional: You can add custom logic here when appointment status changes
        });

        // Start chat polling service
        const chatPollingService = ChatPollingService.getInstance();
        chatPollingService.startPolling(userId);

        console.log('✅ Notification services initialized successfully');

        // Cleanup function
        return () => {
          console.log('🧹 Cleaning up notification services');
          responseSubscription.remove();
          appointmentPollingService.stopPolling();
          chatPollingService.stopPolling();
        };
      } catch (error) {
        console.error('❌ Error initializing notification services:', error);
      }
    };

    const cleanup = initializeNotifications();

    return () => {
      cleanup.then((cleanupFn) => cleanupFn?.());
    };
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    // Don't redirect while still loading auth state
    if (isLoading) return;

    // Simple navigation logic without complex error handling
    const publicRoutes = ['/login', '/signup', '/'];
    const protectedRoutes = ['/home', '/profile', '/appointments', '/chat', '/services'];

    const isOnPublicRoute = publicRoutes.includes(pathname);
    const isOnProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    try {
      if (isAuthenticated && user) {
        // User is logged in
        if (isOnPublicRoute && pathname !== '/') {
          router.replace('/home');
        }
      } else {
        // User is not logged in
        if (isOnProtectedRoute || pathname === '/') {
          router.replace('/login');
        }
      }
    } catch (error) {
      // Simple error handling
      console.log('Navigation error (handled silently):', error);
    }

  }, [isAuthenticated, isLoading, user, pathname, router]);

  // Render children regardless of redirects (redirects happen in background)
  return <>{children}</>;
}