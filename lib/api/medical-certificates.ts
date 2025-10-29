import { apiClient } from './client';
import { API_ENDPOINTS } from './config';

export interface MedicalCertificate {
  id: number;
  client_id: number;
  appointment_id?: number;
  certificate_type: string;
  description: string;
  valid_from: string;
  valid_until: string;
  issued_by: string;
  issued_date: string;
  status: 'active' | 'expired' | 'cancelled';
  file_path?: string;
  created_at: string;
  updated_at: string;
  appointment?: {
    id: number;
    service: {
      service_name: string;
    };
  };
}

export class MedicalCertificateService {
  /**
   * Get all medical certificates for the authenticated client
   */
  static async getCertificates(): Promise<MedicalCertificate[]> {
    return await apiClient.get(API_ENDPOINTS.MEDICAL_CERTIFICATES.LIST);
  }

  /**
   * Get a specific medical certificate by ID
   */
  static async getCertificate(id: string): Promise<MedicalCertificate> {
    return await apiClient.get(API_ENDPOINTS.MEDICAL_CERTIFICATES.GET(id));
  }

  /**
   * Download certificate file
   */
  static async downloadCertificate(id: string): Promise<Blob> {
    return await apiClient.get(`${API_ENDPOINTS.MEDICAL_CERTIFICATES.GET(id)}/download`, {
      responseType: 'blob'
    });
  }
}
