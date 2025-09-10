import * as React from 'react';
import { View, ScrollView, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { BottomNavigation } from '~/components/BottomNavigation';
import { AppointmentFormModal } from '~/components/AppointmentFormModal';
import { AuthStorage, User, ClinicServiceApi, ClinicService } from '~/lib/api';



export default function HomeScreen() {
  const [user, setUser] = React.useState<User | null>(null);
  const [services, setServices] = React.useState<ClinicService[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingServices, setIsLoadingServices] = React.useState(true);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Ensure user is authenticated and token is set
        const token = await AuthStorage.getToken();
        if (!token) {
          router.replace('/login');
          return;
        }

        // Set token in API client to ensure requests are authenticated
        const { AuthService } = await import('~/lib/api');
        AuthService.setToken(token);

        // Load user data
        const userData = await AuthStorage.getUser();
        setUser(userData);

        // Load services
        setIsLoadingServices(true);
        const servicesResponse = await ClinicServiceApi.getServices();
        console.log('=== HOME SERVICES DATA ===');
        console.log('Services loaded:', servicesResponse);
        console.log('=========================');
        setServices(servicesResponse.data || []);
      } catch (error: any) {
        console.error('Failed to load data:', error);
        if (error.response?.status === 401) {
          await AuthStorage.clearAll();
          router.replace('/login');
          return;
        }
      } finally {
        setIsLoading(false);
        setIsLoadingServices(false);
      }
    };

    loadData();
  }, []);

  const handleServicePress = (service: ClinicService) => {
    // Navigate to service details or booking
    console.log('Selected service:', service);
  };

  const handleViewAllServices = () => {
    router.push('/services');
  };

  const handleBookNow = () => {
    // Navigate to services page to book
    router.push('/services');
  };

  const handleAppointmentBooked = async () => {
    // Refresh services data after booking
    try {
      const token = await AuthStorage.getToken();
      if (token) {
        const { AuthService } = await import('~/lib/api');
        AuthService.setToken(token);
        const servicesResponse = await ClinicServiceApi.getServices();
        setServices(servicesResponse.data || []);
      }
    } catch (error) {
      console.error('Failed to refresh services:', error);
    }
  };

  return (
    <View className="flex-1 bg-secondary/30">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Welcome Banner */}
        <View className="bg-primary px-6 pt-12 pb-8">
          <View className="mb-4">
            <Text className="text-primary-foreground text-lg font-medium">
              Welcome back,
            </Text>
            <Text className="text-primary-foreground text-3xl font-bold">
              {user?.name || 'User'}! ✨
            </Text>
          </View>

          <Text className="text-primary-foreground/90 text-base mb-6">
            Ready to treat yourself? Discover our premium beauty and wellness services.
          </Text>

          <Button
            variant="secondary"
            className="self-start"
            onPress={handleBookNow}
          >
            <Text>Book Appointment</Text>
          </Button>
        </View>

        {/* Quick Stats */}
        <View className="px-6 -mt-6 mb-6">
          <Card>
            <CardContent className="flex-row justify-around py-4">
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">{services.length}</Text>
                <Text className="text-muted-foreground text-sm">Services</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">4.8</Text>
                <Text className="text-muted-foreground text-sm">Rating</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">150+</Text>
                <Text className="text-muted-foreground text-sm">Happy Clients</Text>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Services Section */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold text-foreground">Popular Services</Text>
            <Pressable onPress={handleViewAllServices}>
              <Text className="text-primary font-medium">View All</Text>
            </Pressable>
          </View>

          <View className="gap-3">
            {isLoadingServices ? (
              <Card>
                <CardContent className="py-8">
                  <Text className="text-center text-muted-foreground">Loading services...</Text>
                </CardContent>
              </Card>
            ) : services.length > 0 ? (
              services.slice(0, 4).map((service) => (
                <Pressable key={service.id} onPress={() => handleServicePress(service)}>
                  <Card className="overflow-hidden">
                    <View className="flex-row">

                      {/* Service Details */}
                      <View className="flex-1 p-4">
                        <View className="flex-row justify-between items-start mb-2">
                          <Text className="text-lg font-semibold text-foreground flex-1 pr-2">
                            {service.service_name}
                          </Text>
                          <Badge variant="secondary">
                            <Text className="text-xs">{service.category.category_name}</Text>
                          </Badge>
                        </View>

                        <Text className="text-sm text-muted-foreground mb-3 leading-5">
                          {service.description
                            ? service.description.split(' ').slice(0, 10).join(' ') + (service.description.split(' ').length > 10 ? '...' : '')
                            : 'Professional service'}
                        </Text>

                        <View className="flex-row justify-between items-center">
                          <View>
                            <Text className="text-xl font-bold text-primary">
                              ₱{service.price.toLocaleString()}
                            </Text>
                            <Text className="text-sm text-muted-foreground">
                              {service.duration}
                            </Text>
                          </View>

                          <View className="items-end">
                            <Text className="text-sm text-muted-foreground">
                              {service.status === 'ACTIVE' ? '✅ Available' : '⏳ Coming Soon'}
                            </Text>
                            <AppointmentFormModal
                              service={service}
                              onSuccess={handleAppointmentBooked}
                              trigger={
                                <Button size="sm" className="mt-1" disabled={service.status !== 'ACTIVE'}>
                                  <Text>Book</Text>
                                </Button>
                              }
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              ))
            ) : (
              <Card>
                <CardContent className="py-8">
                  <Text className="text-center text-muted-foreground">No services available</Text>
                </CardContent>
              </Card>
            )}
          </View>
        </View>

        {/* Recent Activity */}
        <View
          className="px-6"
          style={{ paddingBottom: Math.max(insets.bottom + 100, 120) }}
        >
          <Text className="text-2xl font-bold text-foreground mb-4">Recent Activity</Text>

          <Card>
            <CardHeader>
              <CardTitle>Last Appointment</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-muted-foreground mb-2">Classic Facial Treatment</Text>
              <Text className="text-sm text-muted-foreground">March 15, 2024 • Completed</Text>
              <Button variant="outline" size="sm" className="mt-3 self-start">
                <Text>Book Again</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}