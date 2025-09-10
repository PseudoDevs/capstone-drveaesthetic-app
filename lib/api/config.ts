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
    LIST: '/client/mobile/chat/conversations',
    CREATE: '/client/mobile/chat/conversations',
    GET: (id: string) => `/client/mobile/chat/conversations/${id}`,
    SEND_MESSAGE: '/client/mobile/chat/messages',
    MESSAGES: (conversationId: string) => `/client/mobile/chat/conversations/${conversationId}/messages`,
    SEARCH_STAFF: '/client/chats/search/staff',
  },
  USERS: '/users',
  PROFILE: {
    GET: (userId: number) => `/client/users/${userId}`,
    UPDATE: (userId: number) => `/client/users/${userId}`,
    CHANGE_PASSWORD: '/client/auth/profile',
  },
} as const;