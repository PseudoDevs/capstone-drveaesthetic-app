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
  MOBILE: {
    DASHBOARD: '/client/mobile/dashboard',
    SERVICES: '/client/mobile/services',
    APPOINTMENTS: '/client/mobile/appointments',
    AVAILABLE_SLOTS: '/client/mobile/available-slots',
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
  FEEDBACK: {
    LIST: '/client/feedback',
    CREATE: '/client/feedback',
  },
  CHATS: {
    CONVERSATIONS: '/client/mobile/chat/conversations',
    CONVERSATION_MESSAGES: (chatId: string) => `/client/mobile/chat/conversations/${chatId}/messages`,
    SEND_MESSAGE: '/client/mobile/chat/send-message',
    MARK_READ: (chatId: string) => `/client/mobile/chat/conversations/${chatId}/mark-read`,
    UNREAD_COUNT: '/client/mobile/chat/unread-count',
  },
  MEDICAL_CERTIFICATES: {
    LIST: '/client/medical-certificates',
    GET: (id: string) => `/client/medical-certificates/${id}`,
  },
  BILLING: {
    DASHBOARD: '/client/billing/dashboard',
    HISTORY: '/client/billing/history',
    OUTSTANDING: '/client/billing/outstanding',
    PAY: '/client/billing/pay',
  },
  PRESCRIPTIONS: {
    LIST: '/client/prescriptions',
    STATISTICS: '/client/prescriptions/statistics',
    GET: (id: string) => `/client/prescriptions/${id}`,
    DOWNLOAD: (id: string) => `/client/prescriptions/${id}/download`,
  },
  USERS: '/users',
  PROFILE: {
    GET: (userId: number) => `/client/users/${userId}`,
    UPDATE: (userId: number) => `/client/users/${userId}`,
    CHANGE_PASSWORD: '/client/auth/profile',
    UPLOAD_AVATAR: (userId: number) => `/client/users/${userId}/upload-avatar`,
  },
  STATISTICS: {
    RATING: '/client/statistics/rating',
    CLIENT_COUNT: '/client/statistics/client-count',
    DASHBOARD: '/client/statistics/dashboard',
  },
} as const;