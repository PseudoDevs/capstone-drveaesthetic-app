import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthStorage, AuthService } from '~/lib/api';
import { User } from '~/lib/api/types';
import { NotificationHandler } from '~/components/NotificationHandler';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  unreadCount: number;
  login: (token: string, user?: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUnreadCount: (count: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const login = async (token: string, userData?: User) => {
    try {
      await AuthStorage.saveToken(token);
      AuthService.setToken(token);

      // Get user data if not provided
      const currentUser = userData || await AuthService.getCurrentUser();

      setUser(currentUser);
      setIsAuthenticated(true);

      console.log('User logged in successfully');
    } catch (error) {
      console.error('Failed to login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      await AuthStorage.removeToken();

      setUser(null);
      setIsAuthenticated(false);
      setUnreadCount(0);

      console.log('User logged out successfully');
    } catch (error) {
      console.error('Failed to logout:', error);

      // Force logout even if API call fails
      await AuthStorage.removeToken();
      AuthService.clearToken();
      setUser(null);
      setIsAuthenticated(false);
      setUnreadCount(0);
    }
  };

  const refreshUser = async () => {
    try {
      if (isAuthenticated) {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If token is invalid, logout
      if (error && typeof error === 'object' && 'response' in error) {
        const response = error.response as any;
        if (response?.status === 401) {
          await logout();
        }
      }
    }
  };

  const updateUnreadCount = (count: number) => {
    setUnreadCount(count);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AuthStorage.getToken();

        console.log('=== AUTH CONTEXT INIT ===');
        console.log('Token found:', token ? 'Yes' : 'No');

        if (token) {
          AuthService.setToken(token);

          // Verify token is still valid by getting current user
          const currentUser = await AuthService.getCurrentUser();

          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
            console.log('Authentication restored for user:', currentUser.name);
          } else {
            // Token is invalid, clear it
            await AuthStorage.removeToken();
            AuthService.clearToken();
            setIsAuthenticated(false);
            console.log('Token invalid, cleared');
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Failed to check auth:', error);

        // Clear invalid token
        await AuthStorage.removeToken();
        AuthService.clearToken();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    unreadCount,
    login,
    logout,
    refreshUser,
    updateUnreadCount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <NotificationHandler
        isAuthenticated={isAuthenticated}
        onUnreadCountUpdate={updateUnreadCount}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}