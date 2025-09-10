import * as React from 'react';
import { View, ScrollView, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Appointment, AppointmentService } from '~/lib/api';

interface RescheduleAppointmentModalProps {
  appointment: Appointment;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function RescheduleAppointmentModal({ appointment, trigger, onSuccess }: RescheduleAppointmentModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date(appointment.appointment_date));
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState(appointment.appointment_time);
  const [availableTimeSlots, setAvailableTimeSlots] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<{[key: string]: string}>({});

  // Generate time slots from 8 AM to 5 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      const time12 = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? `12:00 PM` : `${hour}:00 AM`;
      const time24 = `${hour.toString().padStart(2, '0')}:00`;
      slots.push({ display: time12, value: time24 });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Filter available time slots based on date and current time
  React.useEffect(() => {
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    
    const available = timeSlots.filter(slot => {
      if (isToday) {
        const currentHour = today.getHours();
        const slotHour = parseInt(slot.value.split(':')[0]);
        return slotHour > currentHour;
      }
      return true;
    });
    
    setAvailableTimeSlots(available.map(slot => slot.value));
  }, [selectedDate]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    if (selectedDateOnly < today) {
      newErrors.date = 'Please select a future date';
    }

    if (!selectedTimeSlot) {
      newErrors.timeSlot = 'Please select a time slot';
    }

    // Check if the new date/time is different from current
    const currentDate = new Date(appointment.appointment_date).toDateString();
    const newDate = selectedDate.toDateString();
    if (currentDate === newDate && appointment.appointment_time === selectedTimeSlot) {
      newErrors.general = 'Please select a different date or time to reschedule';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReschedule = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        appointment_date: selectedDate.toISOString().split('T')[0],
        appointment_time: selectedTimeSlot,
        status: 'pending', // Reset status to pending when rescheduled
      };

      console.log('=== RESCHEDULING APPOINTMENT ===');
      console.log('Appointment ID:', appointment.id);
      console.log('Update data:', JSON.stringify(updateData, null, 2));
      console.log('================================');

      await AppointmentService.updateAppointment(appointment.id.toString(), updateData);
      
      Alert.alert(
        'Success!',
        'Your appointment has been rescheduled successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsOpen(false);
              onSuccess?.();
              // Reset form
              setSelectedDate(new Date(appointment.appointment_date));
              setSelectedTimeSlot(appointment.appointment_time);
              setErrors({});
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to reschedule appointment:', error);
      Alert.alert(
        'Reschedule Failed',
        error.response?.data?.message || error.message || 'Failed to reschedule appointment. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
        </DialogHeader>
        
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="space-y-6 p-1">
            {/* Current Appointment Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Current Appointment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Service:</Text>
                  <Text className="font-semibold flex-1 text-right">
                    {appointment.service?.service_name || 'Service'}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Current Date:</Text>
                  <Text className="font-semibold">
                    {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Current Time:</Text>
                  <Text className="font-semibold">{appointment.appointment_time}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-muted-foreground">Status:</Text>
                  <Badge variant={appointment.status === 'confirmed' ? 'default' : 'outline'}>
                    <Text className="text-xs capitalize">{appointment.status}</Text>
                  </Badge>
                </View>
              </CardContent>
            </Card>

            {/* General Error */}
            {errors.general && (
              <View className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <Text className="text-destructive text-sm font-medium">
                  {errors.general}
                </Text>
              </View>
            )}

            {/* New Date Selection */}
            <View className="space-y-2">
              <Label>New Appointment Date *</Label>
              <Button
                variant="outline"
                onPress={() => setShowDatePicker(true)}
                className={`justify-start ${errors.date ? "border-destructive" : ""}`}
              >
                <Text className="text-foreground">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </Button>
              {errors.date && (
                <Text className="text-destructive text-sm">{errors.date}</Text>
              )}
            </View>

            {/* New Time Slot Selection */}
            <View className="space-y-3">
              <Label>New Time Slot *</Label>
              <View className="flex-row flex-wrap gap-2">
                {timeSlots.map((slot) => {
                  const isAvailable = availableTimeSlots.includes(slot.value);
                  const isSelected = selectedTimeSlot === slot.value;
                  
                  return (
                    <Button
                      key={slot.value}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      disabled={!isAvailable}
                      onPress={() => setSelectedTimeSlot(slot.value)}
                      className={`${!isAvailable ? 'opacity-50' : ''}`}
                    >
                      <Text className={isSelected ? "text-primary-foreground" : "text-foreground"}>
                        {slot.display}
                      </Text>
                    </Button>
                  );
                })}
              </View>
              {errors.timeSlot && (
                <Text className="text-destructive text-sm">{errors.timeSlot}</Text>
              )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              <Button
                variant="outline"
                onPress={() => setIsOpen(false)}
                disabled={isLoading}
                className="flex-1"
              >
                <Text>Cancel</Text>
              </Button>
              <Button
                onPress={handleReschedule}
                disabled={isLoading}
                className="flex-1"
              >
                <Text>
                  {isLoading ? 'Rescheduling...' : 'Reschedule'}
                </Text>
              </Button>
            </View>
          </View>
        </ScrollView>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (event.type === 'set' && date) {
                setSelectedDate(date);
                setSelectedTimeSlot(''); // Reset time slot when date changes
              }
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}