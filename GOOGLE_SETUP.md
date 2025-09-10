# Google Sign-In Setup Instructions

## Prerequisites

1. **Google Cloud Console Account**: You need access to Google Cloud Console
2. **Project Setup**: Create or select a project in Google Cloud Console
3. **Backend API**: Google login endpoint is available at `/client/auth/google-login`

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** or **Google Identity Services**

## Step 2: Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**

### For Web Application (Required for Expo)
1. Select **"Web application"**
2. Add name: `Aesthetic Clinic Mobile App`
3. Add authorized JavaScript origins:
   - `http://localhost:19006` (for Expo web)
   - `https://auth.expo.io` (for Expo auth)
4. Add authorized redirect URIs:
   - `https://auth.expo.io/@your-expo-username/capstone-aesthetic-app` (for Expo AuthSession proxy)
   - `http://localhost:19006` (for web development)
5. Copy the **Client ID** - this is your `clientId`

**Important for Expo**: 
- Replace `your-expo-username` with your actual Expo username (you can find this by running `npx expo whoami`)
- Alternative: You can use the project slug format: `https://auth.expo.io/@anonymous/capstone-aesthetic-app` for anonymous projects
- The Expo AuthSession proxy handles the redirect back to your app
- No custom schemes needed in Google Console

**To find your Expo username**: Run `npx expo whoami` in your terminal

**Important**: The redirect URI format for Expo mobile apps should be:
- `your-app-scheme://auth/google`
- Where `your-app-scheme` matches the `scheme` in your `app.json`

### For Android Application
1. Create another OAuth client ID
2. Select **"Android"**
3. Add package name: Check your `app.json` or `expo.json` for the bundle identifier
4. Get your SHA-1 fingerprint:
   ```bash
   # For development (debug keystore)
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # For Windows
   keytool -list -v -keystore %USERPROFILE%\\.android\\debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
5. Copy the **Client ID** - this is your `androidClientId`

### For iOS Application (if needed)
1. Create another OAuth client ID
2. Select **"iOS"**
3. Add bundle identifier from your iOS app configuration
4. Copy the **Client ID** - this is your `iosClientId`

## Step 3: Update Configuration

1. Open `lib/config/google-signin.ts`
2. Replace the placeholder values:
   ```typescript
   export const GOOGLE_SIGNIN_CONFIG = {
     webClientId: 'YOUR_ACTUAL_WEB_CLIENT_ID_HERE',
     androidClientId: 'YOUR_ACTUAL_ANDROID_CLIENT_ID_HERE', // Optional
     iosClientId: 'YOUR_ACTUAL_IOS_CLIENT_ID_HERE', // Optional
     // ... rest of config
   };
   ```

## Step 4: Android Configuration (EAS Build)

For Expo/EAS builds, you may need to create a `google-services.json` file:

1. In Google Cloud Console, go to your project
2. Add an Android app to your Firebase project (if not already done)
3. Download `google-services.json`
4. Place it in your project root or follow Expo's documentation for proper placement

## Step 5: Testing

1. **Development**: Make sure your development server is running
2. **Production**: Make sure your production domains are added to authorized origins
3. Test the Google Sign-In flow in your app

## Common Issues

1. **"Developer Error"**: Usually means the SHA-1 fingerprint doesn't match
2. **"Sign-in failed"**: Check if the correct client IDs are configured
3. **"API not enabled"**: Enable Google+ API or Google Identity Services in Cloud Console

## Security Notes

- Never commit actual client IDs to public repositories
- Use environment variables in production
- Regularly rotate your credentials
- Monitor usage in Google Cloud Console

## API Integration

The app now integrates with your backend API's Google login endpoint:

### Endpoint: `POST /client/auth/google-login`

**Request Body:**
```json
{
  "access_token": "google_access_token_here",
  "id_token": "google_id_token_here" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "avatar_url": "https://...",
    // other user fields
  },
  "access_token": "your_api_token_here",
  "token_type": "Bearer",
  "is_new_user": false
}
```

## Testing the Integration

Once configured, the Google Sign-In will:
1. Authenticate with Google OAuth
2. Get access token and ID token from Google
3. Send tokens to your backend API
4. Receive user data and API token
5. Store API token for subsequent requests