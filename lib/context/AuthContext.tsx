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
      } else {
        throw new Error('Failed to get user data after login');
      }
    } catch (error) {
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
      // Silent error handling for logout API call
    } finally {
      // Always clear local data regardless of API response
      await AuthStorage.clearAll();
      AuthService.clearToken();
      setUser(null);
      setIsAuthenticated(false);
      setUnreadCount(0);
    }
  };

  const refreshUser = async () => {
    try {
      if (isAuthenticated) {
        const token = await AuthStorage.getToken();
        if (!token) {
          await logout();
          return;
        }

        AuthService.setToken(token);
        const currentUser = await AuthService.getCurrentUser();

        if (currentUser) {
          // Update user data from API (placeholder detection removed)
          setUser(currentUser);
          // Update stored user data to keep it fresh
          await AuthStorage.saveUser(currentUser);
        } else {
          // Don't clear user data if API doesn't return user data
        }
      }
    } catch (error) {
      // Only logout on 401 errors (invalid token), not on other errors
      if (error && typeof error === 'object' && 'response' in error) {
        const response = error.response as any;
        if (response?.status === 401) {
          await logout();
        } else {
          // For other errors (network, 500, etc.), preserve session and use cached data
          try {
            const cachedUser = await AuthStorage.getUser();
            if (cachedUser && !user) {
              setUser(cachedUser);
            }
          } catch (storageError) {
            // Silent error handling
          }
        }
      } else {
        // For network errors or other non-HTTP errors, preserve session
        try {
          const cachedUser = await AuthStorage.getUser();
          if (cachedUser && !user) {
            setUser(cachedUser);
          }
        } catch (storageError) {
          // Silent error handling
        }
      }
    }
  };

  const updateUser = async (userData: User) => {
    try {
      // Check for placeholder data (just log, don't block updates)
      const isPlaceholderData = AuthService.isPlaceholderData(userData);

      if (isPlaceholderData) {
        // Continue with update - don't block
      }

      setUser(userData);
      await AuthStorage.saveUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const updateUnreadCount = (count: number) => {
    setUnreadCount(count);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // STEP 1: Check local storage for existing session
        const [token, cachedUser] = await Promise.all([
          AuthStorage.getToken(),
          AuthStorage.getUser()
        ]);

        // STEP 2: No token or user data = No session, auto logout
        if (!token || !cachedUser) {
          console.log('No session data found - auto logout:', { hasToken: !!token, hasUser: !!cachedUser });
          await AuthStorage.clearAll();
          AuthService.clearToken();
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // STEP 3: Token exists, validate cached user data
        if (cachedUser) {
          // Check if cached user is placeholder data
          const isPlaceholderCached = AuthService.isPlaceholderData(cachedUser);

          if (isPlaceholderCached) {
            // Clear placeholder data and force fresh login
            await AuthStorage.clearAll();
            AuthService.clearToken();
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
            return;
          }

          // Cached user data is valid, restore session immediately
          AuthService.setToken(token);
          setUser(cachedUser);
          setIsAuthenticated(true);
          setIsLoading(false);

          // STEP 4: Background refresh of user data (optional, non-blocking)
          setTimeout(async () => {
            try {
              const freshUser = await AuthService.getCurrentUser();
              if (freshUser && !AuthService.isPlaceholderData(freshUser)) {
                setUser(freshUser);
                await AuthStorage.saveUser(freshUser);
              } else {
                // Keep cached user
              }
            } catch (refreshError) {
              // Keep cached user
            }
          }, 1000); // 1 second delay for background refresh

          return;
        }

        // STEP 5: Token exists but no cached user - verify token validity
        AuthService.setToken(token);

        try {
          const currentUser = await AuthService.getCurrentUser();

          if (!currentUser) {
            throw new Error('No user data received from API');
          }

          if (AuthService.isPlaceholderData(currentUser)) {
            // Clear placeholder data and force fresh login
            await AuthStorage.clearAll();
            AuthService.clearToken();
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
            return;
          }

          // Token is valid and user data is real
          setUser(currentUser);
          setIsAuthenticated(true);
          await AuthStorage.saveUser(currentUser);

        } catch (apiError) {
          // Token is invalid or API returned bad data
          await AuthStorage.clearAll();
          AuthService.clearToken();
          setIsAuthenticated(false);
          setUser(null);
        }

      } catch (error) {
        // Something went wrong, clear everything
        await AuthStorage.clearAll();
        AuthService.clearToken();
        setIsAuthenticated(false);
        setUser(null);
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