import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ClinicService, Category, Feedback, User, ClinicServicesResponse } from './types';

export class ClinicServiceApi {
  static async getServices(): Promise<ClinicServicesResponse> {
    console.log('=== SERVICES API CALL ===');
    console.log('Endpoint:', API_ENDPOINTS.SERVICES);
    console.log('Full URL:', `${API_ENDPOINTS.SERVICES}`);
    console.log('=============================');
    
    const response = await apiClient.get(API_ENDPOINTS.SERVICES);
    
    console.log('=== SERVICES API RESPONSE ===');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('==============================');
    
    return response;
  }

  static async getService(id: string): Promise<ClinicService> {
    return await apiClient.get(`${API_ENDPOINTS.SERVICES}/${id}`);
  }

  static async getServicesByCategory(categoryId: number): Promise<ClinicService[]> {
    return await apiClient.get(`${API_ENDPOINTS.SERVICES}?category_id=${categoryId}`);
  }
}

export class CategoryService {
  static async getCategories(): Promise<Category[]> {
    console.log('=== CATEGORIES API CALL ===');
    console.log('Endpoint:', API_ENDPOINTS.CATEGORIES);
    console.log('===========================');
    
    const response = await apiClient.get(API_ENDPOINTS.CATEGORIES);
    
    console.log('=== CATEGORIES API RESPONSE ===');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('===============================');
    
    return response;
  }

  static async getCategory(id: string): Promise<Category> {
    return await apiClient.get(`${API_ENDPOINTS.CATEGORIES}/${id}`);
  }
}

export class FeedbackService {
  static async getFeedbacks(): Promise<Feedback[]> {
    return await apiClient.get(API_ENDPOINTS.FEEDBACK);
  }

  static async createFeedback(data: {
    client_id: number;
    appointment_id?: number;
    rating: number;
    comment?: string;
  }): Promise<Feedback> {
    return await apiClient.post(API_ENDPOINTS.FEEDBACK, data);
  }

  static async getFeedback(id: string): Promise<Feedback> {
    return await apiClient.get(`${API_ENDPOINTS.FEEDBACK}/${id}`);
  }
}

export class UserService {
  static async getUsers(): Promise<User[]> {
    console.log('=== GET USERS API CALL ===');
    console.log('Endpoint:', API_ENDPOINTS.USERS);
    console.log('=========================');
    
    const response = await apiClient.get(API_ENDPOINTS.USERS);
    
    console.log('=== GET USERS API RESPONSE ===');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('==============================');
    
    return response;
  }

  static async getUser(id: string): Promise<User> {
    const endpoint = `${API_ENDPOINTS.USERS}/${id}`;
    console.log('=== GET USER API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('User ID:', id);
    console.log('=========================');
    
    const response = await apiClient.get(endpoint);
    
    console.log('=== GET USER API RESPONSE ===');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('=============================');
    
    return response;
  }

  static async updateUser(id: string, data: Partial<User>): Promise<User> {
    const endpoint = `${API_ENDPOINTS.USERS}/${id}`;
    console.log('=== UPDATE USER API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('User ID:', id);
    console.log('Update data:', JSON.stringify(data, null, 2));
    console.log('============================');
    
    const response = await apiClient.put(endpoint, data);
    
    console.log('=== UPDATE USER API RESPONSE ===');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('================================');
    
    return response;
  }
}

export class ProfileService {
  static async getProfile(userId: number): Promise<User> {
    const endpoint = API_ENDPOINTS.PROFILE.GET(userId);
    console.log('=== GET PROFILE API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('User ID:', userId);
    console.log('============================');
    
    const response = await apiClient.get(endpoint);
    
    console.log('=== GET PROFILE API RESPONSE ===');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('================================');
    
    return response;
  }

  static async updateProfile(userId: number, data: { name?: string; email?: string; phone?: string; address?: string; date_of_birth?: string; avatar?: string }): Promise<User> {
    const endpoint = API_ENDPOINTS.PROFILE.UPDATE(userId);
    console.log('=== UPDATE PROFILE API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('User ID:', userId);
    console.log('Original data:', JSON.stringify(data, null, 2));
    
    // Send all provided fields to the API
    const apiData = {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.phone && { phone: data.phone }),
      ...(data.address && { address: data.address }),
      ...(data.date_of_birth && { date_of_birth: data.date_of_birth }),
      ...(data.avatar && { avatar: data.avatar }),
    };
    
    console.log('API data to send:', JSON.stringify(apiData, null, 2));
    console.log('===============================');
    
    const response = await apiClient.put(endpoint, apiData);
    
    console.log('=== UPDATE PROFILE API RESPONSE ===');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('Response structure check:');
    console.log('response.data exists:', !!response.data);
    console.log('response.user exists:', !!response.user);
    console.log('response type:', typeof response);
    console.log('===================================');
    
    // Handle different response structures
    return response.data || response.user || response;
  }

  static async changePassword(data: { 
    current_password: string; 
    password: string; 
    password_confirmation: string; 
  }): Promise<{ message: string }> {
    console.log('=== CHANGE PASSWORD API CALL ===');
    console.log('Endpoint:', API_ENDPOINTS.PROFILE.CHANGE_PASSWORD);
    console.log('Request data keys:', Object.keys(data));
    console.log('================================');
    
    const response = await apiClient.post(API_ENDPOINTS.PROFILE.CHANGE_PASSWORD, data);
    
    console.log('=== CHANGE PASSWORD API RESPONSE ===');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('====================================');
    
    return response;
  }

  static async uploadAvatar(userId: number, imageUri: string): Promise<User> {
    const endpoint = API_ENDPOINTS.PROFILE.UPLOAD_AVATAR(userId);
    console.log('=== UPLOAD AVATAR API CALL ===');
    console.log('Endpoint:', endpoint);
    console.log('User ID:', userId);
    console.log('Image URI length:', imageUri?.length || 0);
    console.log('==============================');

    // Create FormData for image upload
    const formData = new FormData();
    
    // Add the image file
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);

    console.log('FormData created with avatar image');

    // Make the request with multipart/form-data
    const response = await apiClient.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('=== UPLOAD AVATAR API RESPONSE ===');
    console.log('Response status:', response?.status);
    console.log('Response data keys:', response?.data ? Object.keys(response.data) : 'No data');
    console.log('Avatar URL:', response?.data?.avatar || response?.avatar);
    console.log('==================================');

    // Handle different response structures
    return response.data || response.user || response;
  }
}