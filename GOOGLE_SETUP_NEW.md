# Google Sign-In Setup Instructions

## Using @react-native-google-signin/google-signin Package

### Prerequisites

1. **Google Cloud Console Account**: You need access to Google Cloud Console
2. **Project Setup**: Create or select a project in Google Cloud Console
3. **Backend API**: Google login endpoint is available at `/client/auth/google-login`

### Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sign-In API**

### Step 2: Configure OAuth 2.0 Credentials

The app is already configured with:
- **Client ID**: `388201848924-0r1e9u2f98enud08ahqhkvmabq7pbudb.apps.googleusercontent.com`

### Benefits of This Package

✅ **Cross-Platform**: Works on Android, iOS, and Web
✅ **Simplified Setup**: No complex redirect URI configuration needed
✅ **Native Integration**: Uses native Google Sign-In SDKs
✅ **Automatic Token Handling**: Handles token refresh automatically
✅ **Web Support**: Works with Expo web builds

### API Integration

The app integrates with your backend API:

**Endpoint**: `POST /client/auth/google-login`

**Request Body**:
```json
{
  "access_token": "google_id_token_here",
  "id_token": "google_id_token_here"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": { /* user data */ },
  "access_token": "your_api_token_here",
  "token_type": "Bearer",
  "is_new_user": false
}
```

### How It Works

1. **User clicks Google Sign-In** → Opens native Google authentication
2. **Google authentication completes** → Returns user info and tokens
3. **App sends ID token** → To your `/client/auth/google-login` endpoint
4. **Backend validates token** → Creates/authenticates user
5. **Returns API token** → For subsequent API requests

### Testing

The Google Sign-In should now work much more reliably across all platforms without the complex OAuth flow setup!