# Dr. Ve Aesthetic App - Claude Code Documentation

## AJAX-Based Notification System

### Overview
This app implements a lightweight notification system using AJAX polling instead of Firebase/FCM. It works seamlessly in Expo Go and doesn't require external push notification services. The system polls the backend for new messages and shows Alert-based notifications when new messages are received.

### Features Implemented
- ✅ AJAX-based message polling system
- ✅ Alert-based notification display (works in Expo Go)
- ✅ Unread message count tracking
- ✅ Navigation from notifications to relevant screens
- ✅ Test notification functionality
- ✅ Authentication-aware notification management
- ✅ Automatic polling start/stop on login/logout
- ✅ Compatible with Expo Go for development
- ✅ No external dependencies (removed expo-notifications)

### Key Files

#### Core Notification Service
- `lib/notifications/NotificationService.ts` - Simple notification service using Alert API
- `components/NotificationHandler.tsx` - React component for notification handling
- `lib/context/AuthContext.tsx` - Authentication context with notification integration

#### AJAX Polling Service
- `lib/services/ChatPollingService.ts` - Polls backend every 5 seconds for new messages
  - Tracks message IDs to detect new messages
  - Shows notifications for messages from other users
  - Updates unread count automatically

#### API Integration
- `lib/api/auth.ts` - API endpoints:
  - `GET /client/mobile/chat/unread-count` - Get unread message count
  - `GET /client/mobile/chat/conversations` - Get conversations for polling

#### UI Integration
- `components/BottomNavigation.tsx` - Shows unread count badge on chat tab
- `app/profile.tsx` - Test notification button in settings
- `app/_layout.tsx` - AuthProvider wrapper for global state

### Configuration Files
- `app.json` - Expo configuration (removed notification plugins)
- `package.json` - Dependencies: removed `expo-notifications`, `expo-device`

### Usage
1. **Login**: Chat polling service automatically starts
2. **Notifications**: Alert-based notifications shown when new messages are received
3. **Navigation**: Tapping "Open Chat" in alerts navigates to relevant chat screen
4. **Unread Count**: Real-time unread message count with badge on navigation
5. **Test**: Use "Test Notification" button in Profile > Support & Information
6. **Logout**: Polling service automatically stops

### Development Commands
- `npm run dev` - Start development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator

### Backend API Requirements
The backend should provide:
- Unread message count endpoint
- Conversations list endpoint with last message info
- Chat message endpoints for the polling system

### How It Works

#### Polling System
1. **Login**: `ChatPollingService` starts polling every 5 seconds
2. **Message Detection**: Compares message IDs to detect new messages
3. **Notification Display**: Shows Alert for new messages from other users
4. **Navigation**: Alert buttons allow navigation to chat screens
5. **Unread Count**: Updates badge count automatically

#### Notification Flow
1. User receives a new message on backend
2. Polling service detects new message via AJAX
3. `NotificationService.showChatNotification()` displays Alert
4. User can tap "Open Chat" to navigate to conversation
5. Unread count updates automatically

### Development-Friendly Features
- ✅ **Works in Expo Go**: No development build needed
- ✅ **No external services**: No Firebase, FCM, or push token management
- ✅ **Simple debugging**: All notifications shown as console logs + alerts
- ✅ **Instant testing**: Test notifications via profile screen
- ✅ **Automatic cleanup**: Polling stops on logout

### Quick Start for Development
1. **Login**: Polling starts automatically
2. **Test Notifications**: Use test button in Profile settings
3. **Simulate Messages**: Chat polling detects real backend messages
4. **Navigate**: Tap notification alerts to open relevant screens