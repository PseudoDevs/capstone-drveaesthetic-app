import { apiClient } from './client';
import { API_ENDPOINTS, API_CONFIG } from './config';
import { LoginCredentials, LoginResponse, User, RegisterCredentials, RegisterResponse, GoogleLoginCredentials, GoogleLoginResponse } from './types';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

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

  // Configure WebBrowser for authentication
  static configureWebBrowser() {
    WebBrowser.maybeCompleteAuthSession();
  }

  static async authenticateWithGoogleBrowser(): Promise<LoginResponse> {
    try {
      // Complete warm up for Android
      await WebBrowser.warmUpAsync();

      // Step 1: Get Google redirect URL from your Laravel API (following Socialite pattern)
      console.log('=== FETCHING GOOGLE AUTH URL FROM API ===');
      
      let authUrl: string;
      try {
        // Check if your API has an auth endpoint to generate the redirect URL
        const authResponse = await apiClient.get<{ url: string }>('/client/auth/google/redirect?mobile=1');
        authUrl = authResponse.url;
        console.log('Got auth URL from API:', authUrl);
      } catch (apiError) {
        console.log('API redirect endpoint not available, using direct Google URL');
        
        // Fallback: Build the auth URL directly (your current web approach)
        const redirectUri = 'https://drveaestheticclinic.online/auth/google/callback';
        authUrl = `https://accounts.google.com/o/oauth2/auth/oauthchooseaccount?${new URLSearchParams({
          client_id: this.GOOGLE_CONFIG.clientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: this.GOOGLE_CONFIG.scopes.join(' '),
          state: 'mobile_app', // Identify as mobile request
          service: 'lso',
          o2v: '1',
          flowName: 'GeneralOAuthFlow'
        }).toString()}`;
      }

      console.log('=== GOOGLE BROWSER AUTH URL ===');
      console.log('Auth URL:', authUrl);
      console.log('===============================');

      // Step 2: Open authentication session
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'https://drveaestheticclinic.online' // Base domain for callback
      );

      console.log('=== GOOGLE BROWSER AUTH RESULT ===');
      console.log('Result type:', result.type);
      if (result.type === 'success') {
        console.log('Result URL:', result.url);
      }
      console.log('==================================');

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);

        // Check if we got tokens directly from the callback
        const accessToken = url.searchParams.get('access_token');
        const idToken = url.searchParams.get('id_token');
        const error = url.searchParams.get('error');

        if (error) {
          throw new Error(`Google Auth Error: ${error}`);
        }

        if (accessToken) {
          // If we got tokens directly, use them
          console.log('=== TOKENS FROM CALLBACK ===');
          console.log('Access Token Present:', !!accessToken);
          console.log('ID Token Present:', !!idToken);
          console.log('============================');

          return await this.loginWithGoogleToken(accessToken, idToken || undefined);
        } else {
          // If no tokens but success, it means the web API handled authentication
          // Check for a token parameter or user parameter in the URL
          const token = url.searchParams.get('token');
          const user = url.searchParams.get('user');

          if (token) {
            // Parse user data if provided
            let userData = null;
            if (user) {
              try {
                userData = JSON.parse(decodeURIComponent(user));
              } catch (e) {
                console.warn('Failed to parse user data from URL');
              }
            }

            const loginResponse: LoginResponse = {
              user: userData,
              token: token,
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            };

            // Set token in API client
            this.setToken(token);

            return loginResponse;
          } else {
            // Check for auth code to exchange for tokens
            const code = url.searchParams.get('code');
            const state = url.searchParams.get('state');

            if (code) {
              console.log('=== EXCHANGING AUTH CODE ===');
              console.log('Auth code present, exchanging for tokens...');
              console.log('============================');

              // Exchange the authorization code for tokens using Google's token endpoint
              try {
                const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: new URLSearchParams({
                    client_id: this.GOOGLE_CONFIG.clientId,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUri,
                  }),
                });

                const tokens = await tokenResponse.json();

                if (!tokenResponse.ok || tokens.error) {
                  throw new Error(`Token exchange failed: ${tokens.error || 'Unknown error'}`);
                }

                if (tokens.access_token) {
                  // Use the tokens to authenticate with your API
                  return await this.loginWithGoogleToken(tokens.access_token, tokens.id_token);
                } else {
                  throw new Error('No access token received from Google');
                }
              } catch (exchangeError) {
                console.error('Failed to exchange auth code:', exchangeError);
                throw new Error('Failed to complete Google authentication');
              }
            } else {
              throw new Error('No authentication data received from callback');
            }
          }
        }
      } else if (result.type === 'cancel') {
        throw new Error('Google Sign-In was cancelled');
      } else {
        throw new Error('Google Sign-In failed');
      }
    } catch (error: any) {
      console.error('=== GOOGLE BROWSER SIGN-IN ERROR ===');
      console.error('Error:', error);
      console.error('====================================');

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
      console.log('Request Data:', JSON.stringify(credentials, null, 2));
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
      console.log('Access Token:', response.access_token ? 'Present' : 'Missing');
      console.log('Token Type:', response.token_type);
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

      // Provide more specific error messages based on the API response
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 422) {
        throw new Error('Invalid Google token provided');
      } else if (error.response?.status === 401) {
        throw new Error('Google authentication failed');
      } else {
        throw new Error(error.message || 'Google Sign-In failed');
      }
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

  static async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<User>(API_ENDPOINTS.AUTH.PROFILE);
      return response;
    } catch (error) {
      console.warn('Could not get current user:', error);
      return null;
    }
  }

  static async sendTestNotification(): Promise<void> {
    try {
      console.log('=== SENDING TEST NOTIFICATION ===');

      // Show a local notification using our notification service
      const NotificationService = (await import('~/lib/notifications/NotificationService')).default;
      await NotificationService.showTestNotification();

      console.log('Test notification sent successfully');
    } catch (error: any) {
      console.error('Failed to send test notification:', error);
      throw new Error(error.message || 'Failed to send test notification');
    }
  }

  static async getUnreadMessageCount(): Promise<number> {
    try {
      const response = await apiClient.get<{ unread_count: number }>('/client/mobile/chat/unread-count');
      return response.unread_count || 0;
    } catch (error: any) {
      console.error('Failed to get unread message count:', error);
      return 0;
    }
  }

  // Simple Google Authentication using WebBrowser (Expo compatible)
  static async authenticateWithGoogleSimple(): Promise<LoginResponse> {
    try {
      console.log('=== SIMPLE GOOGLE AUTH ===');
      
      // Configure WebBrowser
      this.configureWebBrowser();
      
      // Try localhost first since it's added to Google OAuth credentials
      const redirectUri = __DEV__ 
        ? 'http://localhost:8081' 
        : AuthSession.makeRedirectUri({ useProxy: true });
      
      console.log('=== REDIRECT SETUP ===');
      console.log('Redirect URI:', redirectUri);
      
      // Build auth URL manually (simpler approach)
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: this.GOOGLE_CONFIG.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: this.GOOGLE_CONFIG.scopes.join(' '),
        access_type: 'offline',
        prompt: 'select_account',
      }).toString()}`;

      console.log('=== OPENING BROWSER ===');
      console.log('Auth URL:', authUrl);

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type !== 'success') {
        throw new Error(result.type === 'cancel' ? 'Google Sign-In was cancelled' : 'Google Sign-In failed');
      }

      console.log('=== AUTH SUCCESS ===');
      console.log('Result URL:', result.url);

      // Parse the result URL
      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        throw new Error(`Google Auth Error: ${error}`);
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      console.log('=== EXCHANGING CODE FOR TOKEN ===');

      // Exchange code for token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.GOOGLE_CONFIG.clientId,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokenResponse.ok || tokens.error) {
        throw new Error(`Token exchange failed: ${tokens.error || 'Unknown error'}`);
      }

      console.log('=== TOKEN RECEIVED ===');
      console.log('Access Token Present:', !!tokens.access_token);

      if (!tokens.access_token) {
        throw new Error('No access token received');
      }

      // Call your mobile API
      console.log('=== CALLING MOBILE API ===');
      
      const response = await apiClient.post<any>(
        API_ENDPOINTS.AUTH.MOBILE_GOOGLE,
        { access_token: tokens.access_token }
      );

      console.log('=== API SUCCESS ===');
      console.log('User:', response.data.user.name);

      const loginResponse: LoginResponse = {
        user: response.data.user,
        token: response.data.access_token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      this.setToken(response.data.access_token);
      return loginResponse;

    } catch (error: any) {
      console.error('=== GOOGLE AUTH ERROR ===');
      console.error('Error:', error);
      throw new Error(error.message || 'Google Sign-In failed');
    }
  }

  // Modern Google Authentication using PKCE flow (backup method)
  static async authenticateWithGoogleModern(): Promise<LoginResponse> {
    try {
      console.log('=== MODERN GOOGLE AUTH WITH PKCE ===');
      
      // Step 1: Set up PKCE parameters
      const redirectUri = AuthSession.makeRedirectUri({ 
        scheme: 'capstone-aesthetic-app',
        path: 'auth'
      });
      
      console.log('Redirect URI:', redirectUri);
      
      // Generate PKCE challenge
      const codeChallenge = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        AuthSession.makeRandomString(128),
        { encoding: Crypto.CryptoEncoding.BASE64URL }
      );
      
      console.log('=== PKCE SETUP ===');
      console.log('Code Challenge Generated');
      console.log('Redirect URI:', redirectUri);
      
      // Step 2: Create authorization request
      const authRequestConfig = {
        clientId: this.GOOGLE_CONFIG.clientId,
        scopes: this.GOOGLE_CONFIG.scopes,
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
        codeChallenge,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      };

      const authRequest = new AuthSession.AuthRequest(authRequestConfig);
      
      // Step 3: Open authentication session
      console.log('=== OPENING AUTH SESSION ===');
      
      const authResult = await authRequest.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        useProxy: false, // Don't use deprecated proxy
      });

      console.log('=== AUTH RESULT ===');
      console.log('Type:', authResult.type);
      
      if (authResult.type !== 'success') {
        throw new Error(authResult.type === 'cancel' ? 'Google Sign-In was cancelled' : 'Google Sign-In failed');
      }

      if (authResult.params.error) {
        throw new Error(`Google Auth Error: ${authResult.params.error}`);
      }

      if (!authResult.params.code) {
        throw new Error('No authorization code received from Google');
      }

      console.log('=== AUTHORIZATION CODE RECEIVED ===');
      
      // Step 4: Exchange authorization code for access token
      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId: this.GOOGLE_CONFIG.clientId,
          code: authResult.params.code,
          redirectUri,
          extraParams: {
            code_verifier: authRequest.codeVerifier,
          },
        },
        {
          tokenEndpoint: 'https://oauth2.googleapis.com/token',
        }
      );

      console.log('=== TOKEN EXCHANGE RESULT ===');
      console.log('Access Token Present:', !!tokenResult.accessToken);
      
      if (!tokenResult.accessToken) {
        throw new Error('No access token received from Google');
      }

      // Step 5: Use access token with your mobile API endpoint
      console.log('=== CALLING MOBILE API ENDPOINT ===');
      
      const response = await apiClient.post<any>(
        API_ENDPOINTS.AUTH.MOBILE_GOOGLE,
        { access_token: tokenResult.accessToken }
      );

      console.log('=== MOBILE API RESPONSE ===');
      console.log('Success:', response.success);
      console.log('Message:', response.message);
      console.log('User:', JSON.stringify(response.data.user, null, 2));
      console.log('Token Present:', !!response.data.access_token);

      // Convert to LoginResponse format
      const loginResponse: LoginResponse = {
        user: response.data.user,
        token: response.data.access_token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // Set token in API client
      this.setToken(response.data.access_token);

      return loginResponse;

    } catch (error: any) {
      console.error('=== MODERN GOOGLE AUTH ERROR ===');
      console.error('Error:', error);
      console.error('=================================');
      
      throw new Error(error.message || 'Google Sign-In failed');
    }
  }

  // Laravel Socialite pattern implementation (fallback)
  static async authenticateWithGoogleSocialite(): Promise<LoginResponse> {
    try {
      await WebBrowser.warmUpAsync();

      console.log('=== LARAVEL SOCIALITE GOOGLE AUTH ===');
      
      // Step 1: Open browser to your Laravel Google auth route
      // Add mobile parameters to identify this as a mobile request
      const authUrl = 'https://drveaestheticclinic.online/auth/google?mobile=1&app_scheme=capstone-aesthetic-app&redirect_success=capstone-aesthetic-app://auth/success';
      
      console.log('Opening Laravel Google auth:', authUrl);
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'capstone-aesthetic-app://' // Expect redirect back to app scheme
      );

      console.log('=== AUTH SESSION RESULT ===');
      console.log('Result type:', result.type);
      console.log('Result URL:', result.url);
      console.log('===========================');

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        console.log('=== PARSING CALLBACK URL ===');
        console.log('Scheme:', url.protocol);
        console.log('Host:', url.hostname);
        console.log('Pathname:', url.pathname);
        console.log('Search params:', url.search);
        
        // Check for success indicators in mobile app scheme
        const success = url.searchParams.get('success');
        const token = url.searchParams.get('token');
        const user = url.searchParams.get('user');
        const error = url.searchParams.get('error');

        if (error) {
          throw new Error(`Authentication failed: ${error}`);
        }

        if (token) {
          // Direct token from Laravel callback
          console.log('=== MOBILE AUTH SUCCESS WITH TOKEN ===');
          
          let userData = null;
          if (user) {
            try {
              userData = JSON.parse(decodeURIComponent(user));
            } catch (e) {
              console.warn('Could not parse user data');
            }
          }

          const loginResponse: LoginResponse = {
            user: userData,
            token: token,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          };

          this.setToken(token);
          return loginResponse;
        }

        if (success === 'true') {
          console.log('=== MOBILE AUTH SUCCESS - NO TOKEN ===');
          console.log('Authentication succeeded but no token provided');
          console.log('This means your Laravel callback needs to be updated');
          throw new Error('Authentication successful but Laravel callback needs to provide token for mobile apps');
        }

        throw new Error('Mobile authentication callback did not provide expected data');
      } else if (result.type === 'cancel') {
        throw new Error('Google Sign-In was cancelled');
      } else {
        throw new Error('Google Sign-In failed');
      }
    } catch (error: any) {
      console.error('=== SOCIALITE GOOGLE AUTH ERROR ===');
      console.error('Error:', error);
      console.error('==================================');
      
      throw new Error(error.message || 'Google Sign-In failed');
    } finally {
      await WebBrowser.coolDownAsync();
    }
  }
}