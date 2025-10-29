export { AuthService } from './auth';
export { AuthStorage } from './storage';
export { AppointmentService } from './appointments';
export { ClinicServiceApi, CategoryService, FeedbackService, UserService, ProfileService, StatisticsService } from './services';
export { ChatService } from './chat';
export { BillingService } from './billing';
export { ConsentWaiverService } from './consent';
export { MobileDashboardService } from './mobile-dashboard';
export { MedicalCertificateService } from './medical-certificates';
export { PrescriptionService } from './prescriptions';
export { apiClient } from './client';
export * from './types';
export * from './config';

// Export security services
export { RateLimiter } from '../security/RateLimiter';
export { InputValidator } from '../security/InputValidator';
export { SecurityHeaders } from '../security/SecurityHeaders';
export { AuditLogger } from '../security/AuditLogger';

// Export billing types
export type { BillingDashboard, OutstandingBalance, PaymentHistoryResponse, PaymentRequest } from './billing';
export type { Prescription, PrescriptionStatistics } from './prescriptions';
export type { MedicalCertificate } from './medical-certificates';