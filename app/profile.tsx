import * as React from 'react';
import { View, ScrollView, Pressable, Alert, Platform, TouchableOpacity, RefreshControl } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Separator } from '~/components/ui/separator';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog';
import { BottomNavigation } from '~/components/BottomNavigation';
import { AuthService, AuthStorage, User, ProfileService } from '~/lib/api';
import { useAuth } from '~/lib/context/AuthContext';
import { useRealTimeRefresh } from '~/lib/hooks/useRealTimeRefresh';
import { RefreshButton } from '~/components/RefreshButton';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { logout, user: authUser, isAuthenticated, refreshUser, updateUser } = useAuth();

  // Edit profile state
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editEmail, setEditEmail] = React.useState('');
  const [editPhone, setEditPhone] = React.useState('');
  const [editAddress, setEditAddress] = React.useState('');
  const [editDateOfBirth, setEditDateOfBirth] = React.useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Change password state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);

  // Real-time refresh using reusable hook
  const {
    isRefreshing,
    formatLastRefreshTime,
    refresh: refreshProfileData
  } = useRealTimeRefresh({
    onRefresh: async () => {
      // Refresh user data from API without navigation
      await refreshUser();
      // The auth context will update and trigger useEffect to update local state
      // No navigation needed - just data refresh
    }
  });

  React.useEffect(() => {
    // Simply use auth context data - let SessionAwareRouter handle navigation
    if (authUser && isAuthenticated) {
      setUser(authUser);
      setIsLoading(false);
    } else if (!isAuthenticated) {
      setUser(null);
      setIsLoading(false);
    }
  }, [authUser, isAuthenticated]);

  // Sync local user state with AuthContext when it updates
  React.useEffect(() => {
    if (authUser && isAuthenticated) {
      setUser(authUser);
    }
  }, [authUser]);

  const handleEditProfile = () => {
    if (user) {

      // Handle both nested and direct user data structures
      const userData = (user as any).data || user;


      setEditName(userData.name || '');
      setEditEmail(userData.email || '');
      setEditPhone(userData.phone || '');
      setEditAddress(userData.address || '');
      // Handle date_of_birth - convert string to Date object
      if (userData.date_of_birth) {
        setEditDateOfBirth(new Date(userData.date_of_birth));
      } else {
        setEditDateOfBirth(null);
      }
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Error', 'Please fill in both name and email fields');
      return;
    }

    setIsUpdating(true);
    try {

      // Ensure authentication token is set
      const token = await AuthStorage.getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      const { AuthService } = await import('~/lib/api');
      AuthService.setToken(token);

      // Get user ID from current user data
      const userId = (user as any)?.data?.id || user?.id;
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Try to update via API using new profile endpoint
      const updatedUser = await ProfileService.updateProfile(userId, {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() || undefined,
        address: editAddress.trim() || undefined,
        date_of_birth: editDateOfBirth ? editDateOfBirth.toISOString().split('T')[0] : undefined,
      });


      // Ensure we have the user data in the correct format for storage
      const userDataToSave = {
        ...user, // Keep existing structure
        ...((user as any)?.data ? { data: { ...(user as any).data, ...updatedUser } } : updatedUser),
        // Also update direct properties if they exist
        ...updatedUser
      };


      // Update local state and auth context with API response
      setUser(userDataToSave);

      // Update the auth context directly to keep it in sync
      try {
        await updateUser(userDataToSave);
      } catch (updateError) {
        // Fallback to direct storage if auth context update fails
        await AuthStorage.saveUser(userDataToSave);
      }

      setIsEditDialogOpen(false);
      Alert.alert('Success', 'Profile updated successfully!');

      // Trigger real-time refresh to get latest data
      setTimeout(() => {
        refreshProfileData();
      }, 500);

    } catch (error: any) {

      // If API fails, update locally as fallback
      if (error.response?.status === 404 || error.response?.status === 501) {

        // Update local state and storage
        const newUserData = {
          ...user,
          name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim() || user.phone,
          address: editAddress.trim() || user.address,
          date_of_birth: editDateOfBirth ? editDateOfBirth.toISOString().split('T')[0] : user.date_of_birth,
        };
        setUser(newUserData);
        await AuthStorage.saveUser(newUserData);

        setIsEditDialogOpen(false);
        Alert.alert('Success', 'Profile updated locally! (API endpoint not available)');

        // Trigger real-time refresh even for local updates
        setTimeout(() => {
          refreshProfileData();
        }, 500);
      } else {
        Alert.alert('Error', `Failed to update profile: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordDialogOpen(true);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword || !currentPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {

      await ProfileService.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });


      setIsPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully!');

    } catch (error: any) {

      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      Alert.alert(
        'Test Notification',
        'Choose a notification type to test:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'API Test',
            onPress: async () => {
              try {
                await AuthService.sendTestNotification();
                Alert.alert('Success', 'Test notification sent! You should receive it shortly.');
              } catch (error: any) {
                // Only show error for actual API errors, not development fallbacks
                if (!error.message.includes('Development Notification')) {
                  Alert.alert('Note', 'API test failed, but development notification was shown.');
                }
              }
            }
          },
          {
            text: 'Fake Chat',
            onPress: async () => {
              try {
                const chatService = (await import('~/lib/services/ChatPollingService')).default;
                await chatService.simulateNewMessage(
                  'Dr. Ve Clinic',
                  'Hello! This is a fake chat notification for testing purposes. 💬',
                  '1'
                );
                Alert.alert('Success', 'Fake chat notification triggered!');
              } catch (error: any) {
                Alert.alert('Error', 'Failed to trigger fake notification: ' + error.message);
              }
            }
          }
        ]
      );
    } catch (error) {
    }
  };

  const handleHelp = () => {
    Alert.alert('Help & Support', 'Contact us at support@drveaestheticclinic.online or call +63 123 456 7890');
  };

  const handleCheckPollingStatus = async () => {
    try {
      const chatService = (await import('~/lib/services/ChatPollingService')).default;
      const status = chatService.getStatus();

      Alert.alert(
        'Chat Polling Status',
        `Status: ${status.isPolling ? 'Active' : 'Inactive'}\n` +
        `User ID: ${status.userId || 'None'}\n` +
        `Interval: ${status.intervalMs}ms\n` +
        `Messages Tracked: ${status.messagesTracked}\n` +
        `App in Foreground: ${status.isAppInForeground ? 'Yes' : 'No'}`,
        [
          { text: 'OK' },
          {
            text: 'Test Fake Message',
            onPress: async () => {
              await chatService.simulateNewMessage(
                'Test Sender',
                'This is a test message triggered from polling status!',
                '2'
              );
            }
          },
          {
            text: 'Force Check Messages',
            onPress: async () => {
              await chatService.forceCheckMessages();
              Alert.alert('Success', 'Forced message check completed - check console for logs');
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to check polling status: ' + error.message);
    }
  };

  const handleAvatarUpload = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Show options for camera or gallery
      Alert.alert(
        'Select Avatar',
        'Choose how you want to select your avatar',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraPermission.granted) {
                pickImageFromCamera();
              } else {
                Alert.alert('Permission Required', 'Camera permission is required!');
              }
            },
          },
          {
            text: 'Photo Library',
            onPress: () => pickImageFromLibrary(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const pickImageFromCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatarImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatarImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const uploadAvatarImage = async (imageUri: string) => {
    if (!user) return;

    setIsUploadingAvatar(true);
    try {

      // Ensure authentication token is set
      const token = await AuthStorage.getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      AuthService.setToken(token);

      // Get user ID
      const userId = (user as any)?.data?.id || user?.id;
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Upload avatar - Import ProfileService directly to ensure it's available
      const { ProfileService: PS } = await import('~/lib/api');
      const updatedUser = await PS.uploadAvatar(userId, imageUri);


      // Store only the filename from the API response
      const avatarFilename = updatedUser?.avatar;


      // Update local state and auth context with filename only
      const userDataToSave = {
        ...user,
        ...((user as any)?.data ? { data: { ...(user as any).data, ...updatedUser } } : updatedUser),
        // Store filename, not full URL
        avatar: avatarFilename
      };

      setUser(userDataToSave);

      // Update the auth context directly to keep it in sync
      try {
        await updateUser(userDataToSave);
      } catch (updateError) {
        await AuthStorage.saveUser(userDataToSave);
      }

      Alert.alert('Success', 'Avatar updated successfully!');

      // Trigger real-time refresh after avatar update
      setTimeout(() => {
        refreshProfileData();
      }, 500);

    } catch (error: any) {

      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload avatar';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call logout API and clear stored data
              await logout();
              // Real-time state update - no navigation needed
              // The AuthContext will update and trigger re-renders automatically
            } catch (error) {
              // Force logout even if API fails
              await logout();
            }
          },
        },
      ]
    );
  };

  const MenuOption = ({ title, subtitle, onPress, icon }: {
    title: string;
    subtitle?: string;
    onPress: () => void;
    icon: string;
  }) => (
    <Pressable onPress={onPress} className="active:opacity-70">
      <View className="flex-row items-center py-4 px-4">
        <Text className="text-2xl mr-4">{icon}</Text>
        <View className="flex-1">
          <Text className="font-medium text-foreground">{title}</Text>
          {subtitle && (
            <Text className="text-sm text-muted-foreground mt-1">{subtitle}</Text>
          )}
        </View>
        <Text className="text-muted-foreground">›</Text>
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-secondary/30 justify-center items-center">
        <Text className="text-muted-foreground">Loading profile...</Text>
      </View>
    );
  }

  // If not loading but no user data, show error state
  if (!user) {
    return (
      <View className="flex-1 bg-secondary/30 justify-center items-center px-6">
        <Text className="text-6xl mb-4">⚠️</Text>
        <Text className="text-xl font-bold text-foreground mb-2 text-center">
          Unable to Load Profile
        </Text>
        <Text className="text-muted-foreground text-center mb-6">
          We couldn't load your profile information. Please try logging in again.
        </Text>
        <Button
          onPress={async () => {
            await logout();
          }}
          className="mb-4"
        >
          <Text>Go to Login</Text>
        </Button>
        <Button
          variant="outline"
          onPress={async () => {
            setIsLoading(true);
            try {
              // First try to refresh from auth context
              await refreshUser();
              // If successful, the auth context user will be updated and useEffect will trigger
            } catch (error) {
              // Try direct API call as fallback
              try {
                const token = await AuthStorage.getToken();
                if (token) {
                  AuthService.setToken(token);
                  const freshUserData = await AuthService.getCurrentUser();
                  if (freshUserData) {
                    setUser(freshUserData);
                    await AuthStorage.saveUser(freshUserData);
                  }
                }
              } catch (fallbackError) {
              }
            } finally {
              setIsLoading(false);
            }
          }}
        >
          <Text>Try Again</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-secondary/30">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshProfileData}
            colors={['#6366f1']} // Primary color for loading indicator
            tintColor="#6366f1"
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-12 pb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-foreground">Profile</Text>
              {formatLastRefreshTime() && (
                <Text className="text-xs text-muted-foreground mt-1">
                  Last updated: {formatLastRefreshTime()}
                </Text>
              )}
            </View>
            <RefreshButton
              onRefresh={refreshProfileData}
              isRefreshing={isRefreshing}
            />
          </View>
        </View>

        {/* User Info Card */}
        <View className="px-6 mb-6">
          <Card>
            <CardContent className="items-center py-6">
              <TouchableOpacity onPress={handleAvatarUpload} disabled={isUploadingAvatar}>
                <View className="relative">
                  <Avatar className="w-24 h-24 mb-4">
                    <AvatarImage
                      source={{
                        uri: ((user as any)?.data || user)?.avatar
                          ? `https://drveaestheticclinic.online/storage/${((user as any)?.data || user)?.avatar}`
                          : undefined,
                        // Add cache control for better image loading
                        cache: 'reload'
                      }}
                      style={{ borderRadius: 48 }}
                    />
                    <AvatarFallback>
                      <Text className="text-2xl">{((user as any)?.data || user)?.name?.split(' ').map(n => n[0]).join('') || 'U'}</Text>
                    </AvatarFallback>
                  </Avatar>

                  {/* Upload indicator overlay */}
                  {isUploadingAvatar && (
                    <View className="absolute inset-0 bg-black/50 rounded-full items-center justify-center">
                      <Text className="text-white text-sm">📸</Text>
                    </View>
                  )}

                  {/* Camera icon overlay */}
                  <View className="absolute -bottom-2 -right-2 bg-primary rounded-full w-8 h-8 items-center justify-center border-2 border-background">
                    <Text className="text-primary-foreground text-sm">📸</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <Text className="text-2xl font-bold text-foreground mb-1">{((user as any)?.data || user)?.name || 'User'}</Text>
              <Text className="text-muted-foreground mb-2">{((user as any)?.data || user)?.email || 'user@example.com'}</Text>
              {((user as any)?.data || user)?.phone && (
                <Text className="text-sm text-muted-foreground mb-1">📞 {((user as any)?.data || user).phone}</Text>
              )}
              {((user as any)?.data || user)?.date_of_birth && (
                <Text className="text-sm text-muted-foreground mb-1">🎂 {((user as any)?.data || user).date_of_birth}</Text>
              )}
              {((user as any)?.data || user)?.address && (
                <Text className="text-sm text-muted-foreground mb-4">📍 {((user as any)?.data || user).address}</Text>
              )}

              <Button onPress={handleEditProfile} className="bg-primary-gradient">
                <Text>Edit Profile</Text>
              </Button>
            </CardContent>
          </Card>
        </View>

        {/* Stats */}
        <View className="px-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex-row justify-around py-2">
                <View className="items-center">
                  <Text className="text-2xl font-bold text-primary">0</Text>
                  <Text className="text-sm text-muted-foreground">Total Bookings</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-primary">★</Text>
                  <Text className="text-sm text-muted-foreground">Loyalty</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-primary">
                    {user?.created_at ? new Date(user.created_at).getFullYear() : 'New'}
                  </Text>
                  <Text className="text-sm text-muted-foreground">Member Since</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Account Settings */}
        <View className="px-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <MenuOption
                title="Personal Information"
                subtitle={`${user?.name || 'Update your name'} • ${user?.phone || 'Add phone number'}`}
                icon="👤"
                onPress={handleEditProfile}
              />
              <Separator />
              <MenuOption
                title="Change Password"
                subtitle="Update your account password"
                icon="🔒"
                onPress={handleChangePassword}
              />

            </CardContent>
          </Card>
        </View>

        {/* Favorite Services */}
        <View className="px-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Status</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex-row flex-wrap gap-2">
                {user?.phone || user?.address || user?.date_of_birth ? (
                  <>
                    {user?.phone && (
                      <View className="bg-primary/10 px-3 py-2 rounded-full">
                        <Text className="text-sm text-primary">📞 Verified</Text>
                      </View>
                    )}
                    {user?.address && (
                      <View className="bg-primary/10 px-3 py-2 rounded-full">
                        <Text className="text-sm text-primary">🏠 Location Set</Text>
                      </View>
                    )}
                    {user?.date_of_birth && (
                      <View className="bg-primary/10 px-3 py-2 rounded-full">
                        <Text className="text-sm text-primary">🎂 Birthday Added</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View className="bg-secondary px-3 py-2 rounded-full">
                    <Text className="text-sm text-secondary-foreground">Complete your profile for better service</Text>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Support & Info */}
        <View className="px-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Support & Information</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <MenuOption
                title="Help & Support"
                subtitle="Get help with your account"
                icon="❓"
                onPress={handleHelp}
              />
              <Separator />
              {/* <MenuOption
                title="Test Notification"
                subtitle="Send a test push notification"
                icon="🔔"
                onPress={handleTestNotification}
              /> */}
              <Separator />
              {/* <MenuOption
                title="Polling Status"
                subtitle="Check chat polling and fake notifications"
                icon="🔄"
                onPress={handleCheckPollingStatus}
              />
              <Separator /> */}
              <MenuOption
                title="About App"
                subtitle="Learn more about our app"
                icon="ℹ️"
                onPress={() => {
                  Alert.alert(
                    'About App',
                    'Dr. Ve Aesthetic Clinic App\n\nVersion: 1.0.0\nDeveloped for clinic management and appointment booking.\n\nFor support: support@drveaestheticclinic.online'
                  );
                }}
              />
            </CardContent>
          </Card>
        </View>

        {/* Logout */}
        <View
          className="px-6"
          style={{ paddingBottom: Math.max(insets.bottom + 100, 120) }}
        >
          <Button onPress={handleLogout} className="w-full bg-red-500">
            <Text className="text-white font-semibold">Sign Out</Text>
          </Button>
        </View>
      </ScrollView>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information below.
            </DialogDescription>
          </DialogHeader>

          <View className="space-y-4">
            <View className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your full name"
                autoCapitalize="words"
              />
            </View>

            <View className="space-y-2">
              <Label>Email Address</Label>
              <Input
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View className="space-y-2">
              <Label>Address</Label>
              <Input
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Enter your address"
                multiline
                numberOfLines={2}
              />
            </View>

            <View className="space-y-2">
              <Label>Date of Birth</Label>
              <Button
                variant="outline"
                onPress={() => setShowDatePicker(true)}
                className="justify-start"
              >
                <Text className="text-foreground">
                  {editDateOfBirth
                    ? editDateOfBirth.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                    : 'Select Date of Birth'
                  }
                </Text>
              </Button>
            </View>
          </View>

          <DialogFooter>
            <Button
              variant="outline"
              onPress={() => setIsEditDialogOpen(false)}
              disabled={isUpdating}
            >
              <Text>Cancel</Text>
            </Button>
            <Button onPress={handleUpdateProfile} disabled={isUpdating}>
              <Text>{isUpdating ? 'Updating...' : 'Save Changes'}</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Date Picker for Birthday */}
      {showDatePicker && (
        <DateTimePicker
          value={editDateOfBirth || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()} // Can't select future dates for birthday
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (event.type === 'set' && date) {
              setEditDateOfBirth(date);
            }
          }}
        />
      )}

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>

          <View className="space-y-4">
            <View className="space-y-2">
              <Label>Current Password</Label>
              <Input
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry
              />
            </View>

            <View className="space-y-2">
              <Label>New Password</Label>
              <Input
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
              />
            </View>

            <View className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
              />
            </View>
          </View>

          <DialogFooter>
            <Button
              variant="outline"
              onPress={() => setIsPasswordDialogOpen(false)}
              disabled={isChangingPassword}
            >
              <Text>Cancel</Text>
            </Button>
            <Button onPress={handleUpdatePassword} disabled={isChangingPassword}>
              <Text>{isChangingPassword ? 'Changing...' : 'Change Password'}</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </View>
  );
}