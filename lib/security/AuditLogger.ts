/**
 * Security audit logging service
 */
export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: 'AUTH' | 'API' | 'SECURITY' | 'ERROR';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  private static events: SecurityEvent[] = [];
  private static readonly MAX_EVENTS = 1000;

  /**
   * Log authentication events
   */
  static logAuthEvent(
    action: string,
    userId?: string,
    details: Record<string, any> = {}
  ): void {
    this.logEvent({
      eventType: 'AUTH',
      severity: 'MEDIUM',
      action,
      userId,
      details,
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent()
    });
  }

  /**
   * Log API security events
   */
  static logApiEvent(
    action: string,
    endpoint: string,
    userId?: string,
    details: Record<string, any> = {}
  ): void {
    this.logEvent({
      eventType: 'API',
      severity: 'LOW',
      action: `${action} - ${endpoint}`,
      userId,
      details: { ...details, endpoint },
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent()
    });
  }

  /**
   * Log security violations
   */
  static logSecurityEvent(
    action: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    details: Record<string, any> = {}
  ): void {
    this.logEvent({
      eventType: 'SECURITY',
      severity,
      action,
      details,
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent()
    });
  }

  /**
   * Log error events
   */
  static logErrorEvent(
    action: string,
    error: Error,
    userId?: string,
    details: Record<string, any> = {}
  ): void {
    this.logEvent({
      eventType: 'ERROR',
      severity: 'HIGH',
      action,
      userId,
      details: {
        ...details,
        errorMessage: error.message,
        errorStack: error.stack?.substring(0, 500)
      },
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent()
    });
  }

  /**
   * Get recent security events
   */
  static getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get events by severity
   */
  static getEventsBySeverity(severity: string): SecurityEvent[] {
    return this.events.filter(event => event.severity === severity);
  }

  /**
   * Clear old events
   */
  static clearOldEvents(): void {
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, this.MAX_EVENTS);
    }
  }

  /**
   * Private method to log events
   */
  private static logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date().toISOString()
    };

    this.events.push(securityEvent);
    this.clearOldEvents();

    // Log to console in development
    if (__DEV__) {
      console.log(`🔒 Security Event: ${securityEvent.action}`, securityEvent);
    }
  }

  /**
   * Generate unique event ID
   */
  private static generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client IP (simplified for mobile)
   */
  private static getClientIP(): string {
    // In a real app, you'd get this from the network request
    return 'mobile_client';
  }

  /**
   * Get user agent
   */
  private static getUserAgent(): string {
    // In React Native, you'd get this from the device info
    return 'ReactNative/Expo';
  }
}
