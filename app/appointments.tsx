import * as React from 'react';
import { View, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { BottomNavigation } from '~/components/BottomNavigation';
import { RescheduleAppointmentModal } from '~/components/RescheduleAppointmentModal';
import { RateServiceModal } from '~/components/RateServiceModal';
import { AppointmentFormModal } from '~/components/AppointmentFormModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { ChevronDown } from '~/lib/icons/ChevronDown';
import { AppointmentService, Appointment as ApiAppointment, AuthStorage, FeedbackService, Feedback } from '~/lib/api';
import { router } from 'expo-router';


export default function AppointmentsScreen() {
  const [selectedStatusFilter, setSelectedStatusFilter] = React.useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = React.useState<string>('all');
  const [appointments, setAppointments] = React.useState<ApiAppointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = React.useState<ApiAppointment[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [userFeedbacks, setUserFeedbacks] = React.useState<Feedback[]>([]);
  const insets = useSafeAreaInsets();

  const loadAppointments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user is authenticated and get user info
      const token = await AuthStorage.getToken();
      const userData = await AuthStorage.getUser();

      if (!token) {
        try {
          router.replace('/login');
        } catch (navError) {
          console.error('Navigation error:', navError);
        }
        return;
      }

      // Set token in API client to ensure requests are authenticated
      const { AuthService } = await import('~/lib/api');
      AuthService.setToken(token);

      setCurrentUser(userData);
      console.log('=== CURRENT USER ===');
      console.log('User data:', JSON.stringify(userData, null, 2));
      console.log('User data structure check:');
      console.log('userData exists:', !!userData);
      console.log('userData.id:', userData?.id);
      console.log('userData.data:', userData?.data);
      console.log('userData.data.id:', userData?.data?.id);
      console.log('===================');

      // Check for user ID in different possible structures
      const userId = userData?.data?.id || userData?.id;
      if (!userData || !userId) {
        throw new Error('User data not available - no valid user ID found');
      }

      const response = await AppointmentService.getClientAppointments(userId);

      console.log('=== CLIENT APPOINTMENTS API RESPONSE ===');
      console.log('Client ID used:', userId);
      console.log('API Endpoint called:', `/client/users/${userId}/appointments`);
      console.log('Full response:', JSON.stringify(response, null, 2));
      console.log('Appointments data:', response.data);
      console.log('========================================');

      setAppointments(response.data);

      // Load user feedbacks to check which appointments already have ratings
      try {
        const feedbackResponse = await FeedbackService.getFeedbacks();
        console.log('=== RAW FEEDBACK RESPONSE ===');
        console.log('Feedback response:', JSON.stringify(feedbackResponse, null, 2));
        console.log('Response type:', typeof feedbackResponse);
        console.log('Is array:', Array.isArray(feedbackResponse));
        console.log('Has data property:', !!feedbackResponse.data);
        console.log('============================');
        
        // Handle different response structures
        const feedbacks = Array.isArray(feedbackResponse) 
          ? feedbackResponse 
          : (Array.isArray(feedbackResponse.data) ? feedbackResponse.data : []);
        
        setUserFeedbacks(feedbacks);
        console.log('=== PROCESSED USER FEEDBACKS ===');
        console.log('Feedbacks:', JSON.stringify(feedbacks, null, 2));
        console.log('Feedbacks count:', feedbacks.length);
        console.log('================================');
      } catch (feedbackError) {
        console.warn('Failed to load user feedbacks:', feedbackError);
        setUserFeedbacks([]); // Set empty array as fallback
      }
    } catch (error: any) {
      console.error('Failed to load appointments:', error);
      if (error.response?.status === 401) {
        await AuthStorage.clearAll();
        try {
          router.replace('/login');
        } catch (navError) {
          console.error('Navigation error:', navError);
        }
        return;
      }
      setError('Failed to load appointments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadAppointments();
  }, []);

  React.useEffect(() => {
    let filtered = appointments;

    // Filter by status
    if (selectedStatusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === selectedStatusFilter);
    }

    // Filter by date
    if (selectedDateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.appointment_date);
        const appointmentDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
        
        switch (selectedDateFilter) {
          case 'today':
            return appointmentDay.getTime() === today.getTime();
          case 'upcoming':
            return appointmentDay.getTime() >= today.getTime();
          case 'past':
            return appointmentDay.getTime() < today.getTime();
          case 'this_week':
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            return appointmentDay.getTime() >= today.getTime() && appointmentDay.getTime() <= weekFromNow.getTime();
          case 'this_month':
            return appointmentDate.getMonth() === now.getMonth() && appointmentDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    setFilteredAppointments(filtered);
  }, [selectedStatusFilter, selectedDateFilter, appointments]);

  const getStatusFilterOptions = () => [
    { key: 'all', label: 'All Status', count: appointments.length },
    { key: 'pending', label: 'Pending', count: appointments.filter(a => a.status === 'pending').length },
    { key: 'confirmed', label: 'Scheduled', count: appointments.filter(a => a.status === 'confirmed').length },
    { key: 'completed', label: 'Completed', count: appointments.filter(a => a.status === 'completed').length },
    { key: 'cancelled', label: 'Cancelled', count: appointments.filter(a => a.status === 'cancelled').length },
  ];

  const getDateFilterOptions = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return [
      { key: 'all', label: 'All Time', count: appointments.length },
      { 
        key: 'today', 
        label: 'Today', 
        count: appointments.filter(a => {
          const appointmentDate = new Date(a.appointment_date);
          const appointmentDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
          return appointmentDay.getTime() === today.getTime();
        }).length 
      },
      { 
        key: 'upcoming', 
        label: 'Upcoming', 
        count: appointments.filter(a => {
          const appointmentDate = new Date(a.appointment_date);
          const appointmentDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
          return appointmentDay.getTime() >= today.getTime();
        }).length 
      },
      { 
        key: 'past', 
        label: 'Past', 
        count: appointments.filter(a => {
          const appointmentDate = new Date(a.appointment_date);
          const appointmentDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
          return appointmentDay.getTime() < today.getTime();
        }).length 
      },
      { 
        key: 'this_week', 
        label: 'This Week', 
        count: appointments.filter(a => {
          const appointmentDate = new Date(a.appointment_date);
          const appointmentDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          return appointmentDay.getTime() >= today.getTime() && appointmentDay.getTime() <= weekFromNow.getTime();
        }).length 
      },
      { 
        key: 'this_month', 
        label: 'This Month', 
        count: appointments.filter(a => {
          const appointmentDate = new Date(a.appointment_date);
          return appointmentDate.getMonth() === now.getMonth() && appointmentDate.getFullYear() === now.getFullYear();
        }).length 
      },
    ];
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleReschedule = () => {
    // Refresh appointments after reschedule
    loadAppointments();
  };

  const handleCancel = async (appointment: ApiAppointment) => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel your appointment for ${appointment.service?.service_name || 'this service'}?`,
      [
        {
          text: 'No, Keep It',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Cancelling appointment:', appointment.id);
              await AppointmentService.cancelAppointment(appointment.id.toString());
              console.log('Appointment cancelled successfully');
              
              Alert.alert(
                'Cancelled',
                'Your appointment has been cancelled successfully.',
                [{ text: 'OK' }]
              );

              // Update local state to mark appointment as cancelled
              setAppointments(prevAppointments => 
                prevAppointments.map(apt => 
                  apt.id === appointment.id 
                    ? { ...apt, status: 'cancelled' as const }
                    : apt
                )
              );
            } catch (error: any) {
              console.error('Failed to cancel appointment:', error);
              Alert.alert(
                'Cancellation Failed',
                error.response?.data?.message || error.message || 'Failed to cancel appointment. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const handleRebook = (appointment: ApiAppointment) => {
    console.log('Rebook appointment:', appointment);
    // The AppointmentFormModal will handle the rebooking with pre-selected service
  };

  const handleRate = (appointment: ApiAppointment) => {
    console.log('Rate appointment:', appointment);
    // The RateServiceModal will handle the rating submission
  };

  const handleRatingSuccess = async () => {
    // Refresh feedbacks after rating is submitted
    try {
      const feedbackResponse = await FeedbackService.getFeedbacks();
      const feedbacks = Array.isArray(feedbackResponse) 
        ? feedbackResponse 
        : (Array.isArray(feedbackResponse.data) ? feedbackResponse.data : []);
      setUserFeedbacks(feedbacks);
    } catch (error) {
      console.warn('Failed to refresh feedbacks:', error);
      setUserFeedbacks([]); // Set empty array as fallback
    }
    // Also refresh appointments to ensure consistency
    loadAppointments();
  };

  const handleBookingSuccess = () => {
    // Refresh appointments after new booking is created
    loadAppointments();
  };

  const hasFeedback = (appointmentId: number): boolean => {
    if (!userFeedbacks || !Array.isArray(userFeedbacks)) {
      return false;
    }
    return userFeedbacks.some(feedback => feedback.appointment_id === appointmentId);
  };

  return (
    <View className="flex-1 bg-secondary/30">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-12 pb-6">
          <Text className="text-3xl font-bold text-foreground mb-4">My Appointments</Text>

          {/* Filter Dropdowns */}
          {!isLoading && (
            <View className="mb-4 space-y-3">
              {/* Status Filter */}
              <View>
                <Text className="text-sm font-medium text-muted-foreground mb-2">Filter by Status</Text>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <View className="flex-row items-center justify-between p-3 border border-border rounded-md bg-background">
                      <Text className="text-foreground font-medium">
                        {getStatusFilterOptions().find(option => option.key === selectedStatusFilter)?.label || 'All Status'}
                        {getStatusFilterOptions().find(option => option.key === selectedStatusFilter)?.count !== undefined &&
                          ` (${getStatusFilterOptions().find(option => option.key === selectedStatusFilter)?.count})`
                        }
                      </Text>
                      <ChevronDown size={16} className="text-muted-foreground ml-2" />
                    </View>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {getStatusFilterOptions().map((option) => (
                      <DropdownMenuItem
                        key={option.key}
                        onPress={() => setSelectedStatusFilter(option.key)}
                        className={selectedStatusFilter === option.key ? "bg-accent" : ""}
                      >
                        <Text className={selectedStatusFilter === option.key ? "text-accent-foreground font-medium" : "text-foreground"}>
                          {option.label} ({option.count})
                        </Text>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </View>

              {/* Date Filter */}
              <View>
                <Text className="text-sm font-medium text-muted-foreground mb-2">Filter by Date</Text>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <View className="flex-row items-center justify-between p-3 border border-border rounded-md bg-background">
                      <Text className="text-foreground font-medium">
                        {getDateFilterOptions().find(option => option.key === selectedDateFilter)?.label || 'All Time'}
                        {getDateFilterOptions().find(option => option.key === selectedDateFilter)?.count !== undefined &&
                          ` (${getDateFilterOptions().find(option => option.key === selectedDateFilter)?.count})`
                        }
                      </Text>
                      <ChevronDown size={16} className="text-muted-foreground ml-2" />
                    </View>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {getDateFilterOptions().map((option) => (
                      <DropdownMenuItem
                        key={option.key}
                        onPress={() => setSelectedDateFilter(option.key)}
                        className={selectedDateFilter === option.key ? "bg-accent" : ""}
                      >
                        <Text className={selectedDateFilter === option.key ? "text-accent-foreground font-medium" : "text-foreground"}>
                          {option.label} ({option.count})
                        </Text>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </View>
            </View>
          )}
        </View>

        {/* Loading State */}
        {isLoading && (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" />
            <Text className="text-muted-foreground mt-4">Loading appointments...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View className="px-6 items-center py-12">
            <Text className="text-6xl mb-4">⚠️</Text>
            <Text className="text-lg font-semibold text-foreground mb-2">
              Something went wrong
            </Text>
            <Text className="text-muted-foreground text-center mb-6">
              {error}
            </Text>
            <Button onPress={loadAppointments}>
              <Text>Try Again</Text>
            </Button>
          </View>
        )}

        {/* Appointments List */}
        {!isLoading && !error && (
          <View
            className="px-6"
            style={{ paddingBottom: Math.max(insets.bottom + 100, 120) }}
          >
            {filteredAppointments.length > 0 ? (
              <View className="gap-3">
                {filteredAppointments
                  .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
                  .map((appointment) => (
                    <Card key={appointment.id}>
                      <CardHeader className="pb-3">
                        <View className="flex-row justify-between items-start">
                          <CardTitle className="text-lg flex-1 pr-2">
                            {appointment.service?.service_name || 'Service'}
                          </CardTitle>
                          <Badge
                            variant={getStatusVariant(appointment.status)}
                            className={
                              appointment.status === 'completed'
                                ? 'bg-green-100 border-green-200'
                                : ''
                            }
                          >
                            <Text
                              className={`text-xs capitalize font-medium ${appointment.status === 'completed'
                                  ? 'text-green-800'
                                  : ''
                                }`}
                            >
                              {appointment.status}
                            </Text>
                          </Badge>
                        </View>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* Date & Time */}
                        <View className="flex-row justify-between">
                          <Text className="text-muted-foreground">📅 {formatDate(appointment.appointment_date)}</Text>
                          <Text className="text-muted-foreground">🕒 {appointment.appointment_time}</Text>
                        </View>

                        {/* Client & Location */}
                        <View className="space-y-1">
                          <Text className="text-sm text-muted-foreground">
                            👤 Client: {appointment.user?.name || 'You'}
                          </Text>
                          <Text className="text-sm text-muted-foreground">
                            📍 Dr. Ve Aesthetic Clinic
                          </Text>
                        </View>

                        {/* Duration & Price */}
                        <View className="flex-row justify-between items-center">
                          <Text className="text-sm text-muted-foreground">
                            Duration: {appointment.service?.duration || 60} min
                          </Text>
                          <Text className="text-lg font-bold text-primary">
                            ₱{appointment.service?.price?.toLocaleString() || 0}
                          </Text>
                        </View>

                        {/* Action Buttons */}
                        <View className="pt-2">
                          {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                            <View className="flex-row gap-3">
                              <RescheduleAppointmentModal
                                appointment={appointment}
                                onSuccess={handleReschedule}
                                trigger={
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                  >
                                    <Text>Reschedule</Text>
                                  </Button>
                                }
                              />
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                                onPress={() => handleCancel(appointment)}
                              >
                                <Text>Cancel</Text>
                              </Button>
                            </View>
                          )}

                          {appointment.status === 'completed' && (
                            <View className="flex-row gap-3">
                              <AppointmentFormModal
                                preselectedService={appointment.service}
                                onSuccess={handleBookingSuccess}
                                trigger={
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={hasFeedback(appointment.id) ? "w-full" : "flex-1"}
                                  >
                                    <Text>Book Again</Text>
                                  </Button>
                                }
                              />
                              {!hasFeedback(appointment.id) && (
                                <RateServiceModal
                                  appointment={appointment}
                                  onSuccess={handleRatingSuccess}
                                  trigger={
                                    <Button
                                      size="sm"
                                      className="flex-1"
                                    >
                                      <Text>Rate Service</Text>
                                    </Button>
                                  }
                                />
                              )}
                            </View>
                          )}

                          {appointment.status === 'cancelled' && (
                            <AppointmentFormModal
                              preselectedService={appointment.service}
                              onSuccess={handleBookingSuccess}
                              trigger={
                                <Button
                                  size="sm"
                                  className="w-full"
                                >
                                  <Text>Book Again</Text>
                                </Button>
                              }
                            />
                          )}
                        </View>
                      </CardContent>
                    </Card>
                  ))}
              </View>
            ) : (
              <View className="items-center py-12">
                <Text className="text-6xl mb-4">📅</Text>
                <Text className="text-lg font-semibold text-foreground mb-2">
                  No appointments found
                </Text>
                <Text className="text-muted-foreground text-center mb-6">
                  {selectedStatusFilter === 'all' && selectedDateFilter === 'all'
                    ? "You don't have any appointments yet."
                    : `No appointments found matching your filters.`}
                </Text>
                <Button onPress={() => console.log('Book appointment')}>
                  <Text>Book Your First Appointment</Text>
                </Button>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}