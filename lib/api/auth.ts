import { apiClient } from './client';
import { API_ENDPOINTS, API_CONFIG } from './config';
import { LoginCredentials, LoginResponse, User, RegisterCredentials, RegisterResponse, GoogleLoginCredentials, GoogleLoginResponse } from './types';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const apiResponse = await apiClient.post<any>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );
      
      // Transform API response to match LoginResponse interface
      const response: LoginResponse = {
        user: apiResponse.user,
        token: apiResponse.access_token || apiResponse.token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      };
      
      if (response.token) {
        apiClient.setAuthToken(response.token);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  static async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
    try {
      const registrationData: any = {
        name: credentials.name,
        email: credentials.email,
        password: credentials.password,
        password_confirmation: credentials.password_confirmation,
      };

      // Add optional fields if provided
      if (credentials.phone) registrationData.phone = credentials.phone;
      if (credentials.date_of_birth) registrationData.date_of_birth = credentials.date_of_birth;
      if (credentials.address) registrationData.address = credentials.address;

      console.log('=== REGISTRATION REQUEST ===');
      console.log('Endpoint:', API_ENDPOINTS.AUTH.REGISTER);
      console.log('Request data:', JSON.stringify(registrationData, null, 2));
      console.log('============================');

      const apiResponse = await apiClient.post<any>(
        API_ENDPOINTS.AUTH.REGISTER,
        registrationData
      );
      
      // Transform API response to match RegisterResponse interface
      const response: RegisterResponse = {
        user: apiResponse.user,
        token: apiResponse.access_token || apiResponse.token,
        message: apiResponse.message,
      };
      
      // Registration successful, set token if provided
      if (response.token) {
        apiClient.setAuthToken(response.token);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  private static GOOGLE_CONFIG = {
    clientId: '388201848924-0r1e9u2f98enud08ahqhkvmabq7pbudb.apps.googleusercontent.com',
    scopes: ['openid', 'profile', 'email'],
  };

  static async authenticateWithGoogle(): Promise<LoginResponse> {
    try {
      // Complete warm up for Android
      await WebBrowser.warmUpAsync();
      
      // Build the auth URL manually since we can't use hooks in class methods
      const authUrl = `https://accounts.google.com/oauth/authorize?${new URLSearchParams({
        client_id: this.GOOGLE_CONFIG.clientId,
        redirect_uri: 'https://auth.expo.io/@trit3ch/capstone-aesthetic-app',
        response_type: 'code',
        scope: this.GOOGLE_CONFIG.scopes.join(' '),
        access_type: 'offline',
        prompt: 'select_account',
      }).toString()}`;

      console.log('=== GOOGLE AUTH URL ===');
      console.log('Auth URL:', authUrl);
      console.log('Client ID:', this.GOOGLE_CONFIG.clientId);
      console.log('========================');

      // Open authentication session
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'https://auth.expo.io/@trit3ch/capstone-aesthetic-app'
      );
      
      console.log('=== GOOGLE AUTH RESULT ===');
      console.log('Result type:', result.type);
      if (result.type === 'success') {
        console.log('Result URL:', result.url);
      }
      console.log('=========================');

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          throw new Error(`Google Auth Error: ${error}`);
        }

        if (code) {
          // Exchange authorization code for tokens
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: this.GOOGLE_CONFIG.clientId,
              code,
              grant_type: 'authorization_code',
              redirect_uri: 'https://auth.expo.io/@trit3ch/capstone-aesthetic-app',
            }),
          });

          const tokens = await tokenResponse.json();
          
          console.log('=== GOOGLE TOKEN EXCHANGE ===');
          console.log('Token Response Status:', tokenResponse.status);
          console.log('Token Response OK:', tokenResponse.ok);
          console.log('Access Token:', tokens.access_token ? 'Present' : 'Missing');
          console.log('ID Token:', tokens.id_token ? 'Present' : 'Missing');
          console.log('Error:', tokens.error || 'None');
          console.log('Error Description:', tokens.error_description || 'None');
          console.log('Full Token Response:', JSON.stringify(tokens, null, 2));
          console.log('==============================');

          if (!tokenResponse.ok || tokens.error) {
            throw new Error(`Google token exchange failed: ${tokens.error || 'Unknown error'} - ${tokens.error_description || ''}`);
          }

          if (tokens.access_token) {
            // Use the access token to authenticate with your API
            return await this.loginWithGoogleToken(
              tokens.access_token,
              tokens.id_token
            );
          } else {
            throw new Error('Failed to get access token from Google');
          }
        } else {
          throw new Error('No authorization code received');
        }
      } else if (result.type === 'cancel') {
        throw new Error('Google Sign-In was cancelled');
      } else {
        throw new Error('Google Sign-In failed');
      }
    } catch (error: any) {
      console.error('=== GOOGLE SIGN-IN ERROR ===');
      console.error('Error:', error);
      console.error('============================');
      
      throw new Error(error.message || 'Google Sign-In failed');
    } finally {
      await WebBrowser.coolDownAsync();
    }
  }

  static async loginWithGoogleToken(accessToken: string, idToken?: string): Promise<LoginResponse> {
    try {
      const credentials: GoogleLoginCredentials = {
        access_token: accessToken,
        id_token: idToken,
      };

      console.log('=== GOOGLE API LOGIN REQUEST ===');
      console.log('Full URL:', `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE_LOGIN}`);
      console.log('Endpoint:', API_ENDPOINTS.AUTH.GOOGLE_LOGIN);
      console.log('Access Token Length:', accessToken?.length || 0);
      console.log('ID Token Present:', !!idToken);
      console.log('================================');

      const response = await apiClient.post<GoogleLoginResponse>(
        API_ENDPOINTS.AUTH.GOOGLE_LOGIN,
        credentials
      );

      console.log('=== GOOGLE API LOGIN RESPONSE ===');
      console.log('Success:', response.success);
      console.log('Message:', response.message);
      console.log('Is New User:', response.is_new_user);
      console.log('User:', JSON.stringify(response.user, null, 2));
      console.log('=================================');

      // Convert to LoginResponse format
      const loginResponse: LoginResponse = {
        user: response.user,
        token: response.access_token || '',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // Set token if provided
      if (response.access_token) {
        apiClient.setAuthToken(response.access_token);
      }

      return loginResponse;
    } catch (error: any) {
      console.error('=== GOOGLE API LOGIN ERROR ===');
      console.error('Error Message:', error.message);
      console.error('Error Response Status:', error.response?.status);
      console.error('Error Response Headers:', error.response?.headers);
      console.error('Error Response Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Request Config:', error.config);
      console.error('Request URL:', error.config?.url);
      console.error('Request Method:', error.config?.method);
      console.error('Request Data:', error.config?.data);
      console.error('==============================');
      throw error;
    }
  }

  static async signOutGoogle(): Promise<void> {
    // With Expo AuthSession, we just clear local state
    // The actual Google session is handled by the browser
    console.log('Google sign out completed');
  }

  static async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      // Sign out from Google as well
      this.signOutGoogle();
      apiClient.clearAuth();
    }
  }

  static setToken(token: string) {
    apiClient.setAuthToken(token);
  }

  static clearToken() {
    apiClient.clearAuth();
  }
}