import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ClinicService, Category, Feedback, User, ClinicServicesResponse, Statistics, RatingStatistics, ClientStatistics } from './types';

export class ClinicServiceApi {
  static async getServices(): Promise<ClinicServicesResponse> {
    const response = await apiClient.get(API_ENDPOINTS.SERVICES);
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
    const response = await apiClient.get(API_ENDPOINTS.CATEGORIES);
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
    appointment_id: number;
    rating: number;
    comment?: string | null;
  }): Promise<Feedback> {
    return await apiClient.post(API_ENDPOINTS.FEEDBACK, data);
  }

  static async getFeedback(id: string): Promise<Feedback> {
    return await apiClient.get(`${API_ENDPOINTS.FEEDBACK}/${id}`);
  }
}

export class UserService {
  static async getUsers(): Promise<User[]> {
    const response = await apiClient.get(API_ENDPOINTS.USERS);
    return response;
  }

  static async getUser(id: string): Promise<User> {
    const endpoint = `${API_ENDPOINTS.USERS}/${id}`;
    const response = await apiClient.get(endpoint);
    return response;
  }

  static async updateUser(id: string, data: Partial<User>): Promise<User> {
    const endpoint = `${API_ENDPOINTS.USERS}/${id}`;
    const response = await apiClient.put(endpoint, data);
    return response;
  }
}

export class ProfileService {
  static async getProfile(userId: number): Promise<User> {
    const endpoint = API_ENDPOINTS.PROFILE.GET(userId);
    const response = await apiClient.get(endpoint);
    return response;
  }

  static async updateProfile(userId: number, data: { name?: string; email?: string; phone?: string; address?: string; date_of_birth?: string; avatar?: string }): Promise<User> {
    const endpoint = API_ENDPOINTS.PROFILE.UPDATE(userId);
    // Send all provided fields to the API
    const apiData = {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.phone && { phone: data.phone }),
      ...(data.address && { address: data.address }),
      ...(data.date_of_birth && { date_of_birth: data.date_of_birth }),
      ...(data.avatar && { avatar: data.avatar }),
    };

    const response = await apiClient.put(endpoint, apiData);
    
    // Handle different response structures
    return response.data || response.user || response;
  }

  static async changePassword(data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> {
    const response = await apiClient.post(API_ENDPOINTS.PROFILE.CHANGE_PASSWORD, data);
    return response;
  }

  static async uploadAvatar(userId: number, imageUri: string): Promise<User> {
    const endpoint = API_ENDPOINTS.PROFILE.UPLOAD_AVATAR(userId);

    // Create FormData for image upload
    const formData = new FormData();

    // Add the image file
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);

    // Make the request with multipart/form-data
    const response = await apiClient.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Handle different response structures
    return response.data || response.user || response;
  }
}

export class StatisticsService {
  static async getDashboardStatistics(): Promise<Statistics> {
    const response = await apiClient.get(API_ENDPOINTS.STATISTICS.DASHBOARD);
    return response.data || response;
  }

  static async getRatingStatistics(): Promise<RatingStatistics> {
    const response = await apiClient.get(API_ENDPOINTS.STATISTICS.RATING);
    return response.data || response;
  }

  static async getClientStatistics(): Promise<ClientStatistics> {
    const response = await apiClient.get(API_ENDPOINTS.STATISTICS.CLIENT_COUNT);
    return response.data || response;
  }

  static async getAverageRating(): Promise<number> {
    try {
      const ratingStats = await this.getRatingStatistics();
      return ratingStats.average_rating || 0;
    } catch (error) {
      console.error('Failed to fetch rating statistics:', error);
      return 0;
    }
  }

  static async getTotalClients(): Promise<number> {
    try {
      const clientStats = await this.getClientStatistics();
      return clientStats.total_clients || 0;
    } catch (error) {
      console.error('Failed to fetch client statistics:', error);
      return 0;
    }
  }
}