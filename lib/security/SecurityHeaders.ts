/**
 * Security headers and CSP implementation
 */
export class SecurityHeaders {
  /**
   * Content Security Policy for the app
   */
  static readonly CSP_POLICY = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", "data:", "https:"],
    'connect-src': ["'self'", "https://drveaestheticclinic.online"],
    'font-src': ["'self'", "data:"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  };

  /**
   * Security headers for API requests
   */
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': this.buildCSPHeader()
    };
  }

  /**
   * Build Content Security Policy header
   */
  private static buildCSPHeader(): string {
    return Object.entries(this.CSP_POLICY)
      .map(([directive, values]) => {
        if (values.length === 0) {
          return directive;
        }
        return `${directive} ${values.join(' ')}`;
      })
      .join('; ');
  }

  /**
   * Validate request origin
   */
  static validateRequestOrigin(origin: string): boolean {
    const allowedOrigins = [
      'https://drveaestheticclinic.online',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:8083',
      'exp://192.168.1.7:8081',
      'exp://192.168.1.7:8082',
      'exp://192.168.1.7:8083'
    ];

    return allowedOrigins.includes(origin);
  }

  /**
   * Sanitize headers before sending
   */
  static sanitizeHeaders(headers: Record<string, any>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    Object.entries(headers).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length < 1000) {
        // Remove potentially dangerous characters
        const sanitizedKey = key.replace(/[^\w\-]/g, '');
        const sanitizedValue = value.replace(/[\r\n]/g, '');
        
        if (sanitizedKey && sanitizedValue) {
          sanitized[sanitizedKey] = sanitizedValue;
        }
      }
    });

    return sanitized;
  }
}
