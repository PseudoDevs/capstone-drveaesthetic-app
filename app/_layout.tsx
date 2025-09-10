import '~/global.css';

import { DarkTheme, DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform } from 'react-native';
import { NAV_THEME } from '~/lib/constants';
import { PortalHost } from '@rn-primitives/portal';
import { AuthStorage, AuthService } from '~/lib/api';

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      document.documentElement.classList.add('bg-background');
    }
    
    // Initialize auth
    const initializeAuth = async () => {
      try {
        // Initialize auth token from storage
        const token = await AuthStorage.getToken();
        if (token) {
          AuthService.setToken(token);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      }
    };
    
    initializeAuth();
  }, []);

  return (
    <ThemeProvider value={LIGHT_THEME}>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen
          name='index'
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name='login'
          options={{
            title: 'Sign In',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name='signup'
          options={{
            title: 'Sign Up',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name='home'
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name='about'
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name='profile'
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name='services'
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name='appointments'
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name='chat'
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name='chat/[id]'
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <PortalHost />
    </ThemeProvider>
  );
}

