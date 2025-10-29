import { apiClient } from './client';
import { API_ENDPOINTS } from './config';

export interface Prescription {
  id: number;
  client_id: number;
  appointment_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  doctor_notes: string;
  prescribed_by: string;
  prescribed_date: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  appointment?: {
    id: number;
    service: {
      service_name: string;
    };
    appointment_date: string;
  };
}

export interface PrescriptionStatistics {
  total_prescriptions: number;
  active_prescriptions: number;
  completed_prescriptions: number;
  medications_count: number;
  recent_prescriptions: Prescription[];
}

export class PrescriptionService {
  /**
   * Get all prescriptions for the authenticated client
   */
  static async getPrescriptions(): Promise<Prescription[]> {
    return await apiClient.get(API_ENDPOINTS.PRESCRIPTIONS.LIST);
  }

  /**
   * Get prescription statistics
   */
  static async getStatistics(): Promise<PrescriptionStatistics> {
    return await apiClient.get(API_ENDPOINTS.PRESCRIPTIONS.STATISTICS);
  }

  /**
   * Get a specific prescription by ID
   */
  static async getPrescription(id: string): Promise<Prescription> {
    return await apiClient.get(API_ENDPOINTS.PRESCRIPTIONS.GET(id));
  }

  /**
   * Download prescription PDF
   */
  static async downloadPrescription(id: string): Promise<Blob> {
    return await apiClient.get(API_ENDPOINTS.PRESCRIPTIONS.DOWNLOAD(id), {
      responseType: 'blob'
    });
  }
}
