import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Pressable
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Separator } from '~/components/ui/separator';
import { BottomNavigation } from '~/components/BottomNavigation';
import { SimpleRatingModal } from '~/components/SimpleRatingModal';
import { AppointmentService, Appointment, FeedbackService } from '~/lib/api';
import { useAuth } from '~/lib/context/AuthContext';

type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();

  // Core state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [processing, setProcessing] = useState<{ [key: number]: boolean }>({});

  // Rating modal state
  const [ratingModal, setRatingModal] = useState<{
    visible: boolean;
    appointment: Appointment | null;
  }>({ visible: false, appointment: null });

  // Get user ID safely
  const getUserId = useCallback(() => {
    if (!user || !isAuthenticated) return null;
    return (user as any)?.data?.id || (user as any)?.id;
  }, [user, isAuthenticated]);

  // Load appointments
  const loadAppointments = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await AppointmentService.getClientAppointments(userId);
      setAppointments(response.data || []);
    } catch (err: any) {
      console.error('Load appointments error:', err);
      setError('Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [getUserId]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  }, [loadAppointments]);

  // Cancel appointment
  const cancelAppointment = useCallback(async (appointment: Appointment) => {
    Alert.alert(
      'Cancel Appointment',
      `Cancel your appointment for ${appointment.service?.service_name || 'this service'}?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(prev => ({ ...prev, [appointment.id]: true }));

              const response = await AppointmentService.cancelAppointment(
                appointment.id.toString(),
                appointment
              );

              // Update state immediately
              setAppointments(prev =>
                prev.map(apt =>
                  apt.id === appointment.id
                    ? { ...apt, status: 'cancelled' as const }
                    : apt
                )
              );

              Alert.alert('Success', 'Appointment cancelled successfully');
            } catch (err: any) {
              console.error('Cancel error:', err);
              Alert.alert('Error', 'Failed to cancel appointment');
            } finally {
              setProcessing(prev => ({ ...prev, [appointment.id]: false }));
            }
          }
        }
      ]
    );
  }, []);

  // Reschedule appointment
  const rescheduleAppointment = useCallback(async (appointment: Appointment) => {
    Alert.alert(
      'Reschedule Appointment',
      'Would you like to reschedule this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reschedule',
          onPress: () => {
            // For now, show a simple prompt - you can enhance this later
            Alert.alert('Info', 'Please call the clinic to reschedule: +63 123 456 7890');
          }
        }
      ]
    );
  }, []);

  // Rate service
  const rateService = useCallback((appointment: Appointment) => {
    setRatingModal({ visible: true, appointment });
  }, []);

  // Handle rating submission
  const handleRatingSubmit = useCallback(async (rating: number) => {
    if (!ratingModal.appointment) return;

    try {
      setProcessing(prev => ({ ...prev, [ratingModal.appointment!.id]: true }));

      await FeedbackService.createFeedback({
        appointment_id: ratingModal.appointment.id,
        rating,
        comment: `Rating for ${ratingModal.appointment.service?.service_name}`
      });

      setRatingModal({ visible: false, appointment: null });
      Alert.alert('Success', 'Thank you for your feedback!');
    } catch (err: any) {
      console.error('Rating error:', err);
      Alert.alert('Error', 'Failed to submit rating');
    } finally {
      setProcessing(prev => ({ ...prev, [ratingModal.appointment!.id]: false }));
    }
  }, [ratingModal.appointment]);

  // Close rating modal
  const closeRatingModal = useCallback(() => {
    setRatingModal({ visible: false, appointment: null });
  }, []);

  // Book again
  const bookAgain = useCallback((appointment: Appointment) => {
    Alert.alert(
      'Book Again',
      `Book ${appointment.service?.service_name} again?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book',
          onPress: () => {
            Alert.alert('Info', 'Please call the clinic to book: +63 123 456 7890');
          }
        }
      ]
    );
  }, []);

  // Filter appointments
  const filteredAppointments = appointments.filter(apt =>
    statusFilter === 'all' || apt.status === statusFilter
  );

  // Status badge color
  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Load data on mount
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 bg-secondary/30 justify-center items-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-muted-foreground">Loading appointments...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-secondary/30">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View className="px-6 pt-12 pb-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-3xl font-bold text-foreground">Appointments</Text>
            <Pressable
              onPress={handleRefresh}
              className="p-2 rounded-full bg-primary/10"
            >
              <Text className="text-lg">🔄</Text>
            </Pressable>
          </View>
        </View>

        {/* Filter Buttons */}
        <View className="px-6 mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-2">
              {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => setStatusFilter(filter)}
                  className={`px-4 py-2 rounded-full ${
                    statusFilter === filter ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <Text
                    className={`capitalize ${
                      statusFilter === filter ? 'text-primary-foreground' : 'text-secondary-foreground'
                    }`}
                  >
                    {filter}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Error State */}
        {error && (
          <View className="px-6 mb-6">
            <Card className="border-red-500/20 bg-red-50/10">
              <CardContent className="p-4">
                <Text className="text-red-600 text-center">{error}</Text>
                <Button
                  onPress={loadAppointments}
                  variant="outline"
                  className="mt-2"
                >
                  <Text>Try Again</Text>
                </Button>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Appointments List */}
        <View className="px-6 pb-32">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-8 items-center">
                <Text className="text-6xl mb-4">📅</Text>
                <Text className="text-xl font-semibold text-center mb-2">
                  No appointments found
                </Text>
                <Text className="text-muted-foreground text-center">
                  {statusFilter === 'all'
                    ? "You don't have any appointments yet"
                    : `No ${statusFilter} appointments`
                  }
                </Text>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="mb-4">
                <CardHeader>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <CardTitle className="text-lg">
                        {appointment.service?.service_name || 'Service'}
                      </CardTitle>
                      <Text className="text-sm text-muted-foreground">
                        ID: #{appointment.id}
                      </Text>
                    </View>
                    <Badge className={`${getStatusColor(appointment.status)} text-white`}>
                      <Text className="text-white capitalize">{appointment.status}</Text>
                    </Badge>
                  </View>
                </CardHeader>

                <CardContent>
                  <View className="space-y-3">
                    {/* Date & Time */}
                    <View className="flex-row items-center">
                      <Text className="text-base mr-2">📅</Text>
                      <Text className="flex-1">
                        {appointment.appointment_date} at {appointment.appointment_time}
                      </Text>
                    </View>

                    {/* Price */}
                    {appointment.service?.price && (
                      <View className="flex-row items-center">
                        <Text className="text-base mr-2">💰</Text>
                        <Text className="flex-1">₱{appointment.service.price}</Text>
                      </View>
                    )}

                    {/* Notes */}
                    {appointment.notes && (
                      <View className="flex-row items-start">
                        <Text className="text-base mr-2">📝</Text>
                        <Text className="flex-1 text-muted-foreground">
                          {appointment.notes}
                        </Text>
                      </View>
                    )}

                    <Separator className="my-3" />

                    {/* Action Buttons */}
                    <View className="flex-row flex-wrap gap-2">
                      {appointment.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onPress={() => rescheduleAppointment(appointment)}
                            disabled={processing[appointment.id]}
                          >
                            <Text>📅 Reschedule</Text>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onPress={() => cancelAppointment(appointment)}
                            disabled={processing[appointment.id]}
                          >
                            <Text>{processing[appointment.id] ? '⏳' : '❌'} Cancel</Text>
                          </Button>
                        </>
                      )}

                      {appointment.status === 'confirmed' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onPress={() => rescheduleAppointment(appointment)}
                            disabled={processing[appointment.id]}
                          >
                            <Text>📅 Reschedule</Text>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onPress={() => cancelAppointment(appointment)}
                            disabled={processing[appointment.id]}
                          >
                            <Text>{processing[appointment.id] ? '⏳' : '❌'} Cancel</Text>
                          </Button>
                        </>
                      )}

                      {appointment.status === 'completed' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onPress={() => rateService(appointment)}
                            disabled={processing[appointment.id]}
                          >
                            <Text>{processing[appointment.id] ? '⏳' : '⭐'} Rate</Text>
                          </Button>
                          <Button
                            size="sm"
                            onPress={() => bookAgain(appointment)}
                          >
                            <Text>🔄 Book Again</Text>
                          </Button>
                        </>
                      )}

                      {appointment.status === 'cancelled' && (
                        <Button
                          size="sm"
                          onPress={() => bookAgain(appointment)}
                        >
                          <Text>🔄 Book Again</Text>
                        </Button>
                      )}
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      <BottomNavigation />

      {/* Rating Modal */}
      <SimpleRatingModal
        visible={ratingModal.visible}
        serviceName={ratingModal.appointment?.service?.service_name || 'Service'}
        onClose={closeRatingModal}
        onSubmit={handleRatingSubmit}
        loading={ratingModal.appointment ? processing[ratingModal.appointment.id] : false}
      />
    </View>
  );
}