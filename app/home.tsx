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
import { useAuth } from '~/lib/context/AuthContext';
import { Sparkles, Heart, Zap, Star, Users } from 'lucide-react-native';



export default function HomeScreen() {
  const { user: authUser, isAuthenticated } = useAuth();
  const [user, setUser] = React.useState<User | null>(null);
  const [services, setServices] = React.useState<ClinicService[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingServices, setIsLoadingServices] = React.useState(true);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = React.useState<ClinicService | null>(null);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    const loadData = async () => {
      try {

        // Check authentication first
        if (!isAuthenticated || !authUser) {
          router.replace('/login');
          return;
        }

        // Ensure user is authenticated and token is set
        const token = await AuthStorage.getToken();
        if (!token) {
          router.replace('/login');
          return;
        }

        // Set token in API client to ensure requests are authenticated
        const { AuthService } = await import('~/lib/api');
        AuthService.setToken(token);

        // Use auth context user data
        setUser(authUser);

        // Load services
        setIsLoadingServices(true);
        const servicesResponse = await ClinicServiceApi.getServices();
        setServices(servicesResponse.data || []);
      } catch (error: any) {
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

    // Only load data when we have authentication
    if (isAuthenticated && authUser) {
      loadData();
    }
  }, [authUser, isAuthenticated]);


  const handleServicePress = (service: ClinicService) => {
    // Navigate to service details or booking
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
    }
  };

  const getServiceIcon = (service: ClinicService) => {
    const serviceName = service.service_name.toLowerCase();
    const categoryName = service.category.category_name.toLowerCase();
    
    if (serviceName.includes('facial') || categoryName.includes('facial')) {
      return <Heart size={32} className="text-gray-600" />;
    } else if (serviceName.includes('massage') || categoryName.includes('massage')) {
      return <Zap size={32} className="text-gray-600" />;
    } else if (serviceName.includes('skin') || categoryName.includes('skin')) {
      return <Sparkles size={32} className="text-gray-600" />;
    } else {
      return <Sparkles size={32} className="text-gray-600" />;
    }
  };

  return (
    <View className="flex-1 bg-secondary/30">
      {/* Header with Clinic Logo */}
      <View className="bg-white px-6 py-4 shadow-sm" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-10 h-10 items-center justify-center mr-3">
              <Image 
                source={require('~/assets/images/clinic-logo.jpg')}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text className="text-gray-800 text-lg font-bold">Dr. Ve Aesthetic</Text>
              <Text className="text-gray-500 text-xs">Professional Beauty Care</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Section - Website Style */}
        <View className="relative h-80">
          {/* Background Image */}
          <View className="absolute inset-0 w-full h-full">
            <Image 
              source={{ 
                uri: 'https://media.istockphoto.com/id/1366228042/photo/facial-aesthetics-surgery-treatment.jpg?s=612x612&w=0&k=20&c=7zOyHVSkG1FrdqUqG1jXWWdPquSKXotFbvujX1SwPyw=',
                cache: 'force-cache'
              }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
          
          {/* Dark Overlay */}
          <View className="absolute inset-0 bg-black/50" />
          
          {/* Content */}
          <View className="absolute bottom-8 left-6 right-6">
            {/* Welcome Message */}
            <Text className="text-white text-3xl font-bold mb-2">
              Welcome back,
            </Text>
            <Text className="text-white text-3xl font-bold mb-2">
              <Text className="text-primary">Beautiful</Text>!
            </Text>
            
            <Text className="text-white/90 text-base mb-6 leading-6">
              Ready to treat yourself? Discover our premium beauty and wellness services designed just for you.
            </Text>
            
            <Button 
              className="bg-primary self-start shadow-lg"
              onPress={handleBookNow}
            >
              <Text className="text-white font-semibold">Book Appointment</Text>
            </Button>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="px-6 -mt-6 mb-6">
          <Card className="bg-white border-0 shadow-lg rounded-2xl">
            <CardContent className="flex-row justify-around py-6">
              <View className="items-center">
                <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mb-2">
                  <Sparkles size={24} className="text-gray-600" />
                </View>
                <Text className="text-2xl font-bold text-primary mb-1">{services.length}</Text>
                <Text className="text-gray-600 text-sm font-medium">Services</Text>
              </View>
              <View className="items-center">
                <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mb-2">
                  <Star size={24} className="text-gray-600" />
                </View>
                <Text className="text-2xl font-bold text-primary mb-1">4.8</Text>
                <Text className="text-gray-600 text-sm font-medium">Rating</Text>
              </View>
              <View className="items-center">
                <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mb-2">
                  <Users size={24} className="text-gray-600" />
                </View>
                <Text className="text-2xl font-bold text-primary mb-1">150+</Text>
                <Text className="text-gray-600 text-sm font-medium">Happy Clients</Text>
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

          {/* Service Categories Filter */}
          <View className="mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              <View className="flex-row gap-2">
                <View className="bg-primary px-3 py-2 rounded-full">
                  <Text className="text-white text-xs font-medium">All</Text>
                </View>
                {services.length > 0 ? (
                  [...new Set(services.map(service => service.category.category_name))].slice(0, 4).map((category, index) => (
                    <View key={index} className="bg-white px-3 py-2 rounded-full border border-primary">
                      <Text className="text-primary text-xs font-medium">{category}</Text>
                    </View>
                  ))
                ) : (
                  <View className="bg-white px-3 py-2 rounded-full border border-primary">
                    <Text className="text-primary text-xs font-medium">Loading...</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>

          <View className="gap-3">
            {isLoadingServices ? (
              <Card>
                <CardContent className="py-8">
                  <Text className="text-center text-muted-foreground">Loading services...</Text>
                </CardContent>
              </Card>
            ) : services.length > 0 ? (
              services.slice(0, 3).map((service) => (
                <Pressable key={service.id} onPress={() => handleServicePress(service)}>
                  <Card className="overflow-hidden border-0 shadow-md bg-white">
                    <View className="flex-row p-4">
                      {/* Service Icon */}
                      <View className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 items-center justify-center rounded-xl border border-primary/20 mr-4">
                        {getServiceIcon(service)}
                      </View>

                      {/* Service Details */}
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-800 mb-1">
                          {service.service_name}
                        </Text>
                        
                        <Badge variant="secondary" className="bg-primary/10 border border-primary/20 self-start mb-2">
                          <Text className="text-xs text-primary font-medium">{service.category.category_name}</Text>
                        </Badge>

                        <Text className="text-sm text-gray-600 mb-3 leading-5">
                          {service.description
                            ? service.description.split(' ').slice(0, 10).join(' ') + (service.description.split(' ').length > 10 ? '...' : '')
                            : 'Professional aesthetic service'}
                        </Text>

                        <View className="flex-row justify-between items-center">
                          <View>
                            <Text className="text-lg font-bold text-primary">
                              ₱{service.price.toLocaleString()}
                            </Text>
                            <Text className="text-xs text-gray-500">
                              {service.duration} mins
                            </Text>
                          </View>

                          <Button 
                            size="sm" 
                            className="bg-primary shadow-sm" 
                            disabled={service.status !== 'ACTIVE'}
                            onPress={() => setSelectedServiceForBooking(service)}
                          >
                            <Text className="text-white font-medium text-xs">
                              {service.status === 'ACTIVE' ? 'Book' : 'Soon'}
                            </Text>
                          </Button>
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

      {/* Appointment Booking Modal */}
      <AppointmentFormModal
        visible={selectedServiceForBooking !== null}
        service={selectedServiceForBooking}
        onClose={() => setSelectedServiceForBooking(null)}
        onSuccess={(appointment) => {
          setSelectedServiceForBooking(null);
          handleAppointmentBooked(appointment);
        }}
      />
    </View>
  );
}