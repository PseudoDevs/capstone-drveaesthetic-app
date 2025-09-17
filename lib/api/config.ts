export const API_CONFIG = {
  BASE_URL: 'https://drveaestheticclinic.online/api',
  TIMEOUT: 10000,
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/client/auth/login',
    REGISTER: '/client/auth/register',
    LOGOUT: '/client/auth/logout',
    PROFILE: '/client/auth/profile',
    GOOGLE_LOGIN: '/client/auth/google-login',
    MOBILE_GOOGLE: '/mobile/auth/google/token',
  },
  APPOINTMENTS: {
    LIST: '/client/appointments',
    CLIENT_APPOINTMENTS: (clientId: number) => `/client/users/${clientId}/appointments`,
    CREATE: '/client/appointments',
    GET: (id: string) => `/client/appointments/${id}`,
    UPDATE: (id: string) => `/client/appointments/${id}`,
    DELETE: (id: string) => `/client/appointments/${id}`,
    BOOK: '/client/appointments/book',
    AVAILABLE_SLOTS: '/client/appointments/available-slots',
  },
  SERVICES: '/client/services',
  CATEGORIES: '/client/categories',
  FEEDBACK: '/client/feedback',
  CHATS: {
    CONVERSATIONS: '/client/mobile/chat/conversations',
    CONVERSATION_MESSAGES: (chatId?: string) => chatId ? `/client/mobile/chat/conversations/${chatId}/messages` : '/client/mobile/chat/conversations/messages',
    SEND_MESSAGE: '/client/mobile/chat/send-message',
    INTRO_MESSAGE: (chatId: string) => `/client/mobile/chat/conversations/${chatId}/intro-message`,
    MARK_READ: (chatId: string) => `/client/mobile/chat/conversations/${chatId}/mark-read`,
    TYPING: (chatId: string) => `/client/mobile/chat/conversations/${chatId}/typing`,
    UNREAD_COUNT: '/client/mobile/chat/unread-count',
    SEARCH_USERS: '/client/mobile/chat/search-users',
    STREAM_MESSAGES: '/client/mobile/chat/stream/messages',
    STREAM_CONVERSATIONS: '/client/mobile/chat/stream/conversations',
  },
  USERS: '/users',
  PROFILE: {
    GET: (userId: number) => `/client/users/${userId}`,
    UPDATE: (userId: number) => `/client/users/${userId}`,
    CHANGE_PASSWORD: '/client/auth/profile',
    UPLOAD_AVATAR: (userId: number) => `/client/users/${userId}/upload-avatar`,
  },
} as const;