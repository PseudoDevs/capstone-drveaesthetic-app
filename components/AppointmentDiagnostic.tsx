import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { AppointmentService, AuthStorage } from '~/lib/api';
import { AppointmentPollingService } from '~/lib/services/AppointmentPollingService';
import { NotificationService } from '~/lib/notifications/NotificationService';
import * as Notifications from 'expo-notifications';

interface DiagnosticInfo {
  userId: number | null;
  isPolling: boolean;
  hasNotificationPermissions: boolean;
  appointmentsCount: number;
  lastPollTime: string;
  notificationToken: string | null;
}

export function AppointmentDiagnostic() {
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo>({
    userId: null,
    isPolling: false,
    hasNotificationPermissions: false,
    appointmentsCount: 0,
    lastPollTime: 'Never',
    notificationToken: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      // Get user ID
      const user = await AuthStorage.getUser();
      const userId = user?.id || null;

      // Check notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      const hasNotificationPermissions = status === 'granted';

      // Get notification token
      const notificationService = NotificationService.getInstance();
      const token = await notificationService.getPushToken();

      // Get appointments count
      let appointmentsCount = 0;
      if (userId) {
        try {
          const response = await AppointmentService.getClientAppointments(userId);
          appointmentsCount = response.data?.length || 0;
        } catch (error) {
          console.error('Error fetching appointments:', error);
        }
      }

      // Check polling service status
      const pollingService = AppointmentPollingService.getInstance();
      const isPolling = (pollingService as any).isPolling || false;

      setDiagnosticInfo({
        userId,
        isPolling,
        hasNotificationPermissions,
        appointmentsCount,
        lastPollTime: new Date().toLocaleTimeString(),
        notificationToken: token,
      });
    } catch (error) {
      console.error('Diagnostic error:', error);
      Alert.alert('Diagnostic Error', 'Failed to run diagnostics');
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = async () => {
    try {
      const notificationService = NotificationService.getInstance();
      await notificationService.showAppointmentNotification(
        'Test Notification',
        'This is a test appointment notification',
        { type: 'appointment', appointmentId: 999 }
      );
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        Alert.alert('Success', 'Notification permissions granted!');
        runDiagnostics();
      } else {
        Alert.alert('Permission Denied', 'Notification permissions were denied');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  const startPolling = async () => {
    if (!diagnosticInfo.userId) {
      Alert.alert('Error', 'No user ID found');
      return;
    }

    try {
      const pollingService = AppointmentPollingService.getInstance();
      pollingService.startPolling(diagnosticInfo.userId, (change) => {
        console.log('Status change detected:', change);
        Alert.alert('Status Change', `Appointment ${change.appointmentId} changed from ${change.oldStatus} to ${change.newStatus}`);
      });
      Alert.alert('Success', 'Polling service started!');
      runDiagnostics();
    } catch (error) {
      Alert.alert('Error', 'Failed to start polling service');
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <ScrollView className="flex-1 p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Appointment Diagnostic Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <View>
            <Text className="font-semibold">User ID:</Text>
            <Text className="text-gray-600">{diagnosticInfo.userId || 'Not found'}</Text>
          </View>

          <View>
            <Text className="font-semibold">Polling Service:</Text>
            <Text className={`${diagnosticInfo.isPolling ? 'text-green-600' : 'text-red-600'}`}>
              {diagnosticInfo.isPolling ? 'Running' : 'Not Running'}
            </Text>
          </View>

          <View>
            <Text className="font-semibold">Notification Permissions:</Text>
            <Text className={`${diagnosticInfo.hasNotificationPermissions ? 'text-green-600' : 'text-red-600'}`}>
              {diagnosticInfo.hasNotificationPermissions ? 'Granted' : 'Not Granted'}
            </Text>
          </View>

          <View>
            <Text className="font-semibold">Appointments Count:</Text>
            <Text className="text-gray-600">{diagnosticInfo.appointmentsCount}</Text>
          </View>

          <View>
            <Text className="font-semibold">Last Poll Time:</Text>
            <Text className="text-gray-600">{diagnosticInfo.lastPollTime}</Text>
          </View>

          <View>
            <Text className="font-semibold">Notification Token:</Text>
            <Text className="text-gray-600 text-xs">
              {diagnosticInfo.notificationToken ? 'Present' : 'Not available'}
            </Text>
          </View>

          <View className="space-y-2 pt-4">
            <Button onPress={runDiagnostics} disabled={isLoading}>
              <Text>{isLoading ? 'Running...' : 'Refresh Diagnostics'}</Text>
            </Button>

            {!diagnosticInfo.hasNotificationPermissions && (
              <Button onPress={requestPermissions} variant="outline">
                <Text>Request Notification Permissions</Text>
              </Button>
            )}

            {!diagnosticInfo.isPolling && diagnosticInfo.userId && (
              <Button onPress={startPolling} variant="outline">
                <Text>Start Polling Service</Text>
              </Button>
            )}

            <Button onPress={testNotification} variant="outline">
              <Text>Test Notification</Text>
            </Button>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

