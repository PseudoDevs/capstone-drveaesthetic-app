import Pusher from 'pusher-js';

// Pusher configuration - you may need to get these from your backend
const PUSHER_CONFIG = {
  key: '4a380bb33392ed03be41', // Replace with actual Pusher app key
  cluster: 'ap1', // Replace with your Pusher cluster
  authEndpoint: 'https://drveaestheticclinic.online/api/broadcasting/auth',
  auth: {
    headers: {
      Authorization: '', // Will be set dynamically
    },
  },
  enabledTransports: ['ws', 'wss'],
};

let pusherInstance: Pusher | null = null;

export class PusherService {
  static getInstance(): Pusher {
    if (!pusherInstance) {
      pusherInstance = new Pusher(PUSHER_CONFIG.key, {
        cluster: PUSHER_CONFIG.cluster,
        authEndpoint: PUSHER_CONFIG.authEndpoint,
        auth: PUSHER_CONFIG.auth,
        enabledTransports: PUSHER_CONFIG.enabledTransports,
        forceTLS: true,
      });

      // Add connection event listeners
      pusherInstance.connection.bind('connected', () => {
        console.log('✅ Pusher connected');
      });

      pusherInstance.connection.bind('disconnected', () => {
        console.log('❌ Pusher disconnected');
      });

      pusherInstance.connection.bind('error', (error: any) => {
        console.error('❌ Pusher connection error:', error);
      });
    }
    
    return pusherInstance;
  }

  static setAuthToken(token: string) {
    if (pusherInstance) {
      pusherInstance.config.auth.headers.Authorization = `Bearer ${token}`;
    }
    PUSHER_CONFIG.auth.headers.Authorization = `Bearer ${token}`;
  }

  static disconnect() {
    if (pusherInstance) {
      pusherInstance.disconnect();
      pusherInstance = null;
    }
  }

  static subscribeToChannel(channelName: string) {
    const pusher = this.getInstance();
    console.log(`🔔 Subscribing to channel: ${channelName}`);
    return pusher.subscribe(channelName);
  }

  static unsubscribeFromChannel(channelName: string) {
    const pusher = this.getInstance();
    console.log(`🔕 Unsubscribing from channel: ${channelName}`);
    pusher.unsubscribe(channelName);
  }
}

export const subscribeToChatChannel = (chatId: number, userId: number) => {
  // Subscribe to private chat channel
  const channelName = `private-chat.${chatId}`;
  const channel = PusherService.subscribeToChannel(channelName);
  
  return channel;
};

export const subscribeToUserChannel = (userId: number) => {
  // Subscribe to private user channel for notifications
  const channelName = `private-user.${userId}`;
  const channel = PusherService.subscribeToChannel(channelName);
  
  return channel;
};