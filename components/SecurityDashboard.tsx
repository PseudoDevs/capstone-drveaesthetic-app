/**
 * Security Dashboard Component
 * Shows security events and audit logs
 */
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Text } from './ui/text';
import { AuditLogger, SecurityEvent } from '~/lib/security/AuditLogger';

export function SecurityDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSecurityEvents();
  }, []);

  const loadSecurityEvents = async () => {
    setLoading(true);
    try {
      const recentEvents = AuditLogger.getRecentEvents(20);
      setEvents(recentEvents);
    } catch (error) {
      Alert.alert('Error', 'Failed to load security events');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const clearOldEvents = () => {
    AuditLogger.clearOldEvents();
    loadSecurityEvents();
  };

  return (
    <ScrollView className="flex-1 p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Security Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold">
              Recent Security Events ({events.length})
            </Text>
            <Button onPress={loadSecurityEvents} variant="outline" size="sm">
              Refresh
            </Button>
          </View>
          
          <Button onPress={clearOldEvents} variant="destructive" size="sm" className="mb-4">
            Clear Old Events
          </Button>
        </CardContent>
      </Card>

      {events.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <Text className="text-center text-muted-foreground">
              No security events found
            </Text>
          </CardContent>
        </Card>
      ) : (
        events.map((event) => (
          <Card key={event.id} className="mb-3">
            <CardContent className="p-4">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="font-semibold text-base">{event.action}</Text>
                <Badge variant={getSeverityColor(event.severity)}>
                  {event.severity}
                </Badge>
              </View>
              
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-muted-foreground">
                  {event.eventType}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {formatTimestamp(event.timestamp)}
                </Text>
              </View>

              {event.userId && (
                <Text className="text-sm text-muted-foreground mb-2">
                  User ID: {event.userId}
                </Text>
              )}

              {Object.keys(event.details).length > 0 && (
                <View className="mt-2">
                  <Text className="text-sm font-medium mb-1">Details:</Text>
                  <Text className="text-sm text-muted-foreground">
                    {JSON.stringify(event.details, null, 2)}
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </ScrollView>
  );
}
