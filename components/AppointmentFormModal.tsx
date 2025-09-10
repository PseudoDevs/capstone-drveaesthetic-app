import * as React from 'react';
import { View, ScrollView, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Badge } from '~/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { ClinicService, AppointmentService, AuthStorage } from '~/lib/api';

interface AppointmentFormModalProps {
  service?: ClinicService;
  preselectedService?: ClinicService;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function AppointmentFormModal({ service, preselectedService, trigger, onSuccess }: AppointmentFormModalProps) {
  // Use service prop or preselectedService, with service taking priority
  const selectedService = service || preselectedService;

  if (!selectedService) {
    console.warn('AppointmentFormModal: No service or preselectedService provided');
    return null;
  }
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = React.useState<string[]>([]);
  
  // Medical History State
  const [medicalHistory, setMedicalHistory] = React.useState({
    hypertension: false,
    diabetes: false,
    heart_disease: false,
    allergies: false,
    skin_conditions: false,
    previous_surgery: false,
    medications: false,
    other_conditions: false,
  });

  // Personal Status State
  const [personalStatus, setPersonalStatus] = React.useState({
    pregnant: false,
    breastfeeding: false,
    smoker: false,
    alcohol_consumer: false,
  });

  const [notes, setNotes] = React.useState('');
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const user = await AuthStorage.getUser();
      const userId = user?.data?.id || user?.id;
      
      if (!userId) {
        Alert.alert('Error', 'User not found. Please log in again.');
        return;
      }

      // Prepare medical form data
      const medicalFormData = {
        medical_history: medicalHistory,
        personal_status: personalStatus,
        additional_notes: notes,
      };

      const appointmentData = {
        client_id: userId,
        service_id: selectedService!.id,
        appointment_date: selectedDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        appointment_time: selectedTimeSlot,
        status: 'pending',
        medical_form_data: medicalFormData,
        notes: notes,
      };

      console.log('=== BOOKING APPOINTMENT ===');
      console.log('Appointment data:', JSON.stringify(appointmentData, null, 2));
      console.log('==========================');

      await AppointmentService.createAppointment(appointmentData);
      
      Alert.alert(
        'Success!',
        'Your appointment has been booked successfully. You will receive a confirmation shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsOpen(false);
              onSuccess?.();
              // Reset form
              setSelectedDate(new Date());
              setSelectedTimeSlot('');
              setMedicalHistory({
                hypertension: false,
                diabetes: false,
                heart_disease: false,
                allergies: false,
                skin_conditions: false,
                previous_surgery: false,
                medications: false,
                other_conditions: false,
              });
              setPersonalStatus({
                pregnant: false,
                breastfeeding: false,
                smoker: false,
                alcohol_consumer: false,
              });
              setNotes('');
              setErrors({});
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to book appointment:', error);
      Alert.alert(
        'Booking Failed',
        error.response?.data?.message || error.message || 'Failed to book appointment. Please try again.'
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
          <DialogTitle>Book Appointment</DialogTitle>
        </DialogHeader>
        
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="space-y-6 p-1">
            {/* Service Details */}
            {selectedService && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{selectedService.service_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">Price:</Text>
                    <Text className="font-semibold">₱{selectedService.price?.toLocaleString() || 'N/A'}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">Duration:</Text>
                    <Text className="font-semibold">{selectedService.duration || 60} mins</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">Category:</Text>
                    <Badge variant="secondary">
                      <Text className="text-xs">{selectedService.category?.category_name || 'General'}</Text>
                    </Badge>
                  </View>
                </CardContent>
              </Card>
            )}

            {/* Date Selection */}
            <View className="space-y-2">
              <Label>Appointment Date *</Label>
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

            {/* Time Slot Selection */}
            <View className="space-y-3">
              <Label>Preferred Time Slot *</Label>
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

            {/* Medical History */}
            <View className="space-y-3">
              <Label>Past Medical History</Label>
              <View className="space-y-2">
                {Object.entries(medicalHistory).map(([key, value]) => (
                  <View key={key} className="flex-row items-center space-x-2">
                    <Checkbox
                      checked={value}
                      onCheckedChange={(checked) => 
                        setMedicalHistory(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                    <Text className="flex-1 capitalize">
                      {key.replace(/_/g, ' ')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Personal Status */}
            <View className="space-y-3">
              <Label>Personal Status</Label>
              <View className="space-y-2">
                {Object.entries(personalStatus).map(([key, value]) => (
                  <View key={key} className="flex-row items-center space-x-2">
                    <Checkbox
                      checked={value}
                      onCheckedChange={(checked) => 
                        setPersonalStatus(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                    <Text className="flex-1 capitalize">
                      {key.replace(/_/g, ' ')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Additional Notes */}
            <View className="space-y-2">
              <Label>Additional Notes</Label>
              <Input
                placeholder="Any additional information or special requests..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <Button
              onPress={handleSubmit}
              disabled={isLoading}
              className="w-full"
            >
              <Text>
                {isLoading ? 'Booking...' : 'Book Appointment'}
              </Text>
            </Button>
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