import axios from 'axios';
import { API_CONFIG } from './config';
import { RateLimiter } from '../security/RateLimiter';
import { SecurityHeaders } from '../security/SecurityHeaders';
import { AuditLogger } from '../security/AuditLogger';
import { InputValidator } from '../security/InputValidator';

class ApiClient {
  private client: any;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...SecurityHeaders.getSecurityHeaders(),
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config) => {
        try {
          // Rate limiting check
          const endpoint = config.url || '';
          const isAllowed = await RateLimiter.checkRateLimit(endpoint);
          
          if (!isAllowed) {
            AuditLogger.logSecurityEvent(
              'Rate limit exceeded',
              'HIGH',
              { endpoint, timestamp: new Date().toISOString() }
            );
            throw new Error('Rate limit exceeded. Please try again later.');
          }

          // Add security headers
          config.headers = {
            ...config.headers,
            ...SecurityHeaders.getSecurityHeaders()
          };

          // Add auth token
          if (this.authToken) {
            config.headers.Authorization = `Bearer ${this.authToken}`;
          }

          // Log API request
          AuditLogger.logApiEvent(
            'API_REQUEST',
            endpoint,
            undefined,
            { method: config.method?.toUpperCase() }
          );

          return config;
        } catch (error) {
          AuditLogger.logErrorEvent(
            'API_REQUEST_ERROR',
            error as Error,
            undefined,
            { endpoint: config.url }
          );
          return Promise.reject(error);
        }
      },
      (error) => {
        AuditLogger.logErrorEvent(
          'API_REQUEST_INTERCEPTOR_ERROR',
          error,
          undefined,
          { error: error.message }
        );
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        // Log successful API response
        AuditLogger.logApiEvent(
          'API_RESPONSE_SUCCESS',
          response.config?.url || '',
          undefined,
          { status: response.status }
        );
        return response;
      },
      (error) => {
        // Log API errors
        AuditLogger.logErrorEvent(
          'API_RESPONSE_ERROR',
          error,
          undefined,
          {
            status: error.response?.status,
            endpoint: error.config?.url,
            message: error.message
          }
        );
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuth() {
    this.authToken = null;
  }

  hasAuthToken(): boolean {
    return !!this.authToken;
  }

  getAuthTokenPreview(): string {
    return this.authToken ? `${this.authToken.substring(0, 20)}...` : 'No token';
  }

  async get<T = any>(url: string, config?: any): Promise<T> {
    const response: any = await this.client.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    console.log('🌐 API POST Request:', url);
    console.log('🌐 Request Data:', JSON.stringify(data, null, 2));
    const response: any = await this.client.post(url, data, config);
    console.log('🌐 API Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response: any = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response: any = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: any): Promise<T> {
    const response: any = await this.client.delete(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();