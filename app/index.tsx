import * as React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { Text } from '~/components/ui/text';
import { useAuth } from '~/lib/context/AuthContext';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();

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