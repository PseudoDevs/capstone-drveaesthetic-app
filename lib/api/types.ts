export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'scheduled';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  role?: string;
  google_id?: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expires_at: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
  message: string;
}

export interface GoogleLoginCredentials {
  access_token: string;
  id_token?: string;
}

export interface GoogleLoginResponse {
  success: boolean;
  message: string;
  user: User;
  access_token?: string;
  token_type?: string;
  is_new_user: boolean;
}


export interface Appointment {
  id: number;
  user_id: number;
  service_id: number;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'scheduled';
  notes?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  service?: ClinicService;
}

export interface CreateAppointmentData {
  client_id: number;
  service_id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  medical_form_data?: any;
  notes?: string;
}

export interface BookAppointmentData {
  service_id: number;
  appointment_date: string;
  appointment_time: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  notes?: string;
}

export interface AvailableSlot {
  date: string;
  time: string;
  available: boolean;
}

export interface Category {
  id: number;
  name: string;
  category_name?: string; // Support both field names for API compatibility
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ClinicService {
  id: number;
  service_name: string;
  name?: string;
  description?: string;
  thumbnail?: string;
  duration: string;
  price: number;
  status: string;
  category: {
    id: number;
    category_name: string;
  };
  staff: {
    id: number;
    name: string;
  };
  appointments_count: string;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: number;
  user_id: number;
  appointment_id?: number;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  appointment?: Appointment;
}

export interface Statistics {
  rating: number;
  client_count: number;
  total_services: number;
}

export interface RatingStatistics {
  average_rating: number;
  total_ratings: number;
  rating_breakdown: {
    [key: string]: number;
  };
}

export interface ClientStatistics {
  total_clients: number;
  active_clients: number;
  new_clients_this_month: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: string;
}

export interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ClinicServicesResponse {
  data: ClinicService[];
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface MobileChatPagination {
  current_page: string;
  last_page: string;
  per_page: string;
  total: string;
  has_more: string;
}

export interface MobileChatConversationsResponse {
  success: boolean;
  data: {
    conversations: string;
    pagination: MobileChatPagination;
  };
}

export interface MobileChatMessagesResponse {
  success: boolean;
  data: {
    messages: string;
    chat_info: {
      id: string;
      other_user: {
        id: string;
        name: string;
        avatar: string;
        role: string;
      };
    };
    pagination: MobileChatPagination;
  };
}

export interface MobileChatSendMessageResponse {
  success: boolean;
  data: {
    message: {
      id: string;
      message: string;
      sender_id: string;
      sender: {
        id: string;
        name: string;
        avatar: string;
      };
      is_mine: boolean;
      is_read: boolean;
      created_at: string;
      time_ago: string;
    };
    chat_id: number;
  };
}

export interface Chat {
  id: number;
  staff_id: number;
  client_id: number;
  last_message?: string;
  last_message_time?: string;
  created_at: string;
  updated_at: string;
  staff?: {
    id: number;
    name: string;
    avatar?: string;
    role?: string;
  };
  client?: User;
}

export interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
  sender?: User;
  receiver?: User;
}

export interface CreateChatData {
  staff_id: number;
  client_id: number;
}

export interface SendMessageData {
  conversation_id?: string;
  receiver_id: number;
  message: string;
  message_type?: string;
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  specialization?: string;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: number;
  client_id: number;
  appointment_id?: number;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_date?: string;
  description: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
  appointment?: Appointment;
}

export interface Payment {
  id: number;
  bill_id: number;
  amount: number;
  payment_method: string;
  payment_date: string;
  transaction_id?: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  updated_at: string;
  bill?: Bill;
}