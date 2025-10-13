import * as React from 'react';
import { View, ScrollView, Alert, Platform, Modal, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Badge } from '~/components/ui/badge';
import { ClinicService, AppointmentService, AuthStorage } from '~/lib/api';

interface AppointmentFormModalProps {
  service?: ClinicService;
  preselectedService?: ClinicService;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AppointmentFormModal({ service, preselectedService, visible, onClose, onSuccess }: AppointmentFormModalProps) {
  // All hooks must be called before any conditional returns
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
  const [otherConditionsText, setOtherConditionsText] = React.useState('');
  const [errors, setErrors] = React.useState<{[key: string]: string}>({});

  // Use service prop or preselectedService, with service taking priority
  const selectedService = service || preselectedService;

  // Safety check for onClose
  if (!onClose || typeof onClose !== 'function') {
    console.error('AppointmentFormModal: onClose prop is required and must be a function');
    return null;
  }

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

    // Validate other conditions text if other_conditions is checked
    if (medicalHistory.other_conditions && !otherConditionsText.trim()) {
      newErrors.otherConditions = 'Please specify your other medical conditions';
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
      console.log('Retrieved user:', user);
      
      // Handle different user data structures
      let userId = null;
      if (user) {
        if (typeof user === 'object' && user.id) {
          userId = user.id;
        } else if (typeof user === 'object' && (user as any).data && (user as any).data.id) {
          userId = (user as any).data.id;
        } else if (typeof user === 'number') {
          userId = user;
        }
      }
      
      console.log('Extracted userId:', userId);
      
      if (!userId) {
        Alert.alert(
          'Authentication Error', 
          'Please log in again to book an appointment.',
          [
            {
              text: 'OK',
              onPress: () => {
                onClose();
                // You might want to redirect to login here
              }
            }
          ]
        );
        return;
      }

      // Prepare medical form data
      const medicalFormData = {
        medical_history: medicalHistory,
        personal_status: personalStatus,
        additional_notes: notes,
        other_conditions_text: otherConditionsText,
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


      await AppointmentService.createAppointment(appointmentData);
      
      Alert.alert(
        'Success!',
        'Your appointment has been booked successfully. You will receive a confirmation shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
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
              setOtherConditionsText('');
              setErrors({});
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Failed to book appointment. Please try again.';
      
      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      Alert.alert('Booking Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible && !!selectedService}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {selectedService ? (
        <View className="flex-1 bg-gray-50">
        {/* Enhanced Header */}
        <View className="bg-white border-b border-gray-100 shadow-sm">
          <View className="flex-row items-center justify-between px-6 py-4">
            <Pressable 
              onPress={() => {
                console.log('Cancel button pressed');
                if (onClose && typeof onClose === 'function') {
                  onClose();
                } else {
                  console.error('onClose is not a function:', onClose);
                }
              }}
              className="px-3 py-2 rounded-lg bg-gray-100"
              disabled={isLoading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-gray-600 font-medium">Cancel</Text>
            </Pressable>
            <View className="items-center">
              <Text className="text-xl font-bold text-gray-900">Book Appointment</Text>
              <Text className="text-xs text-gray-500 mt-1">Schedule your service</Text>
            </View>
            <Pressable 
              onPress={() => {
                console.log('Book button pressed');
                handleSubmit();
              }}
              disabled={isLoading || !selectedDate || !selectedTimeSlot}
              className={`px-4 py-2 rounded-lg ${isLoading || !selectedDate || !selectedTimeSlot ? 'bg-gray-200' : 'bg-primary'}`}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className={`font-semibold ${isLoading || !selectedDate || !selectedTimeSlot ? 'text-gray-400' : 'text-white'}`}>
                {isLoading ? 'Booking...' : 'Book'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Enhanced Content */}
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 py-6">
            {/* Service Info Section */}
            <View className="items-center mb-8">
              <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 w-full">
                <Text className="text-lg font-semibold text-gray-800 text-center mb-2">
                  {selectedService.service_name}
                </Text>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-600">Price:</Text>
                  <Text className="font-semibold text-primary">₱{selectedService.price?.toLocaleString() || 'N/A'}</Text>
                  </View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-600">Duration:</Text>
                  <Text className="font-semibold text-gray-800">{selectedService.duration || 60} mins</Text>
                  </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Category:</Text>
                  <Badge className="bg-primary/10 border-primary/20">
                    <Text className="text-xs text-primary">{selectedService.category?.category_name || 'General'}</Text>
                  </Badge>
                  </View>
              </View>
            </View>

            {/* Form Fields */}
            <View className="space-y-6">
            {/* Date Selection */}
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <Text className="text-sm font-semibold text-gray-800 mb-2">Appointment Date *</Text>
                <Pressable
                onPress={() => setShowDatePicker(true)}
                  className="h-12 justify-center border border-gray-200 rounded-lg px-3"
              >
                  <Text className="text-gray-900 text-base">
                  {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                    year: 'numeric',
                      month: 'long',
                    day: 'numeric'
                  })}
                </Text>
                </Pressable>
              {errors.date && (
                  <Text className="text-red-500 text-sm mt-2">{errors.date}</Text>
              )}
            </View>

            {/* Time Slot Selection */}
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <Text className="text-sm font-semibold text-gray-800 mb-3">Preferred Time Slot *</Text>
              <View className="flex-row flex-wrap gap-2">
                {timeSlots.map((slot) => {
                  const isAvailable = availableTimeSlots.includes(slot.value);
                  const isSelected = selectedTimeSlot === slot.value;
                  
                  return (
                      <Pressable
                      key={slot.value}
                      disabled={!isAvailable}
                      onPress={() => setSelectedTimeSlot(slot.value)}
                        className={`px-3 py-2 rounded-lg border ${
                          isSelected 
                            ? 'bg-primary border-primary' 
                            : isAvailable 
                              ? 'bg-white border-gray-300' 
                              : 'bg-gray-100 border-gray-200 opacity-50'
                        }`}
                      >
                        <Text className={`text-sm font-medium ${
                          isSelected ? 'text-white' : isAvailable ? 'text-gray-700' : 'text-gray-400'
                        }`}>
                        {slot.display}
                      </Text>
                      </Pressable>
                  );
                })}
              </View>
              {errors.timeSlot && (
                  <Text className="text-red-500 text-sm mt-2">{errors.timeSlot}</Text>
              )}
            </View>

            {/* Medical History */}
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <Text className="text-sm font-semibold text-gray-800 mb-3">Past Medical History</Text>
            <View className="space-y-3">
                {Object.entries(medicalHistory).map(([key, value]) => (
                    <View key={key}>
                      <View className="flex-row items-center space-x-3">
                    <Checkbox
                      checked={value}
                      onCheckedChange={(checked) => 
                        setMedicalHistory(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                        <Text className="flex-1 text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </Text>
                      </View>
                      {/* Show text input for Other Conditions */}
                      {key === 'other_conditions' && value && (
                        <View className="ml-8 mt-2">
                          <View className="bg-gray-50 rounded-lg border border-gray-200">
                            <Input
                              placeholder="Please specify your other medical conditions..."
                              value={otherConditionsText}
                              onChangeText={setOtherConditionsText}
                              multiline
                              numberOfLines={2}
                              className="border-0 bg-transparent text-base min-h-[60px] px-3"
                              style={{ fontSize: 16 }}
                            />
                          </View>
                          {errors.otherConditions && (
                            <Text className="text-red-500 text-sm mt-1">{errors.otherConditions}</Text>
                          )}
                        </View>
                      )}
                  </View>
                ))}
              </View>
            </View>

            {/* Personal Status */}
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <Text className="text-sm font-semibold text-gray-800 mb-3">Personal Status</Text>
            <View className="space-y-3">
                {Object.entries(personalStatus).map(([key, value]) => (
                    <View key={key} className="flex-row items-center space-x-3">
                    <Checkbox
                      checked={value}
                      onCheckedChange={(checked) => 
                        setPersonalStatus(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                      <Text className="flex-1 text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Additional Notes */}
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <Text className="text-sm font-semibold text-gray-800 mb-2">Additional Notes</Text>
                <View className="bg-gray-50 rounded-lg border border-gray-200">
              <Input
                placeholder="Any additional information or special requests..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                    className="border-0 bg-transparent text-base min-h-[80px] px-3"
                    style={{ fontSize: 16 }}
              />
                </View>
              </View>
            </View>

            {/* Submit Button (Alternative) */}
            <View className="mt-8">
            <Button
                className={`h-14 rounded-xl ${isLoading || !selectedDate || !selectedTimeSlot ? 'bg-gray-300' : 'bg-primary'}`}
              onPress={handleSubmit}
                disabled={isLoading || !selectedDate || !selectedTimeSlot}
            >
                <Text className={`text-lg font-semibold ${isLoading || !selectedDate || !selectedTimeSlot ? 'text-gray-500' : 'text-white'}`}>
                  {isLoading ? 'Booking Appointment...' : 'Book Appointment'}
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
      </View>
      ) : null}
    </Modal>
  );
}