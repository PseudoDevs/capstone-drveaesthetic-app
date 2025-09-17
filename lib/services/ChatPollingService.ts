import { AppState, AppStateStatus } from 'react-native';
import { NotificationService } from '~/lib/notifications/NotificationService';
import { AuthService } from '~/lib/api/auth';

interface ChatMessage {
  id: number;
  message: string;
  sender: {
    id: number;
    name: string;
  };
  conversation_id: number;
  created_at: string;
  is_read: boolean;
}

interface ChatConversation {
  id: number;
  title: string;
  last_message?: ChatMessage;
  unread_count: number;
}

export class ChatPollingService {
  private static instance: ChatPollingService;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private lastMessageIds: Set<number> = new Set();
  private notificationService = NotificationService.getInstance();
  private currentUserId: number | null = null;
  private isAppInForeground = true;
  private pollIntervalMs = 5000; // Poll every 5 seconds
  private onUnreadCountUpdate?: (count: number) => void;

  static getInstance(): ChatPollingService {
    if (!ChatPollingService.instance) {
      ChatPollingService.instance = new ChatPollingService();
    }
    return ChatPollingService.instance;
  }

  constructor() {
    this.setupAppStateListener();
  }

  private setupAppStateListener() {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      this.isAppInForeground = nextAppState === 'active';

      if (this.isAppInForeground && this.isPolling) {
        // App came to foreground, do immediate check
        this.checkForNewMessages();
      }
    });
  }

  startPolling(userId: number, onUnreadCountUpdate?: (count: number) => void) {
    if (this.isPolling) {
      this.stopPolling();
    }

    this.currentUserId = userId;
    this.onUnreadCountUpdate = onUnreadCountUpdate;
    this.isPolling = true;

    console.log('🔄 Starting chat polling service for user:', userId);

    // Add a small delay to ensure authentication is fully established
    setTimeout(() => {
      if (this.isPolling) {
        // Do initial check after delay
        this.checkForNewMessages();

        // Set up polling interval
        this.pollingInterval = setInterval(() => {
          this.checkForNewMessages();
        }, this.pollIntervalMs);
      }
    }, 2000); // 2 second delay
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.isPolling = false;
    this.lastMessageIds.clear();
    this.currentUserId = null;

    console.log('⏹️ Chat polling service stopped');
  }

  private async checkForNewMessages() {
    if (!this.isPolling || !this.currentUserId) {
      console.log('🚫 Skipping polling - not polling or no user ID');
      return;
    }

    try {
      console.log('🔍 Checking for new messages... Current user ID:', this.currentUserId);

      // Get unread count first
      let unreadCount = 0;
      try {
        unreadCount = await AuthService.getUnreadMessageCount();
        this.onUnreadCountUpdate?.(unreadCount);
        this.notificationService.setUnreadCount(unreadCount);
        console.log('📊 Unread count:', unreadCount);
      } catch (unreadError: any) {
        console.warn('⚠️ Failed to get unread count (continuing with 0):', unreadError.response?.status || unreadError.message);
        // Continue with 0 unread count if API fails
        this.onUnreadCountUpdate?.(0);
        this.notificationService.setUnreadCount(0);
      }

      // Get recent conversations to check for new messages
      let conversations = [];
      try {
        conversations = await this.getRecentConversations();
        console.log('💬 Found conversations:', conversations.length);
      } catch (conversationsError: any) {
        console.warn('⚠️ Failed to get conversations (continuing with empty list):', conversationsError.response?.status || conversationsError.message);
        // Continue with empty conversations if API fails
        conversations = [];
      }

      if (conversations.length === 0) {
        console.log('📭 No conversations found - user may not have started chatting yet');
        return;
      }

      for (const conversation of conversations) {
        console.log('🔍 Checking conversation:', {
          id: conversation.id,
          title: conversation.title,
          hasLastMessage: !!conversation.last_message,
          unreadCount: conversation.unread_count
        });

        if (conversation.last_message) {
          const messageId = conversation.last_message.id;
          console.log('📝 Last message:', {
            id: messageId,
            senderId: conversation.last_message.sender.id,
            currentUserId: this.currentUserId,
            message: conversation.last_message.message,
            isFromOtherUser: conversation.last_message.sender.id !== this.currentUserId,
            alreadySeen: this.lastMessageIds.has(messageId)
          });

          // Check if this is a new message we haven't seen before
          if (!this.lastMessageIds.has(messageId)) {
            this.lastMessageIds.add(messageId);
            console.log('✅ New message ID added to tracking:', messageId);

            // Check if the message is from someone else (not the current user)
            if (conversation.last_message.sender.id !== this.currentUserId) {
              console.log('🆕 New message detected from other user:', {
                messageId,
                sender: conversation.last_message.sender.name,
                conversation: conversation.title,
                message: conversation.last_message.message
              });

              // Show notification
              await this.showNewMessageNotification(
                conversation.last_message,
                conversation
              );
            } else {
              console.log('📤 New message is from current user, not showing notification');
            }
          } else {
            console.log('🔄 Message already seen, skipping notification');
          }
        } else {
          console.log('📭 No last message in conversation');
        }
      }
    } catch (error) {
      console.error('❌ Error checking for new messages:', error);
    }
  }

  private async getRecentConversations(): Promise<ChatConversation[]> {
    try {
      // Use the ChatService to get conversations with proper error handling
      const { ChatService } = await import('~/lib/api/chat');
      const conversations = await ChatService.getConversations(1, 5);

      console.log('📋 Raw conversations from API:', JSON.stringify(conversations, null, 2));

      if (!conversations || conversations.length === 0) {
        console.log('📭 No conversations found');
        return [];
      }

      // For each conversation, fetch the latest messages to get proper message data
      const conversationsWithMessages: ChatConversation[] = [];

      for (const chat of conversations) {
        try {
          console.log('🔍 Processing chat:', chat.id);

          // Get the latest messages for this conversation
          const messagesResult = await ChatService.getConversationMessages(chat.id.toString(), 1, 1);
          const messages = messagesResult.messages || [];

          console.log('📨 Messages for chat', chat.id, ':', messages.length);

          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            console.log('📝 Last message details:', {
              id: lastMessage.id,
              senderId: lastMessage.sender_id,
              message: lastMessage.message,
              chatId: chat.id
            });

            conversationsWithMessages.push({
              id: chat.id,
              title: chat.staff?.name || 'Dr. Ve Clinic',
              last_message: {
                id: lastMessage.id,
                message: lastMessage.message,
                sender: {
                  id: lastMessage.sender_id,
                  name: lastMessage.sender_id === chat.staff_id ? (chat.staff?.name || 'Dr. Ve Staff') : 'You'
                },
                conversation_id: chat.id,
                created_at: lastMessage.created_at,
                is_read: false // We'll check this separately
              },
              unread_count: 0 // We'll get this from the unread count API
            });
          } else {
            console.log('📭 No messages in chat', chat.id);
            // Still add the conversation but without last_message
            conversationsWithMessages.push({
              id: chat.id,
              title: chat.staff?.name || 'Dr. Ve Clinic',
              last_message: undefined,
              unread_count: 0
            });
          }
        } catch (messageError) {
          console.error('Error fetching messages for chat', chat.id, ':', messageError);
          // Add conversation without last message if we can't fetch messages
          conversationsWithMessages.push({
            id: chat.id,
            title: chat.staff?.name || 'Dr. Ve Clinic',
            last_message: undefined,
            unread_count: 0
          });
        }
      }

      console.log('✅ Processed conversations for polling:', conversationsWithMessages.length);
      return conversationsWithMessages;
    } catch (error) {
      console.error('Error fetching conversations for polling:', error);
      return [];
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const { AuthStorage } = await import('~/lib/api');
      return await AuthStorage.getToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async showNewMessageNotification(message: ChatMessage, conversation: ChatConversation) {
    // Only show notification if app is in background or not focused on chat
    if (this.isAppInForeground) {
      // You can add logic here to check if user is currently viewing this specific chat
      // For now, we'll show notifications even in foreground for demonstration
    }

    const senderName = message.sender.name;
    const messageText = message.message.length > 100
      ? message.message.substring(0, 100) + '...'
      : message.message;

    await this.notificationService.showChatNotification(
      senderName,
      messageText,
      conversation.id.toString()
    );
  }

  // Method to manually trigger a test notification
  async triggerTestNotification() {
    console.log('🧪 Triggering test chat notification...');

    await this.notificationService.showChatNotification(
      'Dr. Ve Clinic',
      'This is a test message to demonstrate push notifications!',
      '1'
    );
  }

  // Method to force check for new messages (for testing)
  async forceCheckMessages() {
    console.log('🔄 Force checking for new messages...');
    await this.checkForNewMessages();
  }

  // Method to simulate a new message (for testing)
  async simulateNewMessage(senderName: string, message: string, conversationId?: string) {
    console.log('🎭 Simulating new message:', { senderName, message, conversationId });

    await this.notificationService.showChatNotification(
      senderName,
      message,
      conversationId || '1'
    );

    // Update unread count
    try {
      const unreadCount = await AuthService.getUnreadMessageCount();
      this.onUnreadCountUpdate?.(unreadCount + 1); // Simulate +1 unread
      this.notificationService.setUnreadCount(unreadCount + 1);
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  }

  // Get polling status
  getStatus() {
    return {
      isPolling: this.isPolling,
      userId: this.currentUserId,
      intervalMs: this.pollIntervalMs,
      messagesTracked: this.lastMessageIds.size,
      isAppInForeground: this.isAppInForeground
    };
  }

  // Update polling interval
  setPollingInterval(intervalMs: number) {
    this.pollIntervalMs = Math.max(1000, intervalMs); // Minimum 1 second

    if (this.isPolling) {
      // Restart polling with new interval
      const userId = this.currentUserId!;
      const callback = this.onUnreadCountUpdate;
      this.stopPolling();
      this.startPolling(userId, callback);
    }

    console.log('🔄 Polling interval updated to:', this.pollIntervalMs, 'ms');
  }
}

export default ChatPollingService.getInstance();