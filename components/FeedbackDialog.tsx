import React, { useState } from 'react';
import { View, Modal, Pressable, TextInput, ScrollView, Dimensions } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';

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
  
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

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
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-gray-50">
        {/* Enhanced Header */}
        <View className="bg-white border-b border-gray-100 shadow-sm">
          <View className="flex-row items-center justify-between px-6 py-4">
            <Pressable 
              onPress={handleClose}
              className="px-3 py-2 rounded-lg bg-gray-100"
              disabled={loading}
            >
              <Text className="text-gray-600 font-medium">Cancel</Text>
            </Pressable>
            <View className="items-center">
              <Text className="text-xl font-bold text-gray-900">Leave Feedback</Text>
              <Text className="text-xs text-gray-500 mt-1">Share your experience</Text>
            </View>
            <Pressable 
              onPress={handleSubmit}
              disabled={selectedRating === 0 || loading}
              className={`px-4 py-2 rounded-lg ${selectedRating === 0 || loading ? 'bg-gray-200' : 'bg-primary'}`}
            >
              <Text className={`font-semibold ${selectedRating === 0 || loading ? 'text-gray-400' : 'text-white'}`}>
                {loading ? 'Submitting...' : 'Submit'}
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
                  How was your experience?
                </Text>
                <Text className="text-gray-600 text-center">
                  {serviceName}
                </Text>
              </View>
            </View>

            {/* Form Fields */}
            <View className="space-y-6">
              {/* Rating Section */}
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <Text className="text-sm font-semibold text-gray-800 mb-4">Rating *</Text>
                
                {/* Stars */}
                <View className="flex-row justify-center mb-4">
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

                {/* Rating Label */}
                {selectedRating > 0 && (
                  <View className="items-center">
                    <Text className="text-primary font-semibold text-lg">
                      {getRatingLabel(selectedRating)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Comment Section */}
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <Text className="text-sm font-semibold text-gray-800 mb-2">Comment (Optional)</Text>
                <View className="bg-gray-50 rounded-lg border border-gray-200">
                  <TextInput
                    className="p-4 text-gray-800 text-base min-h-[100px]"
                    placeholder="Tell us more about your experience..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={comment}
                    onChangeText={setComment}
                    editable={!loading}
                    maxLength={500}
                    style={{ fontSize: 16 }}
                  />
                </View>
                
                <View className="flex-row justify-between items-center mt-2">
                  <Text className="text-xs text-gray-500">
                    Share your detailed experience
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {comment.length}/500
                  </Text>
                </View>
              </View>
            </View>

            {/* Submit Button (Alternative) */}
            <View className="mt-8">
              <Button
                className={`h-14 rounded-xl ${selectedRating === 0 || loading ? 'bg-gray-300' : 'bg-primary'}`}
                onPress={handleSubmit}
                disabled={selectedRating === 0 || loading}
              >
                <Text className={`text-lg font-semibold ${selectedRating === 0 || loading ? 'text-gray-500' : 'text-white'}`}>
                  {loading ? 'Submitting Feedback...' : 'Submit Feedback'}
                </Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
