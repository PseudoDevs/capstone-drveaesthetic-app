import * as React from 'react';
import { View, ScrollView, Image, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { ChevronDown } from '~/lib/icons/ChevronDown';
import { BottomNavigation } from '~/components/BottomNavigation';
import { AppointmentFormModal } from '~/components/AppointmentFormModal';
import { ClinicServiceApi, CategoryService, ClinicService, Category, AuthStorage } from '~/lib/api';
import { useAuth } from '~/lib/context/AuthContext';
import { router } from 'expo-router';
import { Sparkles, Heart, Zap } from 'lucide-react-native';



export default function ServicesScreen() {
  const { user: authUser, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
  const [services, setServices] = React.useState<ClinicService[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [filteredServices, setFilteredServices] = React.useState<ClinicService[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = React.useState<ClinicService | null>(null);
  const insets = useSafeAreaInsets();

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

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


      // Load services and categories separately to isolate 403 errors
      const servicesResponse = await ClinicServiceApi.getServices();

      let categoriesResponse: any;
      try {
        categoriesResponse = await CategoryService.getCategories();
      } catch (categoriesError: any) {
        // Set empty array if categories fail
        categoriesResponse = [];
      }


      setServices(servicesResponse.data || []);
      const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse.data || categoriesResponse || []);
      console.log('Categories loaded:', categoriesData);
      setCategories(categoriesData);
    } catch (error: any) {
      if (error.response?.status === 401) {
        await AuthStorage.clearAll();
        router.replace('/login');
        return;
      }
      setError('Failed to load services. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    // Only load data when we have authentication
    if (isAuthenticated && authUser) {
      loadData();
    }
  }, [authUser, isAuthenticated]);

  React.useEffect(() => {
    let filtered = services;

    // Filter by category
    if (selectedCategoryId !== null) {
      filtered = filtered.filter(service => service.category.id === selectedCategoryId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(service =>
        service.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredServices(filtered);
  }, [searchQuery, selectedCategoryId, services, categories]);

  const handleBookService = () => {
    // Refresh the services list after booking
    loadData();
  };

  const getServiceIcon = (service: ClinicService) => {
    const serviceName = service.service_name.toLowerCase();
    const categoryName = service.category.category_name.toLowerCase();
    
    if (serviceName.includes('facial') || categoryName.includes('facial')) {
      return <Heart size={32} className="text-primary" />;
    } else if (serviceName.includes('massage') || categoryName.includes('massage')) {
      return <Zap size={32} className="text-primary" />;
    } else if (serviceName.includes('skin') || categoryName.includes('skin')) {
      return <Sparkles size={32} className="text-primary" />;
    } else {
      return <Sparkles size={32} className="text-primary" />;
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
                source={{ 
                  uri: 'https://scontent.fmnl4-7.fna.fbcdn.net/v/t39.30808-6/418729090_122097326798182940_868500779979598848_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeExtMuvkhE4ITBCXKkbJRRmnZbZoGt7CtWdltmga3sK1V49cOQhA3jFasNBp_355lXq9Z0SxpMfYO43nSvwjgEr&_nc_ohc=sRIUyy60tlQQ7kNvwGcUnnr&_nc_oc=AdnLSrTbOQ_VqB5iAS-lBLvUtMQxUOFutFqRPmhNlYIwvbgB0ZttP2sah71JUpcn8aIdm39tvfnVl_hRldYr2rF4&_nc_zt=23&_nc_ht=scontent.fmnl4-7.fna&_nc_gid=71Jv1Ip9VUfuxJswvEBV2g&oh=00_AfcFGjvy1UU67Wh4qD4cUP0d_bUGB7dFKphEvhc_fkh1GQ&oe=68EEF994',
                  cache: 'force-cache'
                }}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text className="text-gray-800 text-lg font-bold">Dr. Ve Aesthetic</Text>
              <Text className="text-gray-500 text-xs">Our Services</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-8 pb-6">
          <Text className="text-3xl font-bold text-foreground mb-6">Our Services</Text>

          {/* Search */}
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="mb-4"
          />

          {/* Category Filter Section */}
          {!isLoading && (
            <View className="mb-8">
              <View className="flex-row justify-between items-center mb-6">
                <View>
                  <Text className="text-xl font-bold text-gray-800">Browse by Category</Text>
                  <Text className="text-sm text-gray-500 mt-1">Choose your preferred service type</Text>
                </View>
                <View className="bg-primary/10 px-3 py-1 rounded-full">
                  <Text className="text-primary text-xs font-semibold">{categories.length} categories</Text>
                </View>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                <View className="flex-row gap-2">
                  {/* All Categories Button */}
                  <Pressable 
                    onPress={() => setSelectedCategoryId(null)}
                    className={`px-4 py-2 rounded-full border ${
                      selectedCategoryId === null 
                        ? 'bg-primary border-primary' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${
                      selectedCategoryId === null ? 'text-white' : 'text-gray-700'
                    }`}>
                      All Services
                    </Text>
                  </Pressable>

                  {/* Category Buttons */}
                  {categories && categories.length > 0 && categories.map((category) => {
                    // Handle both possible field names: 'name' or 'category_name'
                    const categoryName = category.name;

                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => setSelectedCategoryId(category.id)}
                        className={`px-4 py-2 rounded-full border ${
                          selectedCategoryId === category.id 
                            ? 'bg-primary border-primary' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Text className={`text-sm font-medium ${
                          selectedCategoryId === category.id ? 'text-white' : 'text-gray-700'
                        }`}>
                          {categoryName || 'Unnamed Category'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Loading State */}
        {isLoading && (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" />
            <Text className="text-muted-foreground mt-4">Loading services...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View className="px-6 items-center py-12">
            <Text className="text-6xl mb-4">⚠️</Text>
            <Text className="text-lg font-semibold text-foreground mb-2">
              Something went wrong
            </Text>
            <Text className="text-muted-foreground text-center mb-6">
              {error}
            </Text>
            <Button onPress={loadData}>
              <Text>Try Again</Text>
            </Button>
          </View>
        )}

        {/* Services List */}
        {!isLoading && !error && (
          <View
            className="px-6"
            style={{ paddingBottom: Math.max(insets.bottom + 100, 120) }}
          >
            {/* Results Header */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center">
                  <Text className="text-xl font-bold text-gray-800">
                    {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
                  </Text>
                  {selectedCategoryId !== null && (
                    <View className="ml-3 px-3 py-1 bg-primary/10 rounded-full">
                      <Text className="text-primary text-sm font-medium">
                        {categories?.find(cat => cat.id === selectedCategoryId)?.name || 'Selected Category'}
                      </Text>
                    </View>
                  )}
                </View>
                {(searchQuery.trim() || selectedCategoryId !== null) && (
                  <Pressable 
                    onPress={() => {
                      setSearchQuery('');
                      setSelectedCategoryId(null);
                    }}
                    className="px-3 py-1 bg-gray-100 rounded-full"
                  >
                    <Text className="text-gray-600 text-sm font-medium">Clear Filters</Text>
                  </Pressable>
                )}
              </View>
              {(searchQuery.trim() || selectedCategoryId !== null) && (
                <Text className="text-sm text-gray-500">
                  {searchQuery.trim() && selectedCategoryId !== null 
                    ? `Searching for "${searchQuery}" in ${categories?.find(cat => cat.id === selectedCategoryId)?.name || 'Selected Category'}`
                    : searchQuery.trim() 
                      ? `Searching for "${searchQuery}"`
                      : `Showing ${categories?.find(cat => cat.id === selectedCategoryId)?.name || 'Selected Category'} services`
                  }
                </Text>
              )}
            </View>

            {/* Services Grid */}
            <View className="gap-4">
              {filteredServices.map((service) => (
                <Card key={service.id} className="overflow-hidden border-0 shadow-md bg-white">
                  <View className="p-5">
                    <View className="flex-row">
                      {/* Service Icon */}
                      <View className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 items-center justify-center rounded-xl border border-primary/20 mr-4">
                        {getServiceIcon(service)}
                      </View>

                      {/* Service Details */}
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-800 mb-2">
                          {service.service_name}
                        </Text>
                        
                        <Badge variant="secondary" className="bg-primary/10 border border-primary/20 self-start mb-3">
                          <Text className="text-xs text-primary font-medium">{service.category.category_name}</Text>
                        </Badge>

                        <Text className="text-sm text-gray-600 mb-4 leading-5">
                          {service.description
                            ? service.description.split(' ').slice(0, 15).join(' ') + (service.description.split(' ').length > 15 ? '...' : '')
                            : 'Professional aesthetic service'}
                        </Text>

                        {/* Service Stats */}
                        <View className="flex-row justify-between items-center mb-4">
                          <View className="flex-row items-center">
                            <Text className="text-xs text-gray-500 mr-4">
                              📅 {service.appointments_count} bookings
                            </Text>
                            <Text className="text-xs text-gray-500">
                              ⏱️ {service.duration} mins
                            </Text>
                          </View>
                          <Text className="text-xs text-gray-500">
                            {service.status === 'ACTIVE' ? '✅ Available' : '⏳ Coming Soon'}
                          </Text>
                        </View>

                        {/* Price and Book Button */}
                        <View className="flex-row justify-between items-center">
                          <View>
                            <Text className="text-xl font-bold text-primary">
                              {new Intl.NumberFormat('en-PH', {
                                style: 'currency',
                                currency: 'PHP',
                              }).format(service.price)}
                            </Text>
                          </View>

                          <Button
                            size="sm"
                            className="bg-primary shadow-sm"
                            disabled={service.status !== 'ACTIVE'}
                            onPress={() => setSelectedServiceForBooking(service)}
                          >
                            <Text className="text-white font-medium text-sm">
                              {service.status === 'ACTIVE' ? 'Book Now' : 'Unavailable'}
                            </Text>
                          </Button>
                        </View>
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </View>

            {/* Empty State - Show Loading */}
            {filteredServices.length === 0 && (
              <View className="flex-1 justify-center items-center py-12">
                <ActivityIndicator size="large" />
                <Text className="text-muted-foreground mt-4">Loading services...</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Appointment Booking Modal */}
      <AppointmentFormModal
        service={selectedServiceForBooking}
        visible={selectedServiceForBooking !== null}
        onClose={() => setSelectedServiceForBooking(null)}
        onSuccess={() => {
          setSelectedServiceForBooking(null);
          // Optionally refresh the services list
          loadData();
        }}
      />

      <BottomNavigation />
    </View>
  );
}