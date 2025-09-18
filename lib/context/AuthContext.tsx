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
  updateUser: (userData: User) => Promise<void>;
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

      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        // Save user data to storage for persistence
        await AuthStorage.saveUser(currentUser);
        console.log('User logged in successfully:', currentUser.name);
      } else {
        throw new Error('Failed to get user data after login');
      }
    } catch (error) {
      console.error('Failed to login:', error);
      // Clean up on login failure
      await AuthStorage.removeToken();
      AuthService.clearToken();
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local data regardless of API response
      await AuthStorage.clearAll();
      AuthService.clearToken();
      setUser(null);
      setIsAuthenticated(false);
      setUnreadCount(0);
      console.log('User logged out successfully');
    }
  };

  const refreshUser = async () => {
    try {
      if (isAuthenticated) {
        const token = await AuthStorage.getToken();
        if (!token) {
          console.warn('No token found during refresh, logging out');
          await logout();
          return;
        }

        AuthService.setToken(token);
        const currentUser = await AuthService.getCurrentUser();

        if (currentUser) {
          setUser(currentUser);
          // Update stored user data to keep it fresh
          await AuthStorage.saveUser(currentUser);
          console.log('User data refreshed successfully');
        } else {
          console.warn('No user data received during refresh');
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);

      // Only logout on 401 errors (invalid token), not on other errors
      if (error && typeof error === 'object' && 'response' in error) {
        const response = error.response as any;
        if (response?.status === 401) {
          console.warn('Token invalid during refresh, logging out');
          await logout();
        } else {
          // For other errors, try to use cached user data
          console.warn('API error during refresh, using cached data:', response?.status);
          try {
            const cachedUser = await AuthStorage.getUser();
            if (cachedUser && !user) {
              setUser(cachedUser);
              console.log('Using cached user data during API error');
            }
          } catch (storageError) {
            console.error('Failed to get cached user data:', storageError);
          }
        }
      }
    }
  };

  const updateUser = async (userData: User) => {
    try {
      setUser(userData);
      await AuthStorage.saveUser(userData);
      console.log('User data updated in auth context:', userData.name);
    } catch (error) {
      console.error('Failed to update user data:', error);
      throw error;
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

          try {
            // First try to get cached user data
            const cachedUser = await AuthStorage.getUser();

            if (cachedUser) {
              setUser(cachedUser);
              setIsAuthenticated(true);
              console.log('Authentication restored with cached data for user:', cachedUser.name);

              // Try to refresh user data in background, but don't fail if it doesn't work
              try {
                const currentUser = await AuthService.getCurrentUser();
                if (currentUser) {
                  setUser(currentUser);
                  await AuthStorage.saveUser(currentUser);
                  console.log('User data refreshed during auth check');
                }
              } catch (refreshError) {
                console.warn('Failed to refresh user data during auth check, using cached data:', refreshError);
              }
            } else {
              // No cached user, try to get from API
              const currentUser = await AuthService.getCurrentUser();
              if (currentUser) {
                setUser(currentUser);
                setIsAuthenticated(true);
                await AuthStorage.saveUser(currentUser);
                console.log('Authentication restored for user:', currentUser.name);
              } else {
                throw new Error('No user data available');
              }
            }
          } catch (apiError) {
            console.error('Failed to verify token during auth check:', apiError);
            // Token is invalid, clear it
            await AuthStorage.clearAll();
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
    updateUser,
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