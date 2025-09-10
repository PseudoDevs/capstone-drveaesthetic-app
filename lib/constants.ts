// API Configuration Constants
export const API_CONFIG = {
  // Local development URL - update this for your local machine/network IP
  BASE_URL: 'https://capstone-aestethic.dev/api',
  
  // Alternative URLs for different environments
  // For local network access, you might need to use your machine's IP:
  // BASE_URL: 'https://192.168.1.100/capstone-aesthetic/public/api',
  // BASE_URL: 'http://localhost:8000/api', // if using HTTP
  
  // API Endpoints
  ENDPOINTS: {
    // Authentication
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    
    // User Management
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    CHANGE_PASSWORD: '/user/change-password',
    
    // Services
    SERVICES: '/services',
    SERVICE_DETAIL: '/services', // + /{id}
    
    // Appointments
    APPOINTMENTS: '/appointments',
    CREATE_APPOINTMENT: '/appointments',
    UPDATE_APPOINTMENT: '/appointments', // + /{id}
    CANCEL_APPOINTMENT: '/appointments', // + /{id}/cancel
    
    // Common FilamentPHP/Laravel patterns
    // SANCTUM_CSRF: '/sanctum/csrf-cookie',
  },
  
  // Request Headers
  HEADERS: {
    CONTENT_TYPE: 'application/json',
    ACCEPT: 'application/json',
  },
  
  // Request Timeout
  TIMEOUT: 10000, // 10 seconds
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string, params?: string | number) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  return params ? `${url}/${params}` : url;
};

// Environment detection
export const isDevelopment = __DEV__;

// Navigation Theme Constants
export const NAV_THEME = {
  light: {
    background: 'hsl(0 0% 100%)', // background
    border: 'hsl(240 5.9% 90%)', // border
    card: 'hsl(0 0% 100%)', // card
    notification: 'hsl(0 84.2% 60.2%)', // destructive
    primary: 'hsl(240 5.9% 10%)', // primary
    text: 'hsl(240 10% 3.9%)', // foreground
  },
  dark: {
    background: 'hsl(240 10% 3.9%)', // background
    border: 'hsl(240 3.7% 15.9%)', // border
    card: 'hsl(240 10% 3.9%)', // card
    notification: 'hsl(0 72% 51%)', // destructive
    primary: 'hsl(0 0% 98%)', // primary
    text: 'hsl(0 0% 98%)', // foreground
  },
};
