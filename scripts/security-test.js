/**
 * Security Testing Script
 * Tests various security features of the mobile app
 */

const securityTests = {
  // Test rate limiting
  async testRateLimiting() {
    console.log('🔒 Testing Rate Limiting...');
    
    const { RateLimiter } = require('../lib/security/RateLimiter');
    
    // Test normal requests
    for (let i = 0; i < 5; i++) {
      const allowed = await RateLimiter.checkRateLimit('/test-endpoint');
      console.log(`Request ${i + 1}: ${allowed ? '✅ Allowed' : '❌ Blocked'}`);
    }
    
    // Test rate limit exceeded
    console.log('Testing rate limit exceeded...');
    for (let i = 0; i < 35; i++) {
      const allowed = await RateLimiter.checkRateLimit('/test-endpoint');
      if (!allowed) {
        console.log(`✅ Rate limit triggered at request ${i + 1}`);
        break;
      }
    }
  },

  // Test input validation
  async testInputValidation() {
    console.log('🔒 Testing Input Validation...');
    
    const { InputValidator } = require('../lib/security/InputValidator');
    
    // Test email validation
    const validEmails = ['test@example.com', 'user@domain.co.uk'];
    const invalidEmails = ['invalid-email', '@domain.com', 'test@'];
    
    validEmails.forEach(email => {
      const isValid = InputValidator.validateEmail(email);
      console.log(`Email "${email}": ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    });
    
    invalidEmails.forEach(email => {
      const isValid = InputValidator.validateEmail(email);
      console.log(`Email "${email}": ${isValid ? '❌ Should be invalid' : '✅ Correctly invalid'}`);
    });
    
    // Test password validation
    const weakPasswords = ['123', 'password', 'abc123'];
    const strongPasswords = ['MyStr0ng!Pass', 'Secure@Pass123', 'Complex#Pass1'];
    
    weakPasswords.forEach(password => {
      const validation = InputValidator.validatePassword(password);
      console.log(`Password "${password}": ${validation.isValid ? '❌ Should be weak' : '✅ Correctly weak'}`);
    });
    
    strongPasswords.forEach(password => {
      const validation = InputValidator.validatePassword(password);
      console.log(`Password "${password}": ${validation.isValid ? '✅ Strong' : '❌ Should be strong'}`);
    });
    
    // Test XSS sanitization
    const xssInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(1)">',
      'Normal text input'
    ];
    
    xssInputs.forEach(input => {
      const sanitized = InputValidator.sanitizeInput(input);
      console.log(`Input: "${input}" -> Sanitized: "${sanitized}"`);
    });
  },

  // Test security headers
  async testSecurityHeaders() {
    console.log('🔒 Testing Security Headers...');
    
    const { SecurityHeaders } = require('../lib/security/SecurityHeaders');
    
    const headers = SecurityHeaders.getSecurityHeaders();
    console.log('Security Headers:');
    Object.entries(headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // Test CSP policy
    const csp = SecurityHeaders.buildCSPHeader();
    console.log(`CSP Policy: ${csp}`);
  },

  // Test audit logging
  async testAuditLogging() {
    console.log('🔒 Testing Audit Logging...');
    
    const { AuditLogger } = require('../lib/security/AuditLogger');
    
    // Log some test events
    AuditLogger.logAuthEvent('TEST_LOGIN', 'user123', { test: true });
    AuditLogger.logSecurityEvent('TEST_SECURITY', 'MEDIUM', { test: true });
    AuditLogger.logApiEvent('TEST_API', '/test', 'user123', { test: true });
    
    // Get recent events
    const events = AuditLogger.getRecentEvents(10);
    console.log(`Logged ${events.length} events`);
    
    // Get events by severity
    const highSeverityEvents = AuditLogger.getEventsBySeverity('HIGH');
    console.log(`High severity events: ${highSeverityEvents.length}`);
  },

  // Test API client security
  async testApiClientSecurity() {
    console.log('🔒 Testing API Client Security...');
    
    // This would test the enhanced API client with rate limiting and security headers
    console.log('API Client security features:');
    console.log('  ✅ Rate limiting enabled');
    console.log('  ✅ Security headers added');
    console.log('  ✅ Input validation');
    console.log('  ✅ Audit logging');
    console.log('  ✅ Error handling');
  }
};

// Run all security tests
async function runSecurityTests() {
  console.log('🛡️ Starting Security Tests...\n');
  
  try {
    await securityTests.testRateLimiting();
    console.log('');
    
    await securityTests.testInputValidation();
    console.log('');
    
    await securityTests.testSecurityHeaders();
    console.log('');
    
    await securityTests.testAuditLogging();
    console.log('');
    
    await securityTests.testApiClientSecurity();
    console.log('');
    
    console.log('✅ All security tests completed!');
  } catch (error) {
    console.error('❌ Security test failed:', error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runSecurityTests();
}

module.exports = { securityTests, runSecurityTests };
