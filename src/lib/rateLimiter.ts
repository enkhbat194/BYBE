// Rate Limiting and Error Handling for AI Requests

export interface RateLimitConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  timeout: number;
}

export class AIFallbackHandler {
  private config: RateLimitConfig;
  private retryCounts = new Map<string, number>();
  private lastErrorTime = new Map<string, number>();

  constructor(config: RateLimitConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    timeout: 30000
  }) {
    this.config = config;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    provider: string,
    fallbackOperations?: Array<() => Promise<T>>
  ): Promise<T> {
    const key = `${provider}_${Date.now()}`;
    let lastError: Error | null = null;

    // Try primary operation
    try {
      return await this.withTimeout(operation, this.config.timeout);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`Primary ${provider} request failed:`, lastError.message);
    }

    // Try fallback operations if available
    if (fallbackOperations && fallbackOperations.length > 0) {
      for (let i = 0; i < fallbackOperations.length; i++) {
        try {
          console.log(`Trying fallback operation ${i + 1}/${fallbackOperations.length} for ${provider}`);
          return await this.withTimeout(fallbackOperations[i], this.config.timeout);
        } catch (error) {
          console.warn(`Fallback ${i + 1} for ${provider} failed:`, error);
          lastError = error instanceof Error ? error : new Error('Unknown error');
        }
      }
    }

    // If we get here, all operations failed
    throw lastError || new Error(`All AI provider operations failed for ${provider}`);
  }

  private async withTimeout<T>(operation: () => Promise<T>, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      operation()
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeoutId));
    });
  }

  calculateRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const delay = Math.min(
      this.config.baseDelay * Math.pow(2, attempt),
      this.config.maxDelay
    );
    
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() - 0.5);
    return Math.max(0, delay + jitter);
  }

  shouldRetry(error: Error, attempt: number): boolean {
    if (attempt >= this.config.maxRetries) {
      return false;
    }

    // Don't retry on certain errors
    const nonRetryableErrors = [
      'API key invalid',
      'Authentication failed',
      'Model not found',
      'Invalid request'
    ];

    for (const nonRetryable of nonRetryableErrors) {
      if (error.message.toLowerCase().includes(nonRetryable.toLowerCase())) {
        return false;
      }
    }

    // Retry on network errors, timeouts, and rate limits
    const retryableErrors = [
      'network error',
      'timeout',
      'rate limit',
      'too many requests',
      'service unavailable',
      'gateway timeout'
    ];

    for (const retryable of retryableErrors) {
      if (error.message.toLowerCase().includes(retryable)) {
        return true;
      }
    }

    // Default to retrying for unknown errors
    return true;
  }

  // Provider-specific error normalization
  normalizeError(error: any, provider: string): Error {
    if (error instanceof Error) {
      return this.enhanceError(error, provider);
    }

    const message = typeof error === 'string' ? error : 'Unknown AI provider error';
    return this.enhanceError(new Error(message), provider);
  }

  private enhanceError(error: Error, provider: string): Error {
    const enhanced = new Error(`[${provider.toUpperCase()}] ${error.message}`);
    enhanced.stack = error.stack;
    return enhanced;
  }
}

// Global rate limiter instance
export const aiFallbackHandler = new AIFallbackHandler({
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  timeout: 30000
});

// Provider health checker
export class ProviderHealthChecker {
  private healthStatus = new Map<string, boolean>();
  private lastCheck = new Map<string, number>();
  private checkInterval = 5 * 60 * 1000; // 5 minutes

  async isHealthy(provider: string): Promise<boolean> {
    const now = Date.now();
    const last = this.lastCheck.get(provider) || 0;

    if (now - last > this.checkInterval) {
      await this.checkProvider(provider);
    }

    return this.healthStatus.get(provider) ?? true;
  }

  private async checkProvider(provider: string): Promise<void> {
    try {
      // Simple health check - try to fetch models
      let url: string;
      let options: RequestInit;

      switch (provider) {
        case 'openai':
          url = 'https://api.openai.com/v1/models';
          options = {
            headers: { 'Authorization': 'Bearer invalid-key' },
            method: 'GET'
          };
          break;
        case 'anthropic':
          url = 'https://api.anthropic.com/v1/models';
          options = {
            headers: { 'x-api-key': 'invalid-key', 'anthropic-version': '2023-06-01' },
            method: 'GET'
          };
          break;
        case 'openrouter':
          url = 'https://openrouter.ai/api/v1/models';
          options = {
            headers: { 'Authorization': 'Bearer invalid-key' },
            method: 'GET'
          };
          break;
        case 'groq':
          url = 'https://api.groq.com/openai/v1/models';
          options = {
            headers: { 'Authorization': 'Bearer invalid-key' },
            method: 'GET'
          };
          break;
        case 'ollama':
          url = 'http://localhost:11434/api/tags';
          options = { method: 'GET' };
          break;
        default:
          this.healthStatus.set(provider, true);
          this.lastCheck.set(provider, Date.now());
          return;
      }

      const response = await fetch(url, options);
      
      // If we get a 401, the service is up but auth failed
      // If we get a network error, the service is down
      const isHealthy = response.status === 401 || response.ok;
      this.healthStatus.set(provider, isHealthy);
      
    } catch (error) {
      // Network error means service is down
      this.healthStatus.set(provider, false);
    }

    this.lastCheck.set(provider, Date.now());
  }

  getHealthStatus(provider: string): boolean {
    return this.healthStatus.get(provider) ?? true;
  }
}

export const providerHealthChecker = new ProviderHealthChecker();