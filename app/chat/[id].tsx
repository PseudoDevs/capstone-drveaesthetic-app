import * as React from 'react';
import { View, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { ChatService, AuthStorage, Message, AuthService, Chat as ChatType } from '~/lib/api';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from '~/lib/icons/ChevronLeft';
import EventSource from 'react-native-sse';

export default function IndividualChatScreen() {
  const { id } = useLocalSearchParams();
  const chatId = typeof id === 'string' ? id : '';
  
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [chat, setChat] = React.useState<ChatType | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [newMessage, setNewMessage] = React.useState('');
  const [eventSource, setEventSource] = React.useState<EventSource | null>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const loadChatData = async () => {
    if (!chatId) return;

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

      // Set token in API client
      const { AuthService: ImportedAuthService } = await import('~/lib/api');
      ImportedAuthService.setToken(token);

      console.log('=== INDIVIDUAL CHAT AUTH DEBUG ===');
      console.log('Chat ID:', chatId);
      console.log('Token available:', !!token);
      console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'N/A');
      console.log('==================================');

      setCurrentUser(userData);

      // Load messages for this conversation using mobile API
      const messagesResult = await ChatService.getConversationMessages(chatId);
      const messagesList = messagesResult.messages || [];
      
      setMessages(messagesList.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));

      const userId = userData?.data?.id || userData?.id;
      if (userId && token) {
        // Set up SSE for real-time messaging
        setupSSE(token, chatId);
      }

    } catch (error: any) {
      console.error('Failed to load chat data:', error);
      if (error.response?.status === 401) {
        await AuthStorage.clearAll();
        router.replace('/login');
        return;
      }
      setError('Failed to load chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadChatData();

    return () => {
      // Cleanup SSE connection
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [chatId]);

  React.useEffect(() => {
    // Auto scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const setupSSE = (token: string, chatId: string) => {
    // Close existing SSE connection
    if (eventSource) {
      eventSource.close();
    }

    try {
      const newEventSource = ChatService.createMessageStream(token, chatId);

      newEventSource.onopen = () => {
        console.log('✅ SSE connected for chat:', chatId);
      };

      newEventSource.onmessage = (event) => {
        try {
          const messageData = JSON.parse(event.data);
          console.log('💬 New message received via SSE:', messageData);
          
          setMessages(prevMessages => {
            // Avoid duplicate messages
            const exists = prevMessages.some(msg => msg.id === messageData.id);
            if (exists) return prevMessages;
            
            return [...prevMessages, messageData].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
          
          // Auto scroll to bottom
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        } catch (parseError) {
          console.error('Failed to parse SSE message:', parseError);
        }
      };

      newEventSource.onerror = (error) => {
        console.error('❌ SSE connection error:', error);
        // Attempt to reconnect after a delay
        setTimeout(() => {
          setupSSE(token, chatId);
        }, 5000);
      };

      setEventSource(newEventSource);
    } catch (error) {
      console.error('Failed to setup SSE:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const messageData = {
        message: messageText,
        message_type: 'text',
      };

      const sentMessage = await ChatService.sendMessage(messageData);
      
      // Add message to local state (real-time update will also handle this, but this provides immediate feedback)
      setMessages(prevMessages => {
        // Avoid duplicate if real-time already added it
        const exists = prevMessages.some(msg => 
          msg.message === messageText && 
          Math.abs(new Date(msg.created_at).getTime() - Date.now()) < 5000 // Within 5 seconds
        );
        
        if (exists) return prevMessages;
        
        return [...prevMessages, sentMessage].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

    } catch (error: any) {
      console.error('Failed to send message:', error);
      Alert.alert(
        'Send Failed',
        error.response?.data?.message || error.message || 'Failed to send message. Please try again.'
      );
      // Restore the message text if sending failed
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

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
    <KeyboardAvoidingView 
      className="flex-1 bg-secondary/30" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
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
            <Button onPress={loadChatData}>
              <Text>Try Again</Text>
            </Button>
          </View>
        )}

        {!isLoading && !error && (
          <View className="space-y-4">
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
                  <Text className="text-6xl mb-4">💬</Text>
                  <Text className="text-lg font-semibold text-foreground mb-2">
                    No messages yet
                  </Text>
                  <Text className="text-muted-foreground text-center">
                    Start the conversation by sending a message below.
                  </Text>
                </View>
              )
            )}
          </View>
        )}
      </ScrollView>

      {/* Message Input */}
      <View className="bg-background border-t border-border px-4 py-4" style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="flex-row space-x-3 items-end">
          <Input
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            multiline
            maxLength={1000}
            className="flex-1 min-h-[40px] max-h-[120px]"
            textAlignVertical="center"
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={false}
          />
          <Button
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="px-6"
          >
            <Text>
              {isSending ? 'Sending...' : 'Send'}
            </Text>
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}