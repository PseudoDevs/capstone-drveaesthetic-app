import { AppointmentService } from './appointments';
import { ConsentWaiverData } from '~/components/ConsentWaiverModal';
import { Appointment } from './types';

/**
 * Consent Waiver Service
 * Uses existing Appointment API to store consent waiver data in consent_waiver_form_data JSON field
 */
export class ConsentWaiverService {
  /**
   * Submit consent waiver by updating appointment with consent_waiver_form_data
   */
  static async submitConsentWaiver(
    appointmentId: number,
    consentData: ConsentWaiverData
  ): Promise<Appointment> {
    try {
      // Update appointment with consent waiver form data
      const updatedAppointment = await AppointmentService.updateAppointment(
        appointmentId.toString(),
        {
          consent_waiver_form_data: consentData,
          // Optionally mark that consent waiver is completed
          // form_completion_status: { consent_waiver: true }
        } as any
      );

      return updatedAppointment;
    } catch (error) {
      console.error('Failed to submit consent waiver:', error);
      throw error;
    }
  }

  /**
   * Get consent waiver data from appointment
   */
  static async getConsentWaiver(appointmentId: number): Promise<ConsentWaiverData | null> {
    try {
      const appointment = await AppointmentService.getAppointment(appointmentId.toString());
      
      // Extract consent waiver data from appointment
      const consentData = (appointment as any).consent_waiver_form_data;
      
      return consentData || null;
    } catch (error) {
      console.error('Failed to get consent waiver:', error);
      throw error;
    }
  }

  /**
   * Check if appointment has consent waiver completed
   */
  static hasConsentWaiver(appointment: Appointment): boolean {
    return !!(appointment as any).consent_waiver_form_data;
  }
}

