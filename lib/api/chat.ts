import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import {
  Chat,
  Message,
  CreateChatData,
  SendMessageData,
  Staff,
  PaginatedResponse,
} from './types';

export class ChatService {
  static async getChats(): Promise<Chat[]> {
    console.log('=== GET CHATS API CALL ===');
    console.log('Endpoint:', API_ENDPOINTS.CHATS.LIST);
    console.log('=========================');
    
    const response = await apiClient.get(API_ENDPOINTS.CHATS.LIST);
    
    console.log('=== GET CHATS API RESPONSE ===');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('==============================');
    
    return response.data || response;
  }

  static async createChat(data: CreateChatData): Promise<Chat> {
    console.log('=== CREATE CHAT API CALL ===');
    console.log('Endpoint:', API_ENDPOINTS.CHATS.CREATE);
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('============================');
    
    const response = await apiClient.post(API_ENDPOINTS.CHATS.CREATE, data);
    
    console.log('=== CREATE CHAT API RESPONSE ===');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('================================');
    
    return response.data || response;
  }

  static async getChat(id: string): Promise<Chat> {
    console.log('=== GET CHAT API CALL ===');
    console.log('Endpoint:', API_ENDPOINTS.CHATS.GET(id));
    console.log('Chat ID:', id);
    console.log('=========================');
    
    const response = await apiClient.get(API_ENDPOINTS.CHATS.GET(id));
    
    console.log('=== GET CHAT API RESPONSE ===');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('=============================');
    
    return response.data || response;
  }

  static async sendMessage(data: SendMessageData): Promise<Message> {
    console.log('=== SEND MESSAGE API CALL ===');
    console.log('Endpoint:', API_ENDPOINTS.CHATS.SEND_MESSAGE);
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('=============================');
    
    const response = await apiClient.post(API_ENDPOINTS.CHATS.SEND_MESSAGE, data);
    
    console.log('=== SEND MESSAGE API RESPONSE ===');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('=================================');
    
    return response.data || response;
  }

  static async getMessages(conversationId: string): Promise<Message[]> {
    console.log('=== GET MESSAGES API CALL (Mobile) ===');
    console.log('Endpoint:', API_ENDPOINTS.CHATS.MESSAGES(conversationId));
    console.log('Conversation ID:', conversationId);
    console.log('======================================');
    
    const response = await apiClient.get(API_ENDPOINTS.CHATS.MESSAGES(conversationId));
    
    console.log('=== GET MESSAGES API RESPONSE (Mobile) ===');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('==========================================');
    
    return response.data || response;
  }

  static async searchStaff(query?: string): Promise<Staff[]> {
    console.log('=== SEARCH STAFF API CALL ===');
    console.log('Endpoint:', API_ENDPOINTS.CHATS.SEARCH_STAFF);
    console.log('Query:', query);
    console.log('=============================');
    
    const url = query 
      ? `${API_ENDPOINTS.CHATS.SEARCH_STAFF}?query=${encodeURIComponent(query)}`
      : API_ENDPOINTS.CHATS.SEARCH_STAFF;
    
    const response = await apiClient.get(url);
    
    console.log('=== SEARCH STAFF API RESPONSE ===');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('=================================');
    
    return response.data || response;
  }
}