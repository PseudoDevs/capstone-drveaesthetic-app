import * as React from 'react';
import { View, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { BottomNavigation } from '~/components/BottomNavigation';
import { ChatService, AuthStorage, Chat as ChatType, Staff, Message, AuthService } from '~/lib/api';
import { PusherService, subscribeToChatChannel, subscribeToUserChannel } from '~/lib/config/pusher';
import { router } from 'expo-router';

export default function ChatScreen() {
  const [chats, setChats] = React.useState<ChatType[]>([]);
  const [availableStaff, setAvailableStaff] = React.useState<Staff[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [showNewChatModal, setShowNewChatModal] = React.useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = React.useState('');
  const [isSearchingStaff, setIsSearchingStaff] = React.useState(false);
  const insets = useSafeAreaInsets();

  const loadChats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user is authenticated and get user info
      const token = await AuthStorage.getToken();
      const userData = await AuthStorage.getUser();

      if (!token) {
        router.replace('/login');
        return;
      }

      setCurrentUser(userData);

      // Set token in API client and Pusher
      const { AuthService: ImportedAuthService, apiClient } = await import('~/lib/api');
      ImportedAuthService.setToken(token);
      PusherService.setAuthToken(token);

      console.log('=== AUTH DEBUG ===');
      console.log('Token from storage:', !!token);
      console.log('Token length:', token?.length || 0);
      console.log('User data:', !!userData);
      console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'N/A');
      console.log('API client has token:', apiClient.hasAuthToken());
      console.log('API client token preview:', apiClient.getAuthTokenPreview());
      console.log('==================');

      // Verify token is set in the API client by making a test request
      try {
        // Test authentication by trying to get user profile first
        const userId = userData?.data?.id || userData?.id;
        if (userId) {
          console.log('Testing authentication with profile request...');
          const { ProfileService } = await import('~/lib/api');
          await ProfileService.getProfile(userId);
          console.log('✅ Authentication verified');
        }
      } catch (authTestError: any) {
        console.error('❌ Authentication test failed:', authTestError);
        if (authTestError.response?.status === 401) {
          throw authTestError; // Re-throw to trigger the main error handler
        }
      }

      // Load chats
      const chatsResponse = await ChatService.getChats();
      const chatsList = Array.isArray(chatsResponse) 
        ? chatsResponse 
        : (Array.isArray(chatsResponse.data) ? chatsResponse.data : []);
      
      setChats(chatsList);

      console.log('=== CHATS LOADED ===');
      console.log('Chats:', JSON.stringify(chatsList, null, 2));
      console.log('===================');

      // Set up real-time connections for each chat
      const userId = userData?.data?.id || userData?.id;
      if (userId) {
        // Subscribe to user channel for notifications
        const userChannel = subscribeToUserChannel(userId);
        userChannel.bind('new-message', (data: any) => {
          console.log('🔔 New message received:', data);
          // Refresh chats to show new message
          loadChats();
        });

        // Subscribe to each chat channel
        chatsList.forEach((chat) => {
          const chatChannel = subscribeToChatChannel(chat.id, userId);
          chatChannel.bind('message-sent', (data: any) => {
            console.log('💬 Message sent in chat:', data);
            // Update specific chat in real-time
            setChats(prevChats => 
              prevChats.map(c => 
                c.id === chat.id 
                  ? { ...c, last_message: data.message, last_message_time: data.created_at }
                  : c
              )
            );
          });
        });
      }

    } catch (error: any) {
      console.error('Failed to load chats:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        config: error.config?.url
      });
      
      if (error.response?.status === 401) {
        console.warn('Authentication failed, clearing tokens and redirecting to login');
        await AuthStorage.clearAll();
        try {
          router.replace('/login');
        } catch (navError) {
          console.error('Navigation error:', navError);
        }
        return;
      }
      setError('Failed to load chats. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableStaff = async (query?: string) => {
    setIsSearchingStaff(true);
    try {
      console.log('=== SEARCHING STAFF ===');
      console.log('Query:', query || 'No query (load all)');
      console.log('======================');
      
      const staffResponse = await ChatService.searchStaff(query);
      const staffList = Array.isArray(staffResponse) 
        ? staffResponse 
        : (Array.isArray(staffResponse.data) ? staffResponse.data : []);
      
      console.log('=== STAFF SEARCH RESULTS ===');
      console.log('Found staff:', staffList.length);
      console.log('Staff:', JSON.stringify(staffList, null, 2));
      console.log('============================');
      
      setAvailableStaff(staffList);
    } catch (error) {
      console.warn('Failed to load staff:', error);
      setAvailableStaff([]);
    } finally {
      setIsSearchingStaff(false);
    }
  };

  // Debounced search function
  const debouncedStaffSearch = React.useCallback(
    React.useMemo(() => {
      const timeoutRef: { current: NodeJS.Timeout | null } = { current: null };
      
      return (query: string) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          loadAvailableStaff(query.trim() || undefined);
        }, 300); // 300ms debounce
      };
    }, []),
    []
  );

  React.useEffect(() => {
    loadChats();
    loadAvailableStaff();

    // Cleanup Pusher on unmount
    return () => {
      PusherService.disconnect();
    };
  }, []);

  // Handle search query changes
  React.useEffect(() => {
    if (showNewChatModal) {
      debouncedStaffSearch(staffSearchQuery);
    }
  }, [staffSearchQuery, showNewChatModal, debouncedStaffSearch]);

  const handleStartNewChat = async (staff: Staff) => {
    try {
      const userId = currentUser?.data?.id || currentUser?.id;
      if (!userId) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Close the modal and clear search immediately (FB Messenger approach)
      setShowNewChatModal(false);
      setStaffSearchQuery('');

      // Check if chat already exists
      const existingChat = chats.find(chat => chat.staff?.id === staff.id);
      
      if (existingChat) {
        // If chat exists, navigate directly to it
        console.log('Existing chat found, navigating to:', existingChat.id);
        router.push(`/chat/${existingChat.id}` as any);
        return;
      }

      // If no existing chat, create a conversation ID and navigate
      // Use a combination of user ID and staff ID as conversation identifier
      const conversationId = `${userId}_${staff.id}`;
      console.log('Creating new chat conversation:', conversationId);
      
      // Navigate directly to chat - the individual chat screen will handle message sending
      router.push(`/chat/${conversationId}` as any);
      
    } catch (error: any) {
      console.error('Failed to start chat:', error);
      Alert.alert(
        'Failed to Start Chat',
        error.response?.data?.message || error.message || 'Could not start chat. Please try again.'
      );
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return formatTime(dateString);
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleChatPress = (chat: ChatType) => {
    // Navigate to individual chat screen (to be implemented)
    console.log('Navigate to chat:', chat.id);
    router.push(`/chat/${chat.id}` as any);
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-secondary/30" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-12 pb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-3xl font-bold text-foreground">Messages</Text>
            <Button
              onPress={() => {
                const newState = !showNewChatModal;
                setShowNewChatModal(newState);
                if (!newState) {
                  // Clear search when closing modal
                  setStaffSearchQuery('');
                }
              }}
              size="sm"
              variant="outline"
            >
              <Text>{showNewChatModal ? 'Cancel' : 'New Chat'}</Text>
            </Button>
          </View>

          {/* New Chat Section */}
          {showNewChatModal && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle>Start New Chat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Input */}
                <View>
                  <Input
                    placeholder="Search staff by name, role, or specialization..."
                    value={staffSearchQuery}
                    onChangeText={setStaffSearchQuery}
                    className="mb-3"
                  />
                  {isSearchingStaff && (
                    <View className="flex-row items-center justify-center py-2">
                      <ActivityIndicator size="small" />
                      <Text className="text-muted-foreground ml-2">Searching...</Text>
                    </View>
                  )}
                </View>

                {/* Staff Results */}
                <View>
                  <Text className="text-sm text-muted-foreground mb-3">
                    {staffSearchQuery ? `Search results for "${staffSearchQuery}":` : 'Available staff members:'}
                  </Text>
                  
                  {availableStaff.length > 0 ? (
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false} 
                      className="space-x-3"
                      contentContainerStyle={{ paddingRight: 20 }}
                    >
                      {availableStaff.map((staff) => (
                        <Button
                          key={staff.id}
                          onPress={() => handleStartNewChat(staff)}
                          variant="outline"
                          className="mr-3 min-w-[120px]"
                        >
                          <View className="items-center">
                            <Text className="text-sm font-medium">{staff.name}</Text>
                            {staff.role && (
                              <Badge variant="secondary" className="mt-1">
                                <Text className="text-xs">{staff.role}</Text>
                              </Badge>
                            )}
                            {staff.specialization && (
                              <Text className="text-xs text-muted-foreground mt-1">
                                {staff.specialization}
                              </Text>
                            )}
                          </View>
                        </Button>
                      ))}
                    </ScrollView>
                  ) : !isSearchingStaff ? (
                    <Text className="text-muted-foreground text-center py-4">
                      {staffSearchQuery ? `No staff found matching "${staffSearchQuery}"` : 'No staff members available'}
                    </Text>
                  ) : null}
                </View>
              </CardContent>
            </Card>
          )}
        </View>

        {/* Loading State */}
        {isLoading && (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" />
            <Text className="text-muted-foreground mt-4">Loading chats...</Text>
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
            <Button onPress={loadChats}>
              <Text>Try Again</Text>
            </Button>
          </View>
        )}

        {/* Chats List */}
        {!isLoading && !error && (
          <View
            className="px-6"
            style={{ paddingBottom: Math.max(insets.bottom + 100, 120) }}
          >
            {chats.length > 0 ? (
              <View className="gap-3">
                {chats.map((chat) => (
                  <Card key={chat.id} className="p-0">
                    <Button
                      onPress={() => handleChatPress(chat)}
                      variant="ghost"
                      className="w-full p-4 h-auto justify-start"
                    >
                      <View className="flex-1">
                        <View className="flex-row justify-between items-start mb-2">
                          <Text className="text-lg font-semibold text-foreground">
                            {chat.staff?.name || 'Staff Member'}
                          </Text>
                          {chat.last_message_time && (
                            <Text className="text-sm text-muted-foreground">
                              {formatDate(chat.last_message_time)}
                            </Text>
                          )}
                        </View>
                        
                        {chat.staff?.role && (
                          <Badge variant="secondary" className="self-start mb-2">
                            <Text className="text-xs">{chat.staff.role}</Text>
                          </Badge>
                        )}

                        {chat.last_message && (
                          <Text className="text-sm text-muted-foreground text-left" numberOfLines={2}>
                            {chat.last_message}
                          </Text>
                        )}
                        
                        {!chat.last_message && (
                          <Text className="text-sm text-muted-foreground italic text-left">
                            No messages yet
                          </Text>
                        )}
                      </View>
                    </Button>
                  </Card>
                ))}
              </View>
            ) : (
              <View className="items-center py-12">
                <Text className="text-6xl mb-4">💬</Text>
                <Text className="text-lg font-semibold text-foreground mb-2">
                  No conversations yet
                </Text>
                <Text className="text-muted-foreground text-center mb-6">
                  Start a conversation with our staff members to get help with your aesthetic needs.
                </Text>
                <Button onPress={() => setShowNewChatModal(true)}>
                  <Text>Start Your First Chat</Text>
                </Button>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <BottomNavigation />
    </KeyboardAvoidingView>
  );
}