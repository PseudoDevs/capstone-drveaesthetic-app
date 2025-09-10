import * as React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { AuthStorage, AuthService } from '~/lib/api';
import { Text } from '~/components/ui/text';

export default function IndexScreen() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AuthStorage.getToken();
        
        console.log('=== APP STARTUP TOKEN CHECK ===');
        console.log('Token found:', token ? 'Yes' : 'No');
        console.log('Token value:', token);
        console.log('===============================');
        
        if (token) {
          // Set token in API client for all future requests
          AuthService.setToken(token);
          console.log('Token set in API client globally');
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Failed to check auth:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-muted-foreground">Loading...</Text>
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/login" />;
}