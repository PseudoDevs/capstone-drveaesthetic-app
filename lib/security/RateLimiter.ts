/**
 * Client-side rate limiting to prevent API abuse
 */
export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();
  private static readonly WINDOW_SIZE = 60000; // 1 minute
  private static readonly MAX_REQUESTS = 30; // 30 requests per minute

  static async checkRateLimit(endpoint: string): Promise<boolean> {
    const now = Date.now();
    const key = endpoint;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const requests = this.requests.get(key)!;
    
    // Remove old requests outside the window
    const validRequests = requests.filter(
      timestamp => now - timestamp < this.WINDOW_SIZE
    );
    
    this.requests.set(key, validRequests);
    
    // Check if we've exceeded the limit
    if (validRequests.length >= this.MAX_REQUESTS) {
      console.warn(`Rate limit exceeded for ${endpoint}`);
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  static async delayRequest(): Promise<void> {
    // Add random delay to prevent timing attacks
    const delay = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
