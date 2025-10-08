import { AppState, AppStateStatus } from 'react-native';
import { NotificationService } from '~/lib/notifications/NotificationService';
import { AppointmentService } from '~/lib/api/appointments';
import { Appointment } from '~/lib/api/types';

interface AppointmentStatusChange {
  appointmentId: number;
  oldStatus: string | null;
  newStatus: string;
  appointment: Appointment;
}

export class AppointmentPollingService {
  private static instance: AppointmentPollingService;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private appointmentStatuses: Map<number, string> = new Map();
  private notificationService = NotificationService.getInstance();
  private currentUserId: number | null = null;
  private isAppInForeground = true;
  private pollIntervalMs = 30000; // Poll every 30 seconds
  private onStatusChangeCallback?: (change: AppointmentStatusChange) => void;

  static getInstance(): AppointmentPollingService {
    if (!AppointmentPollingService.instance) {
      AppointmentPollingService.instance = new AppointmentPollingService();
    }
    return AppointmentPollingService.instance;
  }

  constructor() {
    this.setupAppStateListener();
  }

  private setupAppStateListener() {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      this.isAppInForeground = nextAppState === 'active';

      if (this.isAppInForeground && this.isPolling) {
        // App came to foreground, do immediate check
        this.checkForAppointmentChanges();
      }
    });
  }

  startPolling(userId: number, onStatusChange?: (change: AppointmentStatusChange) => void) {
    if (this.isPolling) {
      this.stopPolling();
    }

    this.currentUserId = userId;
    this.onStatusChangeCallback = onStatusChange;
    this.isPolling = true;

    console.log('🔄 Starting appointment polling service for user:', userId);

    // Do initial check after a small delay
    setTimeout(() => {
      if (this.isPolling) {
        this.checkForAppointmentChanges();

        // Set up polling interval
        this.pollingInterval = setInterval(() => {
          this.checkForAppointmentChanges();
        }, this.pollIntervalMs);
      }
    }, 2000); // 2 second delay
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.isPolling = false;
    this.appointmentStatuses.clear();
    this.currentUserId = null;

    console.log('⏹️ Appointment polling service stopped');
  }

  private async checkForAppointmentChanges() {
    if (!this.isPolling || !this.currentUserId) {
      console.log('🚫 Skipping appointment polling - not polling or no user ID');
      return;
    }

    try {
      console.log('🔍 Checking for appointment status changes...');

      // Fetch user's appointments
      const response = await AppointmentService.getClientAppointments(this.currentUserId, 1);
      const appointments = response.data || [];

      console.log(`📋 Found ${appointments.length} appointments`);

      // Check each appointment for status changes
      for (const appointment of appointments) {
        const appointmentId = appointment.id;
        const currentStatus = appointment.status;
        const previousStatus = this.appointmentStatuses.get(appointmentId);

        // If we haven't seen this appointment before, just store its status
        if (previousStatus === undefined) {
          this.appointmentStatuses.set(appointmentId, currentStatus);
          console.log(`📝 Tracking new appointment ${appointmentId} with status: ${currentStatus}`);
          continue;
        }

        // Check if status has changed
        if (previousStatus !== currentStatus) {
          console.log(`✨ Status change detected for appointment ${appointmentId}: ${previousStatus} → ${currentStatus}`);

          // Update stored status
          this.appointmentStatuses.set(appointmentId, currentStatus);

          // Create status change object
          const statusChange: AppointmentStatusChange = {
            appointmentId,
            oldStatus: previousStatus,
            newStatus: currentStatus,
            appointment,
          };

          // Trigger callback if provided
          this.onStatusChangeCallback?.(statusChange);

          // Show push notification
          await this.showAppointmentStatusNotification(statusChange);
        }
      }
    } catch (error) {
      console.error('❌ Error checking for appointment changes:', error);
    }
  }

  private async showAppointmentStatusNotification(change: AppointmentStatusChange) {
    const { appointment, oldStatus, newStatus } = change;

    // Determine notification title and message based on status
    let title = '📅 Appointment Update';
    let message = '';

    switch (newStatus.toLowerCase()) {
      case 'confirmed':
        title = '✅ Appointment Confirmed';
        message = `Your appointment for ${appointment.service?.name || 'service'} on ${this.formatDate(appointment.appointment_date)} has been confirmed.`;
        break;
      case 'cancelled':
        title = '❌ Appointment Cancelled';
        message = `Your appointment for ${appointment.service?.name || 'service'} on ${this.formatDate(appointment.appointment_date)} has been cancelled.`;
        break;
      case 'completed':
        title = '✨ Appointment Completed';
        message = `Your appointment for ${appointment.service?.name || 'service'} has been completed. Thank you for visiting Dr. Ve Aesthetic Clinic!`;
        break;
      case 'rescheduled':
        title = '🔄 Appointment Rescheduled';
        message = `Your appointment has been rescheduled to ${this.formatDate(appointment.appointment_date)} at ${appointment.appointment_time}.`;
        break;
      case 'pending':
        title = '⏳ Appointment Pending';
        message = `Your appointment for ${appointment.service?.name || 'service'} is awaiting confirmation.`;
        break;
      default:
        title = '📅 Appointment Status Changed';
        message = `Your appointment status has been updated from ${oldStatus} to ${newStatus}.`;
    }

    // Show notification using the specific appointment notification method
    await this.notificationService.showAppointmentNotification(title, message, {
      appointment_id: appointment.id.toString(),
      status: newStatus,
      old_status: oldStatus || '',
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      service_name: appointment.service?.name || '',
    });

    console.log('🔔 Appointment notification shown:', { title, message });
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  }

  // Method to manually trigger a check (for testing)
  async forceCheckAppointments() {
    console.log('🔄 Force checking for appointment changes...');
    await this.checkForAppointmentChanges();
  }

  // Method to simulate an appointment status change (for testing)
  async simulateStatusChange(appointmentId: number, newStatus: string) {
    console.log('🎭 Simulating appointment status change:', { appointmentId, newStatus });

    const mockAppointment: Partial<Appointment> = {
      id: appointmentId,
      status: newStatus,
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '10:00 AM',
      service: {
        id: 1,
        name: 'Facial Treatment',
        description: 'Test service',
        price: 1000,
        duration: 60,
        category_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    await this.showAppointmentStatusNotification({
      appointmentId,
      oldStatus: 'pending',
      newStatus,
      appointment: mockAppointment as Appointment,
    });
  }

  // Get polling status
  getStatus() {
    return {
      isPolling: this.isPolling,
      userId: this.currentUserId,
      intervalMs: this.pollIntervalMs,
      appointmentsTracked: this.appointmentStatuses.size,
      isAppInForeground: this.isAppInForeground,
    };
  }

  // Update polling interval
  setPollingInterval(intervalMs: number) {
    this.pollIntervalMs = Math.max(10000, intervalMs); // Minimum 10 seconds

    if (this.isPolling) {
      // Restart polling with new interval
      const userId = this.currentUserId!;
      const callback = this.onStatusChangeCallback;
      this.stopPolling();
      this.startPolling(userId, callback);
    }

    console.log('🔄 Polling interval updated to:', this.pollIntervalMs, 'ms');
  }
}

export default AppointmentPollingService.getInstance();
