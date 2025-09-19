import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '~/lib/context/AuthContext';

interface SessionAwareRouterProps {
  children: React.ReactNode;
  navigationReady?: boolean;
}

/**
 * SessionAwareRouter automatically redirects users based on authentication status
 * and current route.
 */
export function SessionAwareRouter({ children }: SessionAwareRouterProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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