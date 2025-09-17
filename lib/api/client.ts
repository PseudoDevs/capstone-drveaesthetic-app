import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from './config';

class ApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
          console.log(`🔐 API Request to ${config.url} with Bearer token`);
        } else {
          console.log(`❌ API Request to ${config.url} WITHOUT token`);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('🚨 401 Unauthorized response received');
          console.log('Request URL:', error.config?.url);
          console.log('Current token status:', !!this.authToken);
        } else if (error.response?.status === 403) {
          console.warn('🚫 403 Forbidden response received');
          console.log('Request URL:', error.config?.url);
          console.log('User may not have permission for this resource');
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.authToken = token;
    console.log('🔑 Bearer token set in API client');
  }

  clearAuth() {
    this.authToken = null;
    console.log('🚪 Bearer token cleared from API client');
  }

  hasAuthToken(): boolean {
    return !!this.authToken;
  }

  getAuthTokenPreview(): string {
    return this.authToken ? `${this.authToken.substring(0, 20)}...` : 'No token';
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();