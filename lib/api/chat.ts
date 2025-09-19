import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import {
  Chat,
  Message,
  SendMessageData,
  Staff,
  MobileChatConversationsResponse,
  MobileChatMessagesResponse,
  MobileChatSendMessageResponse,
} from './types';
// Using polling instead of SSE for better mobile compatibility

export class ChatService {
  // Default staff ID for single staff clinic
  private static readonly DEFAULT_STAFF_ID = 1;
  
  static getDefaultStaffId(): number {
    return this.DEFAULT_STAFF_ID;
  }
  static async getConversations(page = 1, limit = 20): Promise<Chat[]> {
    try {
      const response = await apiClient.get<MobileChatConversationsResponse>(API_ENDPOINTS.CHATS.CONVERSATIONS, {
        params: { page, limit }
      });


      // Handle conversations data - it can be an array or JSON string
      const conversationsData = response.data?.data?.conversations || response.data?.conversations || [];
      let parsedConversations: Chat[] = [];
      
      if (Array.isArray(conversationsData)) {
        // If it's already an array, use it directly
        parsedConversations = conversationsData;
      } else if (typeof conversationsData === 'string' && conversationsData) {
        // If it's a JSON string, parse it
        try {
          parsedConversations = JSON.parse(conversationsData);
        } catch (parseError) {
          // Failed to parse conversations JSON string - return empty array
          parsedConversations = [];
        }
      } else {
        // Empty or null
        parsedConversations = [];
      }
      
      return parsedConversations;
    } catch (error: any) {
      // If 404, it means no conversations exist yet, return empty array
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  static async getConversationMessages(chatId: string, page = 1, limit = 50): Promise<{ messages: Message[], chatInfo?: any }> {
    try {
      const response = await apiClient.get<MobileChatMessagesResponse>(API_ENDPOINTS.CHATS.CONVERSATION_MESSAGES(chatId), {
        params: { page, limit }
      });


      // Handle messages data - it can be an array or JSON string
      const messagesData = response.data?.data?.messages || response.data?.messages || [];
      const chatInfo = response.data?.data?.chat_info || response.data?.chat_info;
      
      let parsedMessages: Message[] = [];
      
      if (Array.isArray(messagesData)) {
        // If it's already an array, use it directly
        parsedMessages = messagesData;
      } else if (typeof messagesData === 'string' && messagesData) {
        // If it's a JSON string, parse it
        try {
          parsedMessages = JSON.parse(messagesData);
        } catch (parseError) {
          // Failed to parse messages JSON string - return empty array
          parsedMessages = [];
        }
      } else {
        // Empty or null
        parsedMessages = [];
      }
      
      return {
        messages: parsedMessages,
        chatInfo
      };
    } catch (error: any) {
      // If 404, it means no messages exist yet, return empty array
      if (error.response?.status === 404) {
        return { messages: [] };
      }
      throw error;
    }
  }

  static async sendMessage(data: SendMessageData): Promise<{ message: Message, chatId: number }> {
    const response = await apiClient.post<MobileChatSendMessageResponse>(API_ENDPOINTS.CHATS.SEND_MESSAGE, data);
    
    return {
      message: (response.data?.data?.message || response.data?.message) as Message,
      chatId: response.data?.data?.chat_id || response.data?.chat_id
    };
  }

  static async markAsRead(chatId: string): Promise<void> {
    const response = await apiClient.post(API_ENDPOINTS.CHATS.MARK_READ(chatId));
    
    return response.data || response;
  }

  static async setTyping(chatId: string, isTyping: boolean): Promise<void> {
    const response = await apiClient.post(API_ENDPOINTS.CHATS.TYPING(chatId), {
      is_typing: isTyping
    });
    
    return response.data || response;
  }

  static async sendIntroMessage(chatId: string): Promise<Message> {
    const response = await apiClient.post(API_ENDPOINTS.CHATS.INTRO_MESSAGE(chatId));
    
    return (response.data?.data?.message || response.data?.message) as Message;
  }

  static async getUnreadCount(): Promise<{ count: number }> {
    const response = await apiClient.get(API_ENDPOINTS.CHATS.UNREAD_COUNT);
    
    return response.data || response;
  }

  static async searchUsers(query?: string): Promise<Staff[]> {
    const url = query
      ? `${API_ENDPOINTS.CHATS.SEARCH_USERS}?query=${encodeURIComponent(query)}`
      : API_ENDPOINTS.CHATS.SEARCH_USERS;

    const response = await apiClient.get(url);
    
    return response.data || response;
  }

  // SSE methods removed - using polling for better mobile compatibility
  // The mobile app now uses periodic polling to check for new messages
  // This provides more reliable real-time updates on mobile devices
}