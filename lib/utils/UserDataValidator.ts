/**
 * User Data Validation Utility
 *
 * This utility helps identify and prevent placeholder/dummy user data
 * from being used in the application.
 */

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  suggestions?: string[];
}

export class UserDataValidator {

  /**
   * Comprehensive validation of user data to detect placeholder/dummy data
   */
  static validateUserData(user: any): ValidationResult {
    if (!user) {
      return { isValid: false, reason: 'No user data provided' };
    }

    const email = user.email?.toLowerCase() || '';
    const name = user.name?.toLowerCase() || '';
    const id = user.id;

    // Check for placeholder email patterns
    const emailPlaceholderPatterns = [
      'example.com',
      'test@',
      'dummy@',
      'placeholder@',
      'fake@',
      'sample@',
      '@example',
      '@test',
      '@dummy',
      'noreply@',
      'no-reply@'
    ];

    for (const pattern of emailPlaceholderPatterns) {
      if (email.includes(pattern)) {
        return {
          isValid: false,
          reason: `Email contains placeholder pattern: ${pattern}`,
          suggestions: [
            'Check if you\'re logged in with the correct account',
            'Verify the backend is not returning test data',
            'Try logging out and logging in again'
          ]
        };
      }
    }

    // Check for placeholder name patterns
    const namePlaceholderPatterns = [
      'test user',
      'test',
      'example',
      'dummy',
      'placeholder',
      'fake',
      'sample',
      'user',
      'demo',
      'john doe',
      'jane doe',
      'admin',
      'guest'
    ];

    for (const pattern of namePlaceholderPatterns) {
      if (name.includes(pattern)) {
        return {
          isValid: false,
          reason: `Name contains placeholder pattern: ${pattern}`,
          suggestions: [
            'Verify you\'re logged in with your real account',
            'Check if the backend is configured correctly',
            'Contact support if this persists'
          ]
        };
      }
    }

    // Check for suspicious low IDs (typically test/admin accounts)
    if (id && id <= 10) {
      return {
        isValid: false,
        reason: `Suspicious low user ID: ${id} (likely test/admin account)`,
        suggestions: [
          'Make sure you\'re not logged in as a test user',
          'Verify you\'re using a real customer account',
          'Contact support if this is your actual account'
        ]
      };
    }

    // Check for incomplete user data
    if (!email || !name || !id) {
      return {
        isValid: false,
        reason: 'Incomplete user data (missing email, name, or ID)',
        suggestions: [
          'Try refreshing your profile data',
          'Log out and log in again',
          'Check your network connection'
        ]
      };
    }

    return { isValid: true };
  }

  /**
   * Generate a user-friendly error message for placeholder data
   */
  static generatePlaceholderDataMessage(user: any): string {
    const validation = this.validateUserData(user);

    if (validation.isValid) {
      return '';
    }

    let message = `🚨 PLACEHOLDER DATA DETECTED!\n\n`;
    message += `Reason: ${validation.reason}\n\n`;

    if (validation.suggestions) {
      message += `What you can do:\n`;
      validation.suggestions.forEach((suggestion, index) => {
        message += `${index + 1}. ${suggestion}\n`;
      });
    }

    message += `\nUser data received:\n`;
    message += `- Name: ${user?.name || 'N/A'}\n`;
    message += `- Email: ${user?.email || 'N/A'}\n`;
    message += `- ID: ${user?.id || 'N/A'}`;

    return message;
  }
}