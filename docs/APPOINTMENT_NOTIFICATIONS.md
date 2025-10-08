# Appointment Push Notification System

## Overview

The appointment push notification system automatically notifies users when their appointment status changes on the Laravel API backend. This system uses polling to check for status changes and delivers push notifications to the user's device.

## Architecture

### Components

1. **AppointmentPollingService** (`lib/services/AppointmentPollingService.ts`)
   - Polls the Laravel API for appointment status changes
   - Tracks appointment statuses locally
   - Triggers push notifications when status changes are detected
   - Runs in the background and adapts to app state (foreground/background)

2. **NotificationService** (`lib/notifications/NotificationService.ts`)
   - Handles the actual push notification display
   - Manages notification permissions
   - Provides methods for showing different types of notifications (chat, appointments, etc.)

3. **SessionAwareRouter** (`components/SessionAwareRouter.tsx`)
   - Initializes the notification services when user logs in
   - Sets up notification response handlers (when user taps notifications)
   - Cleans up services when user logs out

## How It Works

### 1. Service Initialization

When a user logs in, the `SessionAwareRouter` automatically:
- Requests notification permissions
- Starts the `AppointmentPollingService` with the user's ID
- Sets up notification tap handlers to navigate to the appointments screen

### 2. Polling for Changes

The `AppointmentPollingService`:
- Polls the API every 30 seconds (configurable)
- Fetches the user's appointments via `/client/users/{userId}/appointments`
- Compares current appointment statuses with previously stored statuses
- Detects status changes and triggers notifications

### 3. Status Change Detection

When an appointment status changes:
1. The service detects the change (e.g., `pending` → `confirmed`)
2. Creates a status change object with old/new status and appointment details
3. Calls the callback function (if provided)
4. Shows a push notification with appropriate title and message

### 4. Notification Display

Different notification messages based on status:

- **Confirmed**: "✅ Appointment Confirmed - Your appointment for {service} on {date} has been confirmed."
- **Cancelled**: "❌ Appointment Cancelled - Your appointment for {service} on {date} has been cancelled."
- **Completed**: "✨ Appointment Completed - Your appointment for {service} has been completed. Thank you for visiting Dr. Ve Aesthetic Clinic!"
- **Rescheduled**: "🔄 Appointment Rescheduled - Your appointment has been rescheduled to {date} at {time}."
- **Pending**: "⏳ Appointment Pending - Your appointment for {service} is awaiting confirmation."

### 5. Notification Interaction

When a user taps on an appointment notification:
- The app navigates to the `/appointments` screen
- The user can view their updated appointment details

## Configuration

### Polling Interval

The default polling interval is 30 seconds. You can adjust this:

```typescript
const appointmentPollingService = AppointmentPollingService.getInstance();
appointmentPollingService.setPollingInterval(60000); // 60 seconds
```

**Note**: Minimum polling interval is 10 seconds.

### Status Change Callback

You can provide a callback to handle status changes:

```typescript
appointmentPollingService.startPolling(userId, (change) => {
  console.log('Status changed:', change);
  // Custom logic here
});
```

## API Requirements

The system expects the Laravel API to provide:

### Endpoint: `GET /client/users/{userId}/appointments`

Response format:
```json
{
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "service_id": 5,
      "status": "confirmed",
      "appointment_date": "2025-10-15",
      "appointment_time": "10:00 AM",
      "service": {
        "id": 5,
        "name": "Facial Treatment",
        "description": "...",
        "price": 1000,
        "duration": 60
      }
    }
  ]
}
```

### Expected Status Values

- `pending` - Appointment awaiting confirmation
- `confirmed` - Appointment confirmed by staff
- `cancelled` - Appointment cancelled
- `completed` - Appointment completed
- `rescheduled` - Appointment rescheduled

## Testing

### Manual Testing

1. **Test Notification Display**:
   ```typescript
   import { AppointmentPollingService } from '~/lib/services/AppointmentPollingService';

   const service = AppointmentPollingService.getInstance();
   service.simulateStatusChange(1, 'confirmed');
   ```

2. **Force Check for Changes**:
   ```typescript
   service.forceCheckAppointments();
   ```

3. **Get Service Status**:
   ```typescript
   const status = service.getStatus();
   console.log(status);
   ```

### Integration Testing

1. Create an appointment via the app
2. Change the appointment status in the Laravel admin panel
3. Wait up to 30 seconds (or the configured polling interval)
4. Verify that a push notification appears
5. Tap the notification and verify navigation to appointments screen

## Differences from Chat Notifications

The appointment notification system is **separate** from the chat notification system:

- **Chat notifications**: Triggered when new chat messages arrive
- **Appointment notifications**: Triggered when appointment status changes on the API

Both systems run simultaneously and independently when the user is logged in.

## Performance Considerations

### Battery Usage
- Polling runs every 30 seconds by default
- Polling stops when app is in background to save battery
- Polling resumes when app returns to foreground

### Network Usage
- Each poll makes one API request to fetch appointments
- Only appointments for the current user are fetched
- Response size depends on number of user appointments

### Optimization Tips

1. **Increase polling interval** for less frequent checks (saves battery/network)
2. **Implement push-based notifications** from Laravel backend (ideal solution)
3. **Use pagination** if user has many appointments

## Future Enhancements

1. **Server-sent events (SSE)** or **WebSockets** for real-time updates
2. **Firebase Cloud Messaging (FCM)** for true push notifications from server
3. **Notification preferences** - let users enable/disable appointment notifications
4. **Rich notifications** with action buttons (e.g., "View Details", "Reschedule")
5. **Sound/vibration customization** per notification type

## Troubleshooting

### Notifications not showing

1. Check notification permissions:
   ```typescript
   import * as Notifications from 'expo-notifications';
   const { status } = await Notifications.getPermissionsAsync();
   console.log('Permission status:', status);
   ```

2. Verify service is running:
   ```typescript
   const service = AppointmentPollingService.getInstance();
   console.log('Service status:', service.getStatus());
   ```

3. Check console logs for errors:
   - Look for "🔍 Checking for appointment status changes..."
   - Look for "✨ Status change detected..."

### Notifications showing duplicate

- The service tracks seen appointment IDs to prevent duplicates
- If duplicates occur, the tracking may have been reset
- Check if the service was stopped and restarted

### Status changes not detected

1. Verify API returns correct status values
2. Check polling is active: `service.getStatus().isPolling`
3. Manually trigger check: `service.forceCheckAppointments()`

## Related Files

- `lib/services/AppointmentPollingService.ts` - Main polling service
- `lib/notifications/NotificationService.ts` - Notification display service
- `components/SessionAwareRouter.tsx` - Service initialization
- `lib/api/appointments.ts` - API client for appointments
- `lib/services/ChatPollingService.ts` - Similar service for chat notifications
