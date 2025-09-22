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
      
      let authUrl: string;
      try {
        // Check if your API has an auth endpoint to generate the redirect URL
        const authResponse = await apiClient.get<{ url: string }>('/client/auth/google/redirect?mobile=1');
        authUrl = authResponse.url;
      } catch (apiError) {
        
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


      // Step 2: Open authentication session
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'https://drveaestheticclinic.online' // Base domain for callback
      );


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


      const response = await apiClient.post<GoogleLoginResponse>(
        API_ENDPOINTS.AUTH.GOOGLE_LOGIN,
        credentials
      );


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
  }

  static async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
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
      console.log('getCurrentUser API response:', response);

      // Check if the API is returning placeholder data
      if (response && this.isPlaceholderData(response)) {
        console.log('API returned placeholder data, ignoring');
        return null; // Don't return placeholder data
      }

      return response;
    } catch (error) {
      console.log('getCurrentUser API error:', error);
      return null;
    }
  }

  // Enhanced placeholder data detection
  static isPlaceholderData(user: any): boolean {
    if (!user) return false;

    const email = user.email?.toLowerCase() || '';
    const name = user.name?.toLowerCase() || '';

    // Only check for very obvious placeholder patterns to avoid false positives
    const strictPlaceholderPatterns = [
      'example.com',
      'test@example',
      'dummy@example',
      'placeholder@example',
      'fake@example',
      'sample@example'
    ];

    // Very strict name patterns - only exact matches
    const strictNamePlaceholderPatterns = [
      'test user',
      'example user',
      'dummy user',
      'placeholder user',
      'john doe',
      'jane doe'
    ];

    // Check email patterns - only exact placeholder domains
    for (const pattern of strictPlaceholderPatterns) {
      if (email.includes(pattern)) {
        return true;
      }
    }

    // Check name patterns - only exact matches to avoid false positives
    for (const pattern of strictNamePlaceholderPatterns) {
      if (name === pattern) {
        return true;
      }
    }

    // Remove the generic ID check as it's too aggressive
    // Real users can have low IDs if they're early users

    return false;
  }

  // Try to get real user data from alternative sources
  static async getRealUserData(): Promise<User | null> {
    try {
      // First try to get from secure storage
      const { AuthStorage } = await import('~/lib/api');
      const cachedUser = await AuthStorage.getUser();

      if (cachedUser && !this.isPlaceholderData(cachedUser)) {
        return cachedUser;
      }

      // Try alternative endpoints if available
      try {
        // If we have cached user ID, try the specific user endpoint
        if (cachedUser?.id) {
          const { ProfileService } = await import('~/lib/api');
          const profileUser = await ProfileService.getProfile(cachedUser.id);

          if (profileUser && !this.isPlaceholderData(profileUser)) {
            return profileUser;
          }
        }
      } catch (profileError) {
        // Fail silently
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Force logout and clear all placeholder data
  static async forceLogoutDueToPlaceholderData(): Promise<void> {
    try {
      // Clear all storage
      const { AuthStorage } = await import('~/lib/api');
      await AuthStorage.clearAll();
      this.clearToken();
    } catch (error) {
      // Fail silently
    }
  }

  static async sendTestNotification(): Promise<void> {
    try {
      // Show a local notification using our notification service
      const NotificationService = (await import('~/lib/notifications/NotificationService')).default;
      await NotificationService.showTestNotification();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send test notification');
    }
  }

  static async getUnreadMessageCount(): Promise<number> {
    try {
      const response = await apiClient.get<{ unread_count: number }>('/client/mobile/chat/unread-count');
      return response.unread_count || 0;
    } catch (error: any) {
      return 0;
    }
  }

  // Simple Google Authentication using WebBrowser (Expo compatible)
  static async authenticateWithGoogleSimple(): Promise<LoginResponse> {
    try {
      
      // Configure WebBrowser
      this.configureWebBrowser();
      
      // Try localhost first since it's added to Google OAuth credentials
      const redirectUri = __DEV__ 
        ? 'http://localhost:8081' 
        : AuthSession.makeRedirectUri({ useProxy: true });
      
      
      // Build auth URL manually (simpler approach)
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: this.GOOGLE_CONFIG.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: this.GOOGLE_CONFIG.scopes.join(' '),
        access_type: 'offline',
        prompt: 'select_account',
      }).toString()}`;


      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type !== 'success') {
        throw new Error(result.type === 'cancel' ? 'Google Sign-In was cancelled' : 'Google Sign-In failed');
      }


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


      if (!tokens.access_token) {
        throw new Error('No access token received');
      }

      // Call your mobile API
      
      const response = await apiClient.post<any>(
        API_ENDPOINTS.AUTH.MOBILE_GOOGLE,
        { access_token: tokens.access_token }
      );


      const loginResponse: LoginResponse = {
        user: response.data.user,
        token: response.data.access_token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      this.setToken(response.data.access_token);
      return loginResponse;

    } catch (error: any) {
      throw new Error(error.message || 'Google Sign-In failed');
    }
  }

  // Modern Google Authentication using PKCE flow (backup method)
  static async authenticateWithGoogleModern(): Promise<LoginResponse> {
    try {
      
      // Step 1: Set up PKCE parameters
      const redirectUri = AuthSession.makeRedirectUri({ 
        scheme: 'capstone-aesthetic-app',
        path: 'auth'
      });
      

      // Generate PKCE challenge
      const codeChallenge = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        AuthSession.makeRandomString(128),
        { encoding: Crypto.CryptoEncoding.BASE64URL }
      );
      
      
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
      
      const authResult = await authRequest.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        useProxy: false, // Don't use deprecated proxy
      });

      
      if (authResult.type !== 'success') {
        throw new Error(authResult.type === 'cancel' ? 'Google Sign-In was cancelled' : 'Google Sign-In failed');
      }

      if (authResult.params.error) {
        throw new Error(`Google Auth Error: ${authResult.params.error}`);
      }

      if (!authResult.params.code) {
        throw new Error('No authorization code received from Google');
      }

      
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

      
      if (!tokenResult.accessToken) {
        throw new Error('No access token received from Google');
      }

      // Step 5: Use access token with your mobile API endpoint
      
      const response = await apiClient.post<any>(
        API_ENDPOINTS.AUTH.MOBILE_GOOGLE,
        { access_token: tokenResult.accessToken }
      );


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
      
      throw new Error(error.message || 'Google Sign-In failed');
    }
  }

  // Laravel Socialite pattern implementation (fallback)
  static async authenticateWithGoogleSocialite(): Promise<LoginResponse> {
    try {
      await WebBrowser.warmUpAsync();

      
      // Step 1: Open browser to your Laravel Google auth route
      // Add mobile parameters to identify this as a mobile request
      const authUrl = 'https://drveaestheticclinic.online/auth/google?mobile=1&app_scheme=capstone-aesthetic-app&redirect_success=capstone-aesthetic-app://auth/success';
      
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'capstone-aesthetic-app://' // Expect redirect back to app scheme
      );


      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        
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
          
          let userData = null;
          if (user) {
            try {
              userData = JSON.parse(decodeURIComponent(user));
            } catch (e) {
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
          throw new Error('Authentication successful but Laravel callback needs to provide token for mobile apps');
        }

        throw new Error('Mobile authentication callback did not provide expected data');
      } else if (result.type === 'cancel') {
        throw new Error('Google Sign-In was cancelled');
      } else {
        throw new Error('Google Sign-In failed');
      }
    } catch (error: any) {
      
      throw new Error(error.message || 'Google Sign-In failed');
    } finally {
      await WebBrowser.coolDownAsync();
    }
  }
}