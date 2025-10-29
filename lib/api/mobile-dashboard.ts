import { apiClient } from './client';
import { API_ENDPOINTS } from './config';

export interface MobileDashboardData {
  upcoming_appointments: any[];
  recent_appointments: any[];
  services: any[];
  statistics: {
    total_appointments: number;
    upcoming_appointments: number;
    completed_appointments: number;
    pending_appointments: number;
  };
  notifications: any[];
}

export class MobileDashboardService {
  /**
   * Get mobile dashboard data
   */
  static async getDashboardData(): Promise<MobileDashboardData> {
    return await apiClient.get(API_ENDPOINTS.MOBILE.DASHBOARD);
  }

  /**
   * Get mobile services
   */
  static async getMobileServices(): Promise<any[]> {
    return await apiClient.get(API_ENDPOINTS.MOBILE.SERVICES);
  }

  /**
   * Get mobile appointments
   */
  static async getMobileAppointments(): Promise<any[]> {
    return await apiClient.get(API_ENDPOINTS.MOBILE.APPOINTMENTS);
  }

  /**
   * Get available slots for mobile
   */
  static async getMobileAvailableSlots(serviceId?: number, date?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (serviceId) params.append('service_id', serviceId.toString());
    if (date) params.append('date', date);
    
    const queryString = params.toString();
    const url = queryString 
      ? `${API_ENDPOINTS.MOBILE.AVAILABLE_SLOTS}?${queryString}`
      : API_ENDPOINTS.MOBILE.AVAILABLE_SLOTS;
    
    return await apiClient.get(url);
  }
}
