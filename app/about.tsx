import * as React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { BottomNavigation } from '~/components/BottomNavigation';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  
  const handleContactPress = () => {
    console.log('Contact pressed');
  };

  return (
    <View className="flex-1 bg-secondary/30">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-12 pb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">About Our App</Text>
          <Text className="text-muted-foreground text-base">
            Your beauty and wellness companion
          </Text>
        </View>

        {/* App Info */}
        <View className="px-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>✨ Dr. Ve Aesthetic App</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Text className="text-foreground leading-6">
                Welcome to your one-stop destination for all beauty and wellness needs. 
                Our app connects you with premium beauty services, making it easier than 
                ever to book appointments and maintain your self-care routine.
              </Text>
              
              <View className="space-y-2">
                <Text className="font-semibold text-foreground">🎯 Our Mission</Text>
                <Text className="text-muted-foreground">
                  To make beauty and wellness services accessible, convenient, and 
                  affordable for everyone.
                </Text>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Features */}
        <View className="px-6 mb-6">
          <Text className="text-2xl font-bold text-foreground mb-4">Features</Text>
          
          <View className="gap-3">
            <Card>
              <CardContent className="flex-row items-center py-4">
                <Text className="text-2xl mr-4">📅</Text>
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">Easy Booking</Text>
                  <Text className="text-sm text-muted-foreground">
                    Book appointments with just a few taps
                  </Text>
                </View>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex-row items-center py-4">
                <Text className="text-2xl mr-4">⭐</Text>
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">Quality Services</Text>
                  <Text className="text-sm text-muted-foreground">
                    Premium beauty and wellness treatments
                  </Text>
                </View>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex-row items-center py-4">
                <Text className="text-2xl mr-4">💳</Text>
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">Secure Payments</Text>
                  <Text className="text-sm text-muted-foreground">
                    Safe and secure payment processing
                  </Text>
                </View>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex-row items-center py-4">
                <Text className="text-2xl mr-4">🔔</Text>
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">Smart Reminders</Text>
                  <Text className="text-sm text-muted-foreground">
                    Never miss an appointment with notifications
                  </Text>
                </View>
              </CardContent>
            </Card>
          </View>
        </View>

        {/* Contact Info */}
        <View 
          className="px-6"
          style={{ paddingBottom: Math.max(insets.bottom + 100, 120) }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="font-semibold text-foreground mb-1">📧 Email</Text>
                <Text className="text-muted-foreground">support@drveaestheticclinic.online</Text>
              </View>
              
              <View>
                <Text className="font-semibold text-foreground mb-1">📱 Phone</Text>
                <Text className="text-muted-foreground">+63 (912) 345-9083</Text>
              </View>
              
              <View>
                <Text className="font-semibold text-foreground mb-1">⏰ Support Hours</Text>
                <Text className="text-muted-foreground">Mon-Fri: 9:00 AM - 6:00 PM</Text>
              </View>

              <Button onPress={handleContactPress} className="mt-4">
                <Text>Contact Support</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
      
      <BottomNavigation />
    </View>
  );
}