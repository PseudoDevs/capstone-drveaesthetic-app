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



export default function ServicesScreen() {
  const { user: authUser, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
  const [services, setServices] = React.useState<ClinicService[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [filteredServices, setFilteredServices] = React.useState<ClinicService[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('=== SERVICES LOADING PROCESS ===');
      console.log('Auth context user:', authUser);
      console.log('Is authenticated:', isAuthenticated);

      // Check authentication first
      if (!isAuthenticated || !authUser) {
        console.log('❌ Not authenticated, redirecting to login');
        router.replace('/login');
        return;
      }

      // Ensure user is authenticated and token is set
      const token = await AuthStorage.getToken();
      if (!token) {
        console.log('❌ No token found, redirecting to login');
        router.replace('/login');
        return;
      }

      // Set token in API client to ensure requests are authenticated
      const { AuthService } = await import('~/lib/api');
      AuthService.setToken(token);

      console.log('=== LOADING SERVICES AND CATEGORIES ===');
      console.log('Auth token available:', token ? 'Yes' : 'No');
      console.log('Token preview:', token.substring(0, 20) + '...');
      console.log('User ID:', authUser?.id || authUser?.data?.id);
      console.log('=======================================');

      // Load services and categories separately to isolate 403 errors
      console.log('🔄 Loading services...');
      const servicesResponse = await ClinicServiceApi.getServices();
      console.log('✅ Services loaded successfully');

      console.log('🔄 Loading categories...');
      let categoriesResponse;
      try {
        categoriesResponse = await CategoryService.getCategories();
        console.log('✅ Categories loaded successfully');
      } catch (categoriesError: any) {
        console.error('❌ Categories failed with error:', categoriesError);
        console.error('Categories error status:', categoriesError.response?.status);
        console.error('Categories error message:', categoriesError.message);
        // Set empty array if categories fail
        categoriesResponse = [];
      }

      console.log('=== API RESPONSES ===');
      console.log('Services response:', servicesResponse);
      console.log('Categories response:', categoriesResponse);
      console.log('====================');

      setServices(servicesResponse.data || []);
      setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse.data || categoriesResponse || []));
    } catch (error: any) {
      console.error('Failed to load data:', error);
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

  return (
    <View className="flex-1 bg-secondary/30">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-12 pb-6">
          <Text className="text-3xl font-bold text-foreground mb-4">Our Services</Text>

          {/* Search */}
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="mb-4"
          />

          {/* Category Filter Dropdown */}
          {!isLoading && (
            <View className="mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <View className="flex-row items-center justify-between p-3 border border-border rounded-md bg-background">
                    <Text className="text-foreground font-medium">
                      {selectedCategoryId === null 
                        ? 'All Categories' 
                        : categories?.find(cat => cat.id === selectedCategoryId)?.category_name || 'Select Category'
                      }
                    </Text>
                    <ChevronDown size={16} className="text-muted-foreground ml-2" />
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem
                    onPress={() => setSelectedCategoryId(null)}
                    className={selectedCategoryId === null ? "bg-accent" : ""}
                  >
                    <Text className={selectedCategoryId === null ? "text-accent-foreground font-medium" : "text-foreground"}>
                      All Categories
                    </Text>
                  </DropdownMenuItem>
                  {categories && categories.length > 0 && categories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onPress={() => setSelectedCategoryId(category.id)}
                      className={selectedCategoryId === category.id ? "bg-accent" : ""}
                    >
                      <Text className={selectedCategoryId === category.id ? "text-accent-foreground font-medium" : "text-foreground"}>
                        {category.category_name}
                      </Text>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
            <Text className="text-lg font-semibold text-foreground mb-4">
              {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
            </Text>

            <View className="gap-3">
              {filteredServices.map((service) => (
                <Card key={service.id} className="overflow-hidden">
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

                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-xs text-muted-foreground">
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          📅 {service.appointments_count} bookings
                        </Text>
                      </View>

                      <View className="flex-row justify-between items-end">
                        <View>
                          <Text className="text-xl font-bold text-primary">
                            {new Intl.NumberFormat('en-PH', {
                              style: 'currency',
                              currency: 'PHP',
                            }).format(service.price)}
                          </Text>
                          <Text className="text-sm text-muted-foreground">
                            {service.duration} mins
                          </Text>
                        </View>

                        <AppointmentFormModal
                          service={service}
                          onSuccess={handleBookService}
                          trigger={
                            <Button
                              size="sm"
                              disabled={service.status !== 'ACTIVE'}
                            >
                              <Text>{service.status === 'ACTIVE' ? 'Book Now' : 'Unavailable'}</Text>
                            </Button>
                          }
                        />
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </View>

            {filteredServices.length === 0 && (
              <View className="items-center py-12">
                <Text className="text-muted-foreground text-center">
                  No services found matching your criteria.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}