import * as React from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
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
import { Appointment, FeedbackService } from '~/lib/api';

interface RateServiceModalProps {
  appointment: Appointment;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function RateServiceModal({ appointment, trigger, onSuccess }: RateServiceModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [errors, setErrors] = React.useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitRating = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Get current user to get client_id
      const { AuthStorage } = await import('~/lib/api');
      const userData = await AuthStorage.getUser();
      const clientId = userData?.data?.id || userData?.id;
      
      if (!clientId) {
        Alert.alert('Error', 'User information not found. Please try again.');
        return;
      }

      const feedbackData = {
        client_id: clientId,
        appointment_id: appointment.id,
        rating: rating,
        comment: comment.trim() || undefined,
      };


      await FeedbackService.createFeedback(feedbackData);
      
      Alert.alert(
        'Thank You!',
        'Your rating has been submitted successfully. We appreciate your feedback!',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsOpen(false);
              onSuccess?.();
              // Reset form
              setRating(0);
              setComment('');
              setErrors({});
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Rating Failed',
        error.response?.data?.message || error.message || 'Failed to submit rating. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const StarRating = () => {
    const stars = [1, 2, 3, 4, 5];
    
    return (
      <View className="flex-row justify-center space-x-2 my-4">
        {stars.map((star) => (
          <Button
            key={star}
            variant="ghost"
            size="lg"
            onPress={() => setRating(star)}
            className="p-2"
          >
            <Text className={`text-3xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}>
              ⭐
            </Text>
          </Button>
        ))}
      </View>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Rate Your Service</DialogTitle>
        </DialogHeader>
        
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="space-y-6 p-1">
            {/* Service Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Service:</Text>
                  <Text className="font-semibold flex-1 text-right">
                    {appointment.service?.service_name || 'Service'}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Date:</Text>
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
                  <Text className="text-muted-foreground">Time:</Text>
                  <Text className="font-semibold">{appointment.appointment_time}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-muted-foreground">Status:</Text>
                  <Badge variant="secondary">
                    <Text className="text-xs capitalize">{appointment.status}</Text>
                  </Badge>
                </View>
              </CardContent>
            </Card>

            {/* Rating Section */}
            <View className="space-y-3">
              <Label>How would you rate this service? *</Label>
              <StarRating />
              {rating > 0 && (
                <Text className="text-center text-muted-foreground">
                  {rating === 1 && "Poor - We'll do better next time"}
                  {rating === 2 && "Fair - Room for improvement"}
                  {rating === 3 && "Good - Met expectations"}
                  {rating === 4 && "Very Good - Exceeded expectations"}
                  {rating === 5 && "Excellent - Outstanding service!"}
                </Text>
              )}
              {errors.rating && (
                <Text className="text-destructive text-sm text-center">{errors.rating}</Text>
              )}
            </View>

            {/* Comment Section */}
            <View className="space-y-2">
              <Label>Share your experience (optional)</Label>
              <Input
                placeholder="Tell us about your experience, what went well, or how we can improve..."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
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
                onPress={handleSubmitRating}
                disabled={isLoading}
                className="flex-1"
              >
                <Text>
                  {isLoading ? 'Submitting...' : 'Submit Rating'}
                </Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </DialogContent>
    </Dialog>
  );
}