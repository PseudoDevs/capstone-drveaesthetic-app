/**
 * Enhanced input validation and sanitization
 */
export class InputValidator {
  // XSS prevention patterns
  private static readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<[^>]*>/g
  ];

  // SQL injection patterns
  private static readonly SQL_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+'.*'\s*=\s*'.*')/gi,
    /(\b(OR|AND)\s+".*"\s*=\s*".*")/gi,
    /(\b(OR|AND)\s+\w+\s*=\s*\w+)/gi
  ];

  // Email validation pattern
  private static readonly EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Phone validation pattern
  private static readonly PHONE_PATTERN = /^[\+]?[1-9][\d]{0,15}$/;

  /**
   * Sanitize input to prevent XSS attacks
   */
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input.trim();
    
    // Remove XSS patterns
    this.XSS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Remove SQL injection patterns
    this.SQL_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Escape HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized;
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }
    return this.EMAIL_PATTERN.test(email.trim());
  }

  /**
   * Validate phone number format
   */
  static validatePhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') {
      return false;
    }
    return this.PHONE_PATTERN.test(phone.trim());
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common, please choose a stronger password');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate name format
   */
  static validateName(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }

    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      return false;
    }

    // Only allow letters, spaces, hyphens, and apostrophes
    return /^[a-zA-Z\s\-']+$/.test(trimmed);
  }

  /**
   * Validate appointment notes
   */
  static validateNotes(notes: string): boolean {
    if (!notes || typeof notes !== 'string') {
      return true; // Notes are optional
    }

    const trimmed = notes.trim();
    if (trimmed.length > 500) {
      return false;
    }

    // Check for malicious content
    const hasXSS = this.XSS_PATTERNS.some(pattern => pattern.test(trimmed));
    const hasSQL = this.SQL_PATTERNS.some(pattern => pattern.test(trimmed));
    
    return !hasXSS && !hasSQL;
  }
}
