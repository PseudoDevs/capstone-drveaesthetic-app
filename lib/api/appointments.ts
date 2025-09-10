import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import {
  Appointment,
  CreateAppointmentData,
  BookAppointmentData,
  AvailableSlot,
  PaginatedResponse,
} from './types';

export class AppointmentService {
  static async getAppointments(page: number = 1): Promise<PaginatedResponse<Appointment>> {
    return await apiClient.get(`${API_ENDPOINTS.APPOINTMENTS.LIST}?page=${page}`);
  }

  static async getClientAppointments(clientId: number, page: number = 1): Promise<PaginatedResponse<Appointment>> {
    const endpoint = API_ENDPOINTS.APPOINTMENTS.CLIENT_APPOINTMENTS(clientId);
    const queryParams = page > 1 ? `?page=${page}` : '';
    return await apiClient.get(`${endpoint}${queryParams}`);
  }

  static async getAppointment(id: string): Promise<Appointment> {
    return await apiClient.get(API_ENDPOINTS.APPOINTMENTS.GET(id));
  }

  static async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    return await apiClient.post(API_ENDPOINTS.APPOINTMENTS.CREATE, data);
  }

  static async updateAppointment(id: string, data: Partial<CreateAppointmentData>): Promise<Appointment> {
    return await apiClient.put(API_ENDPOINTS.APPOINTMENTS.UPDATE(id), data);
  }

  static async deleteAppointment(id: string): Promise<void> {
    return await apiClient.delete(API_ENDPOINTS.APPOINTMENTS.DELETE(id));
  }

  static async cancelAppointment(id: string): Promise<Appointment> {
    return await apiClient.put(API_ENDPOINTS.APPOINTMENTS.UPDATE(id), { status: 'cancelled' });
  }

  static async bookAppointment(data: BookAppointmentData): Promise<Appointment> {
    return await apiClient.post(API_ENDPOINTS.APPOINTMENTS.BOOK, data);
  }

  static async getAvailableSlots(serviceId?: number, date?: string): Promise<AvailableSlot[]> {
    const params = new URLSearchParams();
    if (serviceId) params.append('service_id', serviceId.toString());
    if (date) params.append('date', date);
    
    const queryString = params.toString();
    const url = queryString 
      ? `${API_ENDPOINTS.APPOINTMENTS.AVAILABLE_SLOTS}?${queryString}`
      : API_ENDPOINTS.APPOINTMENTS.AVAILABLE_SLOTS;
    
    return await apiClient.get(url);
  }
}