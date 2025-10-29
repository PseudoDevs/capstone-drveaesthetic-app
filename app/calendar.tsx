import * as React from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { BottomNavigation } from '~/components/BottomNavigation';
import { ChevronLeft } from '~/lib/icons/ChevronLeft';
import { ChevronRight } from '~/lib/icons/ChevronRight';
import { router } from 'expo-router';
import { AppointmentService, Appointment } from '~/lib/api';
import { useAuth } from '~/lib/context/AuthContext';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  const loadAppointments = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with real API call when backend is ready
      // const response = await AppointmentService.getClientAppointments(user.id);
      // setAppointments(response.data || []);
      
      // Sample data for now
      const sampleAppointments: Appointment[] = [
        {
          id: 1,
          user_id: user.id,
          service_id: 1,
          appointment_date: '2024-01-25',
          appointment_time: '10:00:00',
          status: 'confirmed',
          notes: 'First time facial treatment',
          created_at: '2024-01-20T10:00:00Z',
          updated_at: '2024-01-20T10:00:00Z',
          service: {
            id: 1,
            service_name: 'Facial Treatment',
            description: 'Deep cleansing facial',
            price: 2500.00,
            duration: '60',
            status: 'active',
            staff: { id: 1, name: 'Dr. Smith' },
            appointments_count: '0',
            category: { id: 1, category_name: 'Laser Treatment' },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        },
        {
          id: 2,
          user_id: user.id,
          service_id: 2,
          appointment_date: '2024-01-28',
          appointment_time: '14:00:00',
          status: 'pending',
          notes: 'Follow-up laser treatment',
          created_at: '2024-01-22T14:30:00Z',
          updated_at: '2024-01-22T14:30:00Z',
          service: {
            id: 2,
            service_name: 'Laser Hair Removal',
            description: 'Underarm laser treatment',
            price: 1800.00,
            duration: '30',
            status: 'active',
            staff: { id: 1, name: 'Dr. Smith' },
            appointments_count: '0',
            category: { id: 2, category_name: 'Body Treatment' },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        },
        {
          id: 3,
          user_id: user.id,
          service_id: 3,
          appointment_date: '2024-02-01',
          appointment_time: '09:00:00',
          status: 'scheduled',
          notes: 'Consultation appointment',
          created_at: '2024-01-23T09:15:00Z',
          updated_at: '2024-01-23T09:15:00Z',
          service: {
            id: 3,
            service_name: 'Consultation',
            description: 'Initial consultation',
            price: 500.00,
            duration: '30',
            status: 'active',
            staff: { id: 1, name: 'Dr. Smith' },
            appointments_count: '0',
            category: { id: 3, category_name: 'Laser Treatment' },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      ];
      
      setAppointments(sampleAppointments);
    } catch (err) {
      setError('Failed to load appointments');
      console.error('Error loading appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAppointments();
    setIsRefreshing(false);
  };

  React.useEffect(() => {
    loadAppointments();
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'pending': return 'Pending';
      case 'scheduled': return 'Scheduled';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.appointment_date === dateString);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
          <Text className="mt-4 text-muted-foreground">Loading calendar...</Text>
        </View>
      </View>
    );
  }

  const days = getDaysInMonth(currentDate);
  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <Pressable 
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
          <Text className="ml-2 text-lg font-semibold text-foreground">Calendar</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Calendar Header */}
        <View className="px-6 py-4">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={() => navigateMonth('prev')}>
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </Pressable>
            <Text className="text-xl font-bold text-foreground">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <Pressable onPress={() => navigateMonth('next')}>
              <ChevronRight className="w-6 h-6 text-foreground" />
            </Pressable>
          </View>

          {/* Day Names */}
          <View className="flex-row mb-2">
            {dayNames.map((day) => (
              <View key={day} className="flex-1 items-center py-2">
                <Text className="text-sm font-medium text-muted-foreground">{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View className="bg-white rounded-lg border border-border">
            <View className="flex-row flex-wrap">
              {days.map((day, index) => {
                if (!day) {
                  return <View key={index} className="w-1/7 h-16" />;
                }
                
                const dayAppointments = getAppointmentsForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                const isSelected = selectedDate?.toDateString() === day.toDateString();
                
                return (
                  <Pressable
                    key={day.getTime()}
                    onPress={() => setSelectedDate(day)}
                    className={`w-1/7 h-16 border-r border-b border-border ${
                      isSelected ? 'bg-blue-100' : isToday ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <View className="flex-1 p-1">
                      <Text className={`text-sm font-medium ${
                        isToday ? 'text-blue-600' : isSelected ? 'text-blue-800' : 'text-foreground'
                      }`}>
                        {day.getDate()}
                      </Text>
                      {dayAppointments.length > 0 && (
                        <View className="flex-row flex-wrap mt-1">
                          {dayAppointments.slice(0, 2).map((apt, aptIndex) => (
                            <View
                              key={aptIndex}
                              className={`w-1.5 h-1.5 rounded-full mr-1 ${
                                apt.status === 'confirmed' ? 'bg-green-500' :
                                apt.status === 'pending' ? 'bg-yellow-500' :
                                apt.status === 'scheduled' ? 'bg-blue-500' :
                                'bg-gray-500'
                              }`}
                            />
                          ))}
                          {dayAppointments.length > 2 && (
                            <Text className="text-xs text-muted-foreground">+{dayAppointments.length - 2}</Text>
                          )}
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Selected Date Appointments */}
        {selectedDate && (
          <View className="px-6 pb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              {formatDate(selectedDate.toISOString())}
            </Text>
            
            {selectedDateAppointments.length === 0 ? (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="py-8">
                  <Text className="text-center text-gray-600">No appointments on this date</Text>
                </CardContent>
              </Card>
            ) : (
              selectedDateAppointments.map((appointment) => (
                <Card key={appointment.id} className="mb-4">
                  <CardContent className="py-4">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-foreground">
                          {appointment.service?.service_name}
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                          {formatTime(appointment.appointment_time)}
                        </Text>
                      </View>
                      <Badge className={getStatusColor(appointment.status)}>
                        {getStatusText(appointment.status)}
                      </Badge>
                    </View>
                    
                    {appointment.notes && (
                      <Text className="text-sm text-muted-foreground mb-2">
                        {appointment.notes}
                      </Text>
                    )}
                    
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted-foreground">
                        ₱{appointment.service?.price?.toLocaleString()}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        {appointment.service?.duration} minutes
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
          </View>
        )}

        {error && (
          <View className="px-6 pb-6">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="py-4">
                <Text className="text-red-800">{error}</Text>
                <Button 
                  variant="outline" 
                  className="mt-2 border-red-300"
                  onPress={loadAppointments}
                >
                  <Text className="text-red-700">Try Again</Text>
                </Button>
              </CardContent>
            </Card>
          </View>
        )}
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}
