import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { Bill, Payment, ApiResponse, PaginatedResponse } from './types';

export interface BillingDashboard {
  outstanding_balance: number;
  total_paid: number;
  recent_payments: Payment[];
  upcoming_bills: Bill[];
  payment_statistics: {
    this_month: number;
    last_month: number;
    total_payments: number;
  };
}

export interface PaymentHistoryResponse {
  payments: Payment[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface OutstandingBalance {
  balance: number;
  unpaid_bills_count: number;
  overdue_bills_count: number;
  next_due_date?: string;
}

export interface PaymentRequest {
  bill_id: number;
  amount: number;
  payment_method: string;
  transaction_id?: string;
}

export class BillingService {
  /**
   * Get complete billing dashboard data
   */
  static async getDashboard(): Promise<BillingDashboard> {
    return await apiClient.get(API_ENDPOINTS.BILLING.DASHBOARD);
  }

  /**
   * Get payment history with pagination
   */
  static async getPaymentHistory(page: number = 1): Promise<PaymentHistoryResponse> {
    return await apiClient.get(`${API_ENDPOINTS.BILLING.HISTORY}?page=${page}`);
  }

  /**
   * Get outstanding balance details
   */
  static async getOutstandingBalance(): Promise<OutstandingBalance> {
    return await apiClient.get(API_ENDPOINTS.BILLING.OUTSTANDING);
  }

  /**
   * Process a payment
   */
  static async processPayment(paymentData: PaymentRequest): Promise<Payment> {
    return await apiClient.post(API_ENDPOINTS.BILLING.PAY, paymentData);
  }

  /**
   * Get specific bill details
   */
  static async getBill(billId: number): Promise<Bill> {
    return await apiClient.get(`/client/bills/${billId}`);
  }

  /**
   * Download payment receipt
   */
  static async downloadReceipt(paymentId: number): Promise<Blob> {
    return await apiClient.get(`/client/payments/${paymentId}/receipt`, {
      responseType: 'blob'
    });
  }

  // Legacy methods for backward compatibility
  static async getClientBills(clientId: number): Promise<{ data: Bill[] }> {
    return await apiClient.get(`/client/bills/${clientId}`);
  }

  static async getClientPayments(clientId: number): Promise<{ data: Payment[] }> {
    return await apiClient.get(`/client/payments/${clientId}`);
  }
}

