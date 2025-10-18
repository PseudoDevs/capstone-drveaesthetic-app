import * as React from 'react';
import { View, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image, TextInput, Pressable } from 'react-native';
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
  const [typingMessage, setTypingMessage] = React.useState('');
  const [inputHeight, setInputHeight] = React.useState(44);
  const pollingInterval = React.useRef<number | null>(null);
  const appState = React.useRef(AppState.currentState);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const textInputRef = React.useRef<TextInput>(null);
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


      // Try to get existing conversations first
      const conversations = await ChatService.getConversations(1, 1);
      
      let messagesList: Message[] = [];
      
      if (conversations && Array.isArray(conversations) && conversations.length > 0) {
        // If conversation exists, load its messages
        const conversation = conversations[0];
        if (conversation && conversation.id) {
          const chatId = conversation.id.toString();
          setCurrentChatId(chatId);
          
          // Get staff ID from conversation
          if (conversation.staff?.id) {
            setStaffId(conversation.staff.id);
          }
          
          try {
            const messagesResult = await ChatService.getConversationMessages(chatId);
            messagesList = messagesResult?.messages || [];
          } catch (msgError) {
            messagesList = [];
          }
        }
      } else {
        // If no conversation exists, automatically get the single staff account
        try {
          const staffResponse = await ChatService.searchUsers();
          const staffList = Array.isArray(staffResponse) ? staffResponse : [];
          if (Array.isArray(staffList) && staffList.length > 0) {
            // Automatically select the first (and only) staff member
            const staff = staffList[0];
            if (staff && staff.id) {
              setStaffId(staff.id);
            }
          } else {
            // Fallback: Use the default staff ID
            const defaultStaffId = ChatService.getDefaultStaffId();
            setStaffId(defaultStaffId);
          }
        } catch (staffError) {
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
      const userId = (userData as any)?.data?.id || (userData as any)?.id;
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
              
              // Check for intro messages
              freshMessages.forEach(msg => {
                if (msg && msg.message) {
                  const isIntroMessage = msg.message.toLowerCase().includes('welcome') || 
                                       msg.message.toLowerCase().includes('hello') ||
                                       msg.message.toLowerCase().includes('good morning') ||
                                       msg.message.toLowerCase().includes('good afternoon') ||
                                       msg.message.toLowerCase().includes('good evening');
                  
                  if (isIntroMessage) {
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
      }
    }, 2000); // Poll every 2 seconds
  };
  
  const stopMessagePolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    setIsPolling(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setTypingMessage('');
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
        messageData.receiver_id = defaultStaffId;
        setStaffId(defaultStaffId);
      }
      
      // Add chat_id if we have an existing conversation
      if (currentChatId) {
        messageData.chat_id = parseInt(currentChatId);
      }
      

      const response = await ChatService.sendMessage(messageData);
      
      
      // Extract message and chat_id from response
      const sentMessage = response.message;
      const chatId = response.chatId;
      
      // Update chat ID if we got one from the response (for new conversations)
      const isNewConversation = !currentChatId;
      if (chatId && !currentChatId) {
        setCurrentChatId(chatId.toString());
        
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
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, resume polling
        startMessagePolling();
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background, stop polling to save battery
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
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleTypingChange = (text: string) => {
    setNewMessage(text);
    setTypingMessage(text);
  };

  const handleInputContentSizeChange = (event: any) => {
    const newHeight = Math.min(Math.max(event.nativeEvent.contentSize.height, 44), 120);
    setInputHeight(newHeight);
  };

  const isMyMessage = (message: Message) => {
    const userId = currentUser?.data?.id || currentUser?.id;
    return message.sender_id === userId;
  };

  return (
    <View className="flex-1 bg-secondary/30">
      {/* Header with Clinic Logo */}
      <View className="bg-white px-6 py-4 shadow-sm" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Button
              onPress={() => router.back()}
              variant="ghost"
              size="sm"
              className="mr-3 p-2"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </Button>
            <View className="w-10 h-10 items-center justify-center mr-3">
              <Image 
                source={require('~/assets/images/clinic-logo.jpg')}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text className="text-gray-800 text-lg font-bold">Dr. Ve Aesthetic</Text>
              <Text className="text-gray-500 text-xs">Chat Support</Text>
            </View>
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
              messages.map((message, index) => {
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
                const showAvatar = !nextMessage || isMyMessage(message) !== isMyMessage(nextMessage);
                const showTimestamp = !prevMessage || 
                  Math.abs(new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime()) > 300000; // 5 minutes

                return (
                  <View key={`${message.id}-${index}`}>
                    {/* Show timestamp if needed */}
                    {showTimestamp && (
                      <View className="items-center my-2">
                        <Text className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {new Date(message.created_at).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </Text>
                      </View>
                    )}

                    <View
                      className={`flex-row mb-1 ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
                    >
                       {/* Avatar for staff messages */}
                       {!isMyMessage(message) && showAvatar && (
                         <View className="w-8 h-8 rounded-full mr-2 items-center justify-center self-end overflow-hidden">
                           <Image 
                             source={require('~/assets/images/clinic-logo.jpg')}
                             style={{ width: 32, height: 32 }}
                             resizeMode="cover"
                           />
                         </View>
                       )}

                      {/* Spacer for alignment when no avatar */}
                      {!isMyMessage(message) && !showAvatar && (
                        <View className="w-10 mr-2" />
                      )}

                      <View
                        className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                          isMyMessage(message)
                            ? 'bg-blue-500 rounded-br-md'
                            : 'bg-gray-100 rounded-bl-md'
                        }`}
                        style={{
                          borderTopLeftRadius: isMyMessage(message) ? 18 : 4,
                          borderTopRightRadius: isMyMessage(message) ? 4 : 18,
                          borderBottomLeftRadius: isMyMessage(message) ? 18 : 18,
                          borderBottomRightRadius: isMyMessage(message) ? 18 : 4,
                        }}
                      >
                        <Text
                          className={`text-base leading-5 ${
                            isMyMessage(message) ? 'text-white' : 'text-gray-800'
                          }`}
                        >
                          {message.message}
                        </Text>
                      </View>

                      {/* Avatar for client messages */}
                      {isMyMessage(message) && showAvatar && (
                        <View className="w-8 h-8 rounded-full bg-green-500 ml-2 items-center justify-center self-end">
                          <Text className="text-white font-bold text-xs">
                            {(currentUser?.name || currentUser?.data?.name || 'You').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}

                      {/* Spacer for alignment when no avatar */}
                      {isMyMessage(message) && !showAvatar && (
                        <View className="w-10 ml-2" />
                      )}
                    </View>

                  </View>
                );
              })
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

            {/* Show typing message if user is typing */}
            {typingMessage.trim() && (
              <View className="flex-row justify-end mb-1">
                <View className="w-10 ml-2" />
                <View className="max-w-[75%] px-4 py-3 bg-gray-200 rounded-2xl rounded-br-md">
                  <Text className="text-base leading-5 text-gray-800">
                    {typingMessage}
                  </Text>
                </View>
                <View className="w-8 h-8 rounded-full bg-green-500 ml-2 items-center justify-center self-end">
                  <Text className="text-white font-bold text-xs">
                    {(currentUser?.name || currentUser?.data?.name || 'You').charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
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
        <View className="bg-white px-4 py-3" style={{ 
          paddingBottom: Math.max(insets.bottom + 12, 20),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
          borderTopWidth: 0.5,
          borderTopColor: '#E5E7EB',
        }}>
          <View className="flex-row items-end space-x-3">
            {/* Message Input Container */}
            <View className="flex-1 bg-gray-100 rounded-full px-4 py-3 flex-row items-end">
              <TextInput
                ref={textInputRef}
                value={newMessage}
                onChangeText={handleTypingChange}
                placeholder="Message..."
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={1000}
                onContentSizeChange={handleInputContentSizeChange}
                onSubmitEditing={handleSendMessage}
                blurOnSubmit={false}
                style={{ 
                  flex: 1,
                  fontSize: 16,
                  lineHeight: 20,
                  maxHeight: 100,
                  minHeight: 20,
                  textAlignVertical: 'center',
                  color: '#1F2937',
                }}
              />
            </View>

            {/* Send Button */}
            <Pressable
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                newMessage.trim() ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              style={{
                shadowColor: newMessage.trim() ? '#3B82F6' : '#9CA3AF',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <Text style={{ 
                color: 'white', 
                fontWeight: '600', 
                fontSize: 16,
                transform: [{ translateX: 1 }]
              }}>
                {isSending ? '⏳' : '➤'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <BottomNavigation />
    </View>
  );
}