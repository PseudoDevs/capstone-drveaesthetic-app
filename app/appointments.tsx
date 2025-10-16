import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Separator } from '~/components/ui/separator';
import { BottomNavigation } from '~/components/BottomNavigation';
import { FeedbackDialog } from '~/components/FeedbackDialog';
import { AppointmentDiagnostic } from '~/components/AppointmentDiagnostic';
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

  // Diagnostic state
  const [showDiagnostic, setShowDiagnostic] = useState(false);

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

  // Handle feedback submission
  const handleFeedbackSubmit = useCallback(async (rating: number, comment: string) => {
    if (!ratingModal.appointment) return;

    const userId = getUserId();
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, [ratingModal.appointment!.id]: true }));

      await FeedbackService.createFeedback({
        client_id: userId,
        appointment_id: ratingModal.appointment.id,
        rating,
        comment: comment || null
      });

      setRatingModal({ visible: false, appointment: null });
      Alert.alert('Success', 'Thank you for your feedback!');
    } catch (err: any) {
      console.error('Feedback error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to submit feedback';
      Alert.alert('Error', errorMessage);
    } finally {
      setProcessing(prev => ({ ...prev, [ratingModal.appointment!.id]: false }));
    }
  }, [ratingModal.appointment, getUserId]);

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
      {/* Header with Clinic Logo */}
      <View className="bg-white px-6 py-4 shadow-sm" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-10 h-10 items-center justify-center mr-3">
              <Image 
                source={{ 
                  uri: 'https://scontent.fmnl4-7.fna.fbcdn.net/v/t39.30808-6/418729090_122097326798182940_868500779979598848_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeExtMuvkhE4ITBCXKkbJRRmnZbZoGt7CtWdltmga3sK1V49cOQhA3jFasNBp_355lXq9Z0SxpMfYO43nSvwjgEr&_nc_ohc=sRIUyy60tlQQ7kNvwGcUnnr&_nc_oc=AdnLSrTbOQ_VqB5iAS-lBLvUtMQxUOFutFqRPmhNlYIwvbgB0ZttP2sah71JUpcn8aIdm39tvfnVl_hRldYr2rF4&_nc_zt=23&_nc_ht=scontent.fmnl4-7.fna&_nc_gid=71Jv1Ip9VUfuxJswvEBV2g&oh=00_AfcFGjvy1UU67Wh4qD4cUP0d_bUGB7dFKphEvhc_fkh1GQ&oe=68EEF994',
                  cache: 'force-cache'
                }}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text className="text-gray-800 text-lg font-bold">Dr. Ve Aesthetic</Text>
              <Text className="text-gray-500 text-xs">My Appointments</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View className="px-6 pt-8 pb-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-3xl font-bold text-foreground">Appointments</Text>
            <View className="flex-row space-x-2">
              <Pressable
                onPress={() => setShowDiagnostic(!showDiagnostic)}
                className="p-2 rounded-full bg-primary/10"
              >
                <Text className="text-lg">🔧</Text>
              </Pressable>
              <Pressable
                onPress={handleRefresh}
                className="p-2 rounded-full bg-primary/10"
              >
                <Text className="text-lg">🔄</Text>
              </Pressable>
            </View>
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
                <Text className="text-4xl mb-4 text-gray-400">📅</Text>
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
                      <Text className="text-sm text-gray-600 mr-2">Date:</Text>
                      <Text className="flex-1">
                        {appointment.appointment_date} at {appointment.appointment_time}
                      </Text>
                    </View>

                    {/* Price */}
                    {appointment.service?.price && (
                      <View className="flex-row items-center">
                        <Text className="text-sm text-gray-600 mr-2">Price:</Text>
                        <Text className="flex-1">₱{appointment.service.price}</Text>
                      </View>
                    )}

                    {/* Notes */}
                    {appointment.notes && (
                      <View className="flex-row items-start">
                        <Text className="text-sm text-gray-600 mr-2">Notes:</Text>
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
                            <Text>Reschedule</Text>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onPress={() => cancelAppointment(appointment)}
                            disabled={processing[appointment.id]}
                          >
                            <Text>{processing[appointment.id] ? 'Processing...' : 'Cancel'}</Text>
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
                            <Text>Reschedule</Text>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onPress={() => cancelAppointment(appointment)}
                            disabled={processing[appointment.id]}
                          >
                            <Text>{processing[appointment.id] ? 'Processing...' : 'Cancel'}</Text>
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
                            <Text>{processing[appointment.id] ? 'Processing...' : 'Rate'}</Text>
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

      {/* Diagnostic Tool */}
      {showDiagnostic && (
        <View className="absolute inset-0 bg-black/50 z-50">
          <View className="flex-1 bg-white m-4 rounded-lg">
            <View className="flex-row justify-between items-center p-4 border-b">
              <Text className="text-lg font-bold">Appointment Diagnostic</Text>
              <Pressable
                onPress={() => setShowDiagnostic(false)}
                className="p-2 rounded-full bg-gray-100"
              >
                <Text className="text-lg">✕</Text>
              </Pressable>
            </View>
            <AppointmentDiagnostic />
          </View>
        </View>
      )}

      <BottomNavigation />

      {/* Feedback Modal */}
      <FeedbackDialog
        visible={ratingModal.visible}
        serviceName={ratingModal.appointment?.service?.service_name || 'Service'}
        onClose={closeRatingModal}
        onSubmit={handleFeedbackSubmit}
        loading={ratingModal.appointment ? processing[ratingModal.appointment.id] : false}
      />
    </View>
  );
}