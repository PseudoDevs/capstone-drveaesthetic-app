// Test script to send Expo push notifications
// Usage: node test-notification.js "ExponentPushToken[xxxxx]" "Test Message"

const fetch = require('node-fetch');

async function sendExpoPushNotification(expoPushToken, message) {
  const message_data = {
    to: expoPushToken,
    sound: 'default',
    title: 'Dr. Ve Aesthetic App',
    body: message || 'Test notification from your aesthetic app!',
    data: {
      type: 'test',
      message_type: 'test'
    },
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message_data),
    });

    const result = await response.json();
    console.log('Push notification sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

// Command line usage
if (require.main === module) {
  const token = process.argv[2];
  const message = process.argv[3];

  if (!token) {
    console.error('Usage: node test-notification.js "ExponentPushToken[xxxxx]" "Optional message"');
    process.exit(1);
  }

  if (!token.startsWith('ExponentPushToken[')) {
    console.error('Token must be in format: ExponentPushToken[xxxxx]');
    process.exit(1);
  }

  sendExpoPushNotification(token, message)
    .then(() => {
      console.log('✅ Test notification sent successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to send test notification:', error.message);
      process.exit(1);
    });
}

module.exports = { sendExpoPushNotification };