import React, { useState } from 'react';
import { View, Modal, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

interface SimpleRatingModalProps {
  visible: boolean;
  serviceName: string;
  onClose: () => void;
  onSubmit: (rating: number) => void;
  loading?: boolean;
}

export function SimpleRatingModal({
  visible,
  serviceName,
  onClose,
  onSubmit,
  loading = false
}: SimpleRatingModalProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0);

  const handleSubmit = () => {
    if (selectedRating > 0) {
      onSubmit(selectedRating);
      setSelectedRating(0);
    }
  };

  const handleClose = () => {
    setSelectedRating(0);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center">Rate Service</CardTitle>
            <Text className="text-center text-muted-foreground">
              How was your experience with {serviceName}?
            </Text>
          </CardHeader>

          <CardContent>
            {/* Star Rating */}
            <View className="flex-row justify-center mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setSelectedRating(star)}
                  className="p-2"
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
              <Text className="text-center text-muted-foreground mb-4">
                {selectedRating === 1 && "Poor"}
                {selectedRating === 2 && "Fair"}
                {selectedRating === 3 && "Good"}
                {selectedRating === 4 && "Very Good"}
                {selectedRating === 5 && "Excellent"}
              </Text>
            )}

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
      </View>
    </Modal>
  );
}