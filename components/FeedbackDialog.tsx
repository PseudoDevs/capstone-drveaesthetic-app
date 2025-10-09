import React, { useState } from 'react';
import { View, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

interface FeedbackDialogProps {
  visible: boolean;
  serviceName: string;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  loading?: boolean;
}

export function FeedbackDialog({
  visible,
  serviceName,
  onClose,
  onSubmit,
  loading = false
}: FeedbackDialogProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');

  const handleSubmit = () => {
    if (selectedRating > 0) {
      onSubmit(selectedRating, comment.trim());
      // Reset form
      setSelectedRating(0);
      setComment('');
    }
  };

  const handleClose = () => {
    setSelectedRating(0);
    setComment('');
    onClose();
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return "Poor";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Very Good";
      case 5: return "Excellent";
      default: return "";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-6">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-center">Leave Feedback</CardTitle>
              <Text className="text-center text-muted-foreground">
                How was your experience with {serviceName}?
              </Text>
            </CardHeader>

            <CardContent>
              {/* Star Rating */}
              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2">Rating *</Text>
                <View className="flex-row justify-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => setSelectedRating(star)}
                      className="p-2"
                      disabled={loading}
                    >
                      <Text className={`text-3xl ${
                        star <= selectedRating ? 'text-yellow-500' : 'text-gray-300'
                      }`}>
                        ⭐
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {selectedRating > 0 && (
                  <Text className="text-center text-muted-foreground text-sm">
                    {getRatingLabel(selectedRating)}
                  </Text>
                )}
              </View>

              {/* Comment Field */}
              <View className="mb-6">
                <Text className="text-sm font-semibold mb-2">
                  Comment (Optional)
                </Text>
                <TextInput
                  className="border border-border rounded-md p-3 min-h-[100px] text-foreground bg-background"
                  placeholder="Tell us more about your experience..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={comment}
                  onChangeText={setComment}
                  editable={!loading}
                  maxLength={500}
                />
                <Text className="text-xs text-muted-foreground mt-1 text-right">
                  {comment.length}/500
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onPress={handleClose}
                  disabled={loading}
                >
                  <Text>Cancel</Text>
                </Button>
                <Button
                  className="flex-1"
                  onPress={handleSubmit}
                  disabled={selectedRating === 0 || loading}
                >
                  <Text>{loading ? 'Submitting...' : 'Submit'}</Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        </ScrollView>
      </View>
    </Modal>
  );
}
