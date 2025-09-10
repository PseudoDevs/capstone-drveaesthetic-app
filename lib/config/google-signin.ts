// Google OAuth Configuration for Expo AuthSession
export const GOOGLE_OAUTH_CONFIG = {
  // OAuth 2.0 Client ID from Google Cloud Console
  // You need to create a project in Google Cloud Console and get this ID
  // Go to: https://console.cloud.google.com/apis/credentials
  clientId: '388201848924-0r1e9u2f98enud08ahqhkvmabq7pbudb.apps.googleusercontent.com',

  // OAuth scopes
  scopes: ['openid', 'profile', 'email'],

  // Additional configuration
  responseType: 'code',

  // Redirect URI scheme (should match app.json scheme for mobile)
  redirectScheme: 'capstone-aesthetic-app',
};

// Instructions for setting up Google Sign-In:
/*
1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Enable the Google+ API or Google Identity Services
4. Go to Credentials and create OAuth 2.0 Client IDs:
   - Web application (required)
   - Android app (if building for Android)
   - iOS app (if building for iOS)
5. Replace the client IDs above with your actual client IDs
6. For Android: Add your app's SHA-1 fingerprint
7. For iOS: Add your bundle identifier

To get your Android SHA-1 fingerprint, run:
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

For production, you'll need to use your release keystore.
*/