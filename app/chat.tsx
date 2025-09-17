import * as React from 'react';
import { View, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { BottomNavigation } from '~/components/BottomNavigation';
import { ChatService, AuthStorage, Message, AuthService } from '~/lib/api';
import { router } from 'expo-router';
import { ChevronLeft } from '~/lib/icons/ChevronLeft';
import { AppState, AppStateStatus } from 'react-native';

export default function ChatScreen() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [newMessage, setNewMessage] = React.useState('');
  const [staffId, setStaffId] = React.useState<number | null>(null);
  const [currentChatId, setCurrentChatId] = React.useState<string | null>(null);
  const [lastMessageId, setLastMessageId] = React.useState<string | null>(null);
  const [isPolling, setIsPolling] = React.useState(false);
  const pollingInterval = React.useRef<NodeJS.Timeout | null>(null);
  const appState = React.useRef(AppState.currentState);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const loadMessages = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user is authenticated
      const token = await AuthStorage.getToken();
      const userData = await AuthStorage.getUser();

      if (!token) {
        router.replace('/login');
        return;
      }

      setCurrentUser(userData);

      // Set token in API client
      const { AuthService: ImportedAuthService } = await import('~/lib/api');
      ImportedAuthService.setToken(token);

      console.log('=== SINGLE CHAT AUTH DEBUG ===');
      console.log('Token available:', !!token);
      console.log('User data:', !!userData);
      console.log('==============================');

      // Try to get existing conversations first
      console.log('Loading conversations...');
      const conversations = await ChatService.getConversations(1, 1);
      
      let messagesList = [];
      
      if (conversations && Array.isArray(conversations) && conversations.length > 0) {
        // If conversation exists, load its messages
        const conversation = conversations[0];
        if (conversation && conversation.id) {
          const chatId = conversation.id.toString();
          console.log('Found existing conversation, loading messages for chat:', chatId);
          setCurrentChatId(chatId);
          
          // Get staff ID from conversation
          if (conversation.staff?.id) {
            setStaffId(conversation.staff.id);
          }
          
          try {
            const messagesResult = await ChatService.getConversationMessages(chatId);
            messagesList = messagesResult?.messages || [];
          } catch (msgError) {
            console.warn('Failed to load messages:', msgError);
            messagesList = [];
          }
        }
      } else {
        // If no conversation exists, automatically get the single staff account
        console.log('No existing conversation found, getting staff info...');
        try {
          const staffResponse = await ChatService.searchUsers();
          const staffList = staffResponse?.data || staffResponse || [];
          if (Array.isArray(staffList) && staffList.length > 0) {
            // Automatically select the first (and only) staff member
            const staff = staffList[0];
            if (staff && staff.id) {
              setStaffId(staff.id);
              console.log('Auto-selected staff ID:', staff.id, 'Name:', staff.name || 'Unknown');
            }
          } else {
            // Fallback: Use the default staff ID
            const defaultStaffId = ChatService.getDefaultStaffId();
            console.log('No staff found in search, using default staff ID:', defaultStaffId);
            setStaffId(defaultStaffId);
          }
        } catch (staffError) {
          console.warn('Could not get staff info, using default staff ID:', staffError);
          const defaultStaffId = ChatService.getDefaultStaffId();
          setStaffId(defaultStaffId);
        }
        messagesList = [];
      }
      
      // Ensure messagesList is an array and sort safely
      const safeMessagesList = Array.isArray(messagesList) ? messagesList : [];
      setMessages(safeMessagesList.sort((a, b) => {
        const dateA = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      }));

      // Set up polling for real-time messages
      const userId = userData?.data?.id || userData?.id;
      if (userId && token) {
        startMessagePolling();
      }
      
      // Track the last message ID for polling
      if (Array.isArray(messagesList) && messagesList.length > 0) {
        const lastMessage = messagesList[messagesList.length - 1];
        if (lastMessage && lastMessage.id) {
          setLastMessageId(lastMessage.id.toString());
        }
      }

    } catch (error: any) {
      console.error('Failed to load messages:', error);
      
      if (error.response?.status === 401) {
        await AuthStorage.clearAll();
        router.replace('/login');
        return;
      }
      setError('Failed to load messages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startMessagePolling = () => {
    // Clear existing polling
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    
    setIsPolling(true);
    console.log('✅ Started message polling for real-time updates');
    
    // Poll every 2 seconds for new messages
    pollingInterval.current = setInterval(async () => {
      try {
        // Only poll if app is in foreground and we have a chat
        if (appState.current !== 'active') return;
        
        let newMessages: Message[] = [];
        
        if (currentChatId) {
          // Poll specific conversation
          const result = await ChatService.getConversationMessages(currentChatId, 1, 20);
          newMessages = result.messages || [];
        } else {
          // Poll for any new conversations
          const conversations = await ChatService.getConversations(1, 1);
          if (conversations.length > 0) {
            const conversation = conversations[0];
            setCurrentChatId(conversation.id.toString());
            if (conversation.staff?.id) {
              setStaffId(conversation.staff.id);
            }
            const result = await ChatService.getConversationMessages(conversation.id.toString(), 1, 20);
            newMessages = result.messages || [];
          }
        }
        
        // Check for new messages with proper null checks
        if (newMessages && Array.isArray(newMessages) && newMessages.length > 0) {
          setMessages(prevMessages => {
            // Ensure prevMessages is an array
            if (!prevMessages || !Array.isArray(prevMessages)) {
              prevMessages = [];
            }
            
            // Find truly new messages
            const existingIds = new Set(prevMessages.map(msg => msg?.id?.toString()).filter(Boolean));
            const freshMessages = newMessages.filter(msg => 
              msg && msg.id && !existingIds.has(msg.id.toString())
            );
            
            if (freshMessages.length > 0) {
              console.log(`💬 Found ${freshMessages.length} new message(s) via polling`);
              
              // Check for intro messages
              freshMessages.forEach(msg => {
                if (msg && msg.message) {
                  const isIntroMessage = msg.message.toLowerCase().includes('welcome') || 
                                       msg.message.toLowerCase().includes('hello') ||
                                       msg.message.toLowerCase().includes('good morning') ||
                                       msg.message.toLowerCase().includes('good afternoon') ||
                                       msg.message.toLowerCase().includes('good evening');
                  
                  if (isIntroMessage) {
                    console.log('👋 Received automatic intro message from staff!');
                  }
                }
              });
              
              const allMessages = [...prevMessages, ...freshMessages].sort((a, b) => {
                const dateA = a?.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b?.created_at ? new Date(b.created_at).getTime() : 0;
                return dateA - dateB;
              });
              
              // Update last message ID
              const lastMsg = allMessages[allMessages.length - 1];
              if (lastMsg && lastMsg.id) {
                setLastMessageId(lastMsg.id.toString());
              }
              
              // Auto scroll to bottom
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 200);
              
              return allMessages;
            }
            
            return prevMessages;
          });
        }
        
      } catch (error) {
        console.warn('Polling error (will retry):', error);
      }
    }, 2000); // Poll every 2 seconds
  };
  
  const stopMessagePolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    setIsPolling(false);
    console.log('❌ Stopped message polling');
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      // For single staff chat, we need to provide receiver_id
      const messageData: any = {
        message: messageText,
      };
      
      // Add receiver_id - required for sending messages
      if (staffId) {
        messageData.receiver_id = staffId;
      } else {
        // Fallback: Use default staff ID if not available
        const defaultStaffId = ChatService.getDefaultStaffId();
        console.log('No staff ID available, using default staff ID:', defaultStaffId);
        messageData.receiver_id = defaultStaffId;
        setStaffId(defaultStaffId);
      }
      
      // Add chat_id if we have an existing conversation
      if (currentChatId) {
        messageData.chat_id = parseInt(currentChatId);
      }
      
      console.log('Sending message with data:', messageData);

      const response = await ChatService.sendMessage(messageData);
      
      console.log('Message sent successfully:', response);
      
      // Extract message and chat_id from response
      const sentMessage = response.message;
      const chatId = response.chatId;
      
      // Update chat ID if we got one from the response (for new conversations)
      const isNewConversation = !currentChatId;
      if (chatId && !currentChatId) {
        setCurrentChatId(chatId.toString());
        console.log('🎆 New conversation created! Chat ID:', chatId);
        
        // Start/restart polling for the new conversation
        if (!isPolling) {
          startMessagePolling();
        }
      }
      
      // Add message to local state immediately for better UX
      setMessages(prevMessages => {
        const exists = prevMessages.some(msg => 
          msg.message === messageText && 
          Math.abs(new Date(msg.created_at || new Date()).getTime() - Date.now()) < 5000
        );
        
        if (exists) return prevMessages;
        
        return [...prevMessages, sentMessage].sort((a, b) => 
          new Date(a.created_at || new Date()).getTime() - new Date(b.created_at || new Date()).getTime()
        );
      });
      
      // For new conversations, expect an automatic intro message from staff
      if (isNewConversation) {
        console.log('🔔 Expecting automatic intro message from staff...');
        // Increase polling frequency briefly to catch intro message faster
        setTimeout(() => {
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            // Poll more frequently for 10 seconds to catch intro message
            let fastPollCount = 0;
            const fastPolling = setInterval(async () => {
              fastPollCount++;
              if (fastPollCount > 10) {
                clearInterval(fastPolling);
                startMessagePolling(); // Resume normal polling
                return;
              }
              
              // Fast poll logic (same as normal polling but every 1 second)
              try {
                if (currentChatId) {
                  const result = await ChatService.getConversationMessages(currentChatId, 1, 20);
                  const newMessages = result?.messages || [];
                  
                  setMessages(prevMessages => {
                    // Ensure prevMessages is an array
                    if (!prevMessages || !Array.isArray(prevMessages)) {
                      prevMessages = [];
                    }
                    
                    const existingIds = new Set(prevMessages.map(msg => msg?.id?.toString()).filter(Boolean));
                    const freshMessages = (newMessages || []).filter(msg => 
                      msg && msg.id && !existingIds.has(msg.id.toString())
                    );
                    
                    if (freshMessages && freshMessages.length > 0) {
                      console.log(`⚡ Fast poll found ${freshMessages.length} new message(s)`);
                      const allMessages = [...prevMessages, ...freshMessages].sort((a, b) => {
                        const dateA = a?.created_at ? new Date(a.created_at).getTime() : 0;
                        const dateB = b?.created_at ? new Date(b.created_at).getTime() : 0;
                        return dateA - dateB;
                      });
                      
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                      
                      return allMessages;
                    }
                    return prevMessages;
                  });
                }
              } catch (error) {
                console.warn('Fast polling error:', error);
              }
            }, 1000); // Poll every 1 second for intro message
          }
        }, 500);
      }

      // Auto scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error: any) {
      console.error('Failed to send message:', error);
      Alert.alert(
        'Send Failed',
        error.response?.data?.message || 'Failed to send message. Please try again.'
      );
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  React.useEffect(() => {
    loadMessages();
    
    // Set up app state change listener
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state changed:', appState.current, '->', nextAppState);
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, resume polling
        console.log('📱 App resumed, starting polling');
        startMessagePolling();
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background, stop polling to save battery
        console.log('🚫 App went to background, stopping polling');
        stopMessagePolling();
      }
      
      appState.current = nextAppState;
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup on unmount
    return () => {
      stopMessagePolling();
      subscription?.remove();
    };
  }, []);

  // Auto scroll when messages change
  React.useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isMyMessage = (message: Message) => {
    const userId = currentUser?.data?.id || currentUser?.id;
    return message.sender_id === userId;
  };

  return (
    <View className="flex-1 bg-secondary/30">
      {/* Header */}
      <View 
        className="bg-background border-b border-border px-6 py-4"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center">
          <Button
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
            className="mr-2 p-2"
          >
            <ChevronLeft size={20} className="text-foreground" />
          </Button>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">
              Dr. Ve Aesthetic Clinic
            </Text>
            <Text className="text-sm text-muted-foreground">
              Chat with our staff
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4 py-4"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >

        {isLoading && (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" />
            <Text className="text-muted-foreground mt-4">Loading messages...</Text>
          </View>
        )}

        {error && !isLoading && (
          <View className="items-center py-12">
            <Text className="text-6xl mb-4">⚠️</Text>
            <Text className="text-lg font-semibold text-foreground mb-2">
              Something went wrong
            </Text>
            <Text className="text-muted-foreground text-center mb-6">
              {error}
            </Text>
            <Button onPress={loadMessages}>
              <Text>Try Again</Text>
            </Button>
          </View>
        )}

        {!isLoading && !error && (
          <View className="space-y-4" style={{ paddingBottom: 120 }}>
            {messages.length > 0 ? (
              messages.map((message, index) => (
                <View
                  key={`${message.id}-${index}`}
                  className={`flex-row mb-3 ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar for staff messages */}
                  {!isMyMessage(message) && (
                    <View className="w-8 h-8 rounded-full bg-blue-100 mr-2 items-center justify-center">
                      <Text className="text-blue-600 font-bold text-xs">Dr</Text>
                    </View>
                  )}

                  <View
                    className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
                      isMyMessage(message)
                        ? 'bg-blue-500 rounded-br-md'
                        : 'bg-white border border-gray-200 rounded-bl-md'
                    }`}
                  >
                    {/* Show sender name for both client and staff */}
                    <Text className={`text-xs font-semibold mb-2 ${
                      isMyMessage(message)
                        ? 'text-blue-100'
                        : 'text-blue-600'
                    }`}>
                      {isMyMessage(message)
                        ? currentUser?.name || currentUser?.data?.name || 'You'
                        : 'Dr. Ve Staff'
                      }
                    </Text>
                    <Text
                      className={`text-sm leading-5 ${
                        isMyMessage(message) ? 'text-white' : 'text-gray-800'
                      }`}
                    >
                      {message.message}
                    </Text>
                    <Text
                      className={`text-xs mt-2 ${
                        isMyMessage(message) ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatMessageTime(message.created_at)}
                    </Text>
                  </View>

                  {/* Avatar for client messages */}
                  {isMyMessage(message) && (
                    <View className="w-8 h-8 rounded-full bg-green-100 ml-2 items-center justify-center">
                      <Text className="text-green-600 font-bold text-xs">
                        {(currentUser?.name || currentUser?.data?.name || 'You').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              !isLoading && (
                <View className="items-center py-12">
                  <Text className="text-6xl mb-4">👋</Text>
                  <Text className="text-lg font-semibold text-foreground mb-2">
                    Welcome to Dr. Ve Aesthetic Clinic
                  </Text>
                  <Text className="text-muted-foreground text-center mb-4">
                    Send your first message below and our staff will personally greet you with a warm welcome!
                  </Text>
                  <View className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-2">
                    <Text className="text-sm text-primary text-center">
                      ✨ You'll receive an automatic personalized greeting when you send your first message
                    </Text>
                  </View>
                </View>
              )
            )}
          </View>
        )}
      </ScrollView>

      {/* Message Input - Fixed at bottom */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <View className="bg-background border-t-2 border-border px-4 py-4" style={{ 
          paddingBottom: Math.max(insets.bottom + 16, 24),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        }}>
          <View className="flex-row items-center space-x-3">
            <Input
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              multiline
              maxLength={1000}
              className="flex-1 min-h-[44px] max-h-[120px] bg-white border-2 border-gray-300"
              textAlignVertical="top"
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
              style={{ 
                paddingTop: 12, 
                paddingBottom: 12, 
                paddingHorizontal: 16,
                fontSize: 16,
                borderRadius: 12,
              }}
            />
            <Button
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              size="default"
              className="h-[44px] px-6 bg-blue-500"
              style={{
                backgroundColor: '#3B82F6',
                borderRadius: 12,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                {isSending ? 'Sending...' : 'Send'}
              </Text>
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>

      <BottomNavigation />
    </View>
  );
}