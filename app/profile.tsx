import * as React from 'react';
import { View, ScrollView, Pressable, Alert, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

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

  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AuthStorage.getUser();
        console.log('=== PROFILE USER DATA ===');
        console.log('Loaded user data:', userData);
        console.log('User fields:', {
          name: userData?.name,
          email: userData?.email,
          phone: userData?.phone,
          address: userData?.address,
          date_of_birth: userData?.date_of_birth,
          avatar: userData?.avatar
        });
        console.log('=========================');
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleEditProfile = () => {
    if (user) {
      console.log('=== EDIT PROFILE PREFILL ===');
      console.log('Full user object:', JSON.stringify(user, null, 2));
      console.log('user.data exists:', !!user.data);

      // Handle both nested and direct user data structures
      const userData = user.data || user;

      console.log('Using userData:', JSON.stringify(userData, null, 2));
      console.log('Prefilling fields with:', {
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        address: userData.address || '',
        date_of_birth: userData.date_of_birth || ''
      });
      console.log('============================');

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
      console.log('=== UPDATING PROFILE ===');
      console.log('User ID:', user.id);
      console.log('Update data:', { name: editName.trim(), email: editEmail.trim() });
      console.log('========================');

      // Ensure authentication token is set
      const token = await AuthStorage.getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      const { AuthService } = await import('~/lib/api');
      AuthService.setToken(token);

      // Get user ID from current user data
      const userId = user?.data?.id || user?.id;
      if (!userId) {
        throw new Error('User ID not found');
      }

      console.log('=== PROFILE UPDATE ATTEMPT ===');
      console.log('User ID:', userId);
      console.log('Token available:', !!token);
      console.log('Update data:', {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() || undefined,
        address: editAddress.trim() || undefined,
        date_of_birth: editDateOfBirth ? editDateOfBirth.toISOString().split('T')[0] : undefined,
      });
      console.log('===============================');

      // Try to update via API using new profile endpoint
      const updatedUser = await ProfileService.updateProfile(userId, {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() || undefined,
        address: editAddress.trim() || undefined,
        date_of_birth: editDateOfBirth ? editDateOfBirth.toISOString().split('T')[0] : undefined,
      });

      console.log('=== PROFILE UPDATE SUCCESS ===');
      console.log('Updated user:', updatedUser);
      console.log('Updated user structure check:');
      console.log('updatedUser type:', typeof updatedUser);
      console.log('updatedUser.id:', updatedUser?.id);
      console.log('updatedUser.name:', updatedUser?.name);
      console.log('updatedUser.email:', updatedUser?.email);
      console.log('==============================');

      // Ensure we have the user data in the correct format for storage
      const userDataToSave = {
        ...user, // Keep existing structure
        ...(user?.data ? { data: { ...user.data, ...updatedUser } } : updatedUser),
        // Also update direct properties if they exist
        ...updatedUser
      };

      console.log('=== SAVING USER DATA ===');
      console.log('Data to save:', JSON.stringify(userDataToSave, null, 2));
      console.log('========================');

      // Update local state and storage with API response
      setUser(userDataToSave);
      await AuthStorage.saveUser(userDataToSave);

      setIsEditDialogOpen(false);
      Alert.alert('Success', 'Profile updated successfully!');

    } catch (error: any) {
      console.log('=== PROFILE UPDATE ERROR ===');
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.log('============================');

      // If API fails, update locally as fallback
      if (error.response?.status === 404 || error.response?.status === 501) {
        console.log('API endpoint not available, updating locally');

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
      console.log('=== CHANGING PASSWORD ===');
      console.log('Using new password change endpoint');
      console.log('========================');

      await ProfileService.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      console.log('=== PASSWORD CHANGE SUCCESS ===');
      console.log('Password changed successfully');
      console.log('===============================');

      setIsPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully!');

    } catch (error: any) {
      console.log('=== PASSWORD CHANGE ERROR ===');
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.log('=============================');

      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleNotificationSettings = () => {
    Alert.alert('Coming Soon', 'Notification settings will be available soon!');
  };

  const handleHelp = () => {
    Alert.alert('Help & Support', 'Contact us at support@drveaestheticclinic.online or call +63 123 456 7890');
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
      console.error('Avatar upload error:', error);
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
      console.error('Camera error:', error);
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
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const uploadAvatarImage = async (imageUri: string) => {
    if (!user) return;

    setIsUploadingAvatar(true);
    try {
      console.log('=== UPLOADING AVATAR ===');
      console.log('Image URI:', imageUri);
      console.log('User ID:', user?.data?.id || user?.id);
      console.log('ProfileService available:', !!ProfileService);
      console.log('ProfileService.uploadAvatar available:', !!ProfileService?.uploadAvatar);
      console.log('========================');

      // Ensure authentication token is set
      const token = await AuthStorage.getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      AuthService.setToken(token);

      // Get user ID
      const userId = user?.data?.id || user?.id;
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Upload avatar - Import ProfileService directly to ensure it's available
      const { ProfileService: PS } = await import('~/lib/api');
      const updatedUser = await PS.uploadAvatar(userId, imageUri);
      
      console.log('=== AVATAR UPLOAD SUCCESS ===');
      console.log('Updated user:', updatedUser);
      console.log('New avatar URL:', updatedUser?.avatar);
      console.log('Avatar URL sample format check:', updatedUser?.avatar?.includes('drveaestheticclinic.online/storage/avatars/'));
      console.log('=============================');

      // Store only the filename from the API response
      const avatarFilename = updatedUser?.avatar;
      
      console.log('=== SAVING AVATAR DATA ===');
      console.log('Avatar filename from API:', avatarFilename);
      console.log('Full avatar URL will be:', avatarFilename ? `https://drveaestheticclinic.online/storage/avatars/${avatarFilename}` : 'No avatar');
      console.log('==========================');

      // Update local state and storage with filename only
      const userDataToSave = {
        ...user,
        ...(user?.data ? { data: { ...user.data, ...updatedUser } } : updatedUser),
        // Store filename, not full URL
        avatar: avatarFilename
      };

      setUser(userDataToSave);
      await AuthStorage.saveUser(userDataToSave);

      Alert.alert('Success', 'Avatar updated successfully!');

    } catch (error: any) {
      console.log('=== AVATAR UPLOAD ERROR ===');
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.log('===========================');

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
              await AuthService.logout();
              await AuthStorage.clearAll();

              // Navigate to login screen
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);

              // Even if API call fails, clear local storage and navigate
              await AuthStorage.clearAll();
              router.replace('/login');
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

  return (
    <View className="flex-1 bg-secondary/30">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-12 pb-6">
          <Text className="text-3xl font-bold text-foreground">Profile</Text>
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
                        uri: (user?.data || user)?.avatar 
                          ? `https://drveaestheticclinic.online/storage/${(user?.data || user)?.avatar}`
                          : undefined,
                        // Add cache control for better image loading
                        cache: 'reload'
                      }} 
                      style={{ borderRadius: 48 }}
                    />
                    <AvatarFallback>
                      <Text className="text-2xl">{(user?.data || user)?.name?.split(' ').map(n => n[0]).join('') || 'U'}</Text>
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

              <Text className="text-2xl font-bold text-foreground mb-1">{(user?.data || user)?.name || 'User'}</Text>
              <Text className="text-muted-foreground mb-2">{(user?.data || user)?.email || 'user@example.com'}</Text>
              {(user?.data || user)?.phone && (
                <Text className="text-sm text-muted-foreground mb-1">📞 {(user?.data || user).phone}</Text>
              )}
              {(user?.data || user)?.date_of_birth && (
                <Text className="text-sm text-muted-foreground mb-1">🎂 {(user?.data || user).date_of_birth}</Text>
              )}
              {(user?.data || user)?.address && (
                <Text className="text-sm text-muted-foreground mb-4">📍 {(user?.data || user).address}</Text>
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
              <MenuOption
                title="About App"
                subtitle="Learn more about our app"
                icon="ℹ️"
                onPress={() => router.push('/about')}
              />
            </CardContent>
          </Card>
        </View>

        {/* Logout */}
        <View
          className="px-6"
          style={{ paddingBottom: Math.max(insets.bottom + 100, 120) }}
        >
          <Button variant="destructive" onPress={handleLogout} className="w-full bg-primary-gradient">
            <Text>Sign Out</Text>
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