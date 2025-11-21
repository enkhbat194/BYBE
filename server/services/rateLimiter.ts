import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (req: Request, res: Response) => void;
}

interface RateLimitStore {
  [key: string]: {
    requests: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private getDefaultKey(req: Request): string {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  private isWindowExpired(resetTime: number): boolean {
    return Date.now() > resetTime;
  }

  private incrementRequestCount(key: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    if (!this.store[key] || this.isWindowExpired(this.store[key].resetTime)) {
      this.store[key] = {
        requests: 1,
        resetTime: now + this.config.windowMs
      };
      return 1;
    }
    
    this.store[key].requests++;
    return this.store[key].requests;
  }

  check(req: Request, res: Response, next: NextFunction): void {
    const key = this.config.keyGenerator ? this.config.keyGenerator(req) : this.getDefaultKey(req);
    const requestCount = this.incrementRequestCount(key);
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, this.config.maxRequests - requestCount).toString(),
      'X-RateLimit-Reset': new Date(this.store[key].resetTime).toISOString()
    });

    if (requestCount > this.config.maxRequests) {
      // Rate limit exceeded
      if (this.config.onLimitReached) {
        return this.config.onLimitReached(req, res);
      }

      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(this.config.windowMs / 1000)} seconds.`,
        retryAfter: Math.ceil(this.config.windowMs / 1000)
      });
      return;
    }

    // Success - clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
      this.cleanup();
    }

    next();
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.isWindowExpired(this.store[key].resetTime)) {
        delete this.store[key];
      }
    });
  }

  // Get current usage stats
  getStats(key: string) {
    if (!this.store[key]) {
      return { requests: 0, resetTime: Date.now() + this.config.windowMs };
    }
    return {
      requests: this.store[key].requests,
      resetTime: this.store[key].resetTime,
      remaining: Math.max(0, this.config.maxRequests - this.store[key].requests)
    };
  }

  // Reset usage for a key
  reset(key: string): void {
    delete this.store[key];
  }
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // General API rate limiting
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // AI chat rate limiting
  aiChat: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Provider sync rate limiting
  providerSync: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Model listing rate limiting
  models: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 50,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Secrets management rate limiting
  secrets: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  }
};

// Middleware factory
export function createRateLimitMiddleware(config: RateLimitConfig) {
  const limiter = new RateLimiter(config);
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting for certain conditions
    if (process.env.NODE_ENV === 'development' && req.headers['x-disable-rate-limit']) {
      return next();
    }

    return limiter.check(req, res, next);
  };
}

// Apply rate limiting based on route patterns
export function applyRateLimiting() {
  return (req: Request, res: Response, next: NextFunction) => {
    const path = req.path;
    
    let config: RateLimitConfig;
    
    if (path.includes('/api/ai/chat')) {
      config = rateLimitConfigs.aiChat;
    } else if (path.includes('/api/providers') && path.includes('/sync')) {
      config = rateLimitConfigs.providerSync;
    } else if (path.includes('/api/providers') && path.includes('/models')) {
      config = rateLimitConfigs.models;
    } else if (path.includes('/api/secrets')) {
      config = rateLimitConfigs.secrets;
    } else {
      config = rateLimitConfigs.api;
    }

    return createRateLimitMiddleware(config)(req, res, next);
  };
}

// Rate limit service for tracking and management
export class RateLimitService {
  private limiters: Map<string, RateLimiter> = new Map();

  createLimiter(name: string, config: RateLimitConfig): RateLimiter {
    const limiter = new RateLimiter(config);
    this.limiters.set(name, limiter);
    return limiter;
  }

  getLimiter(name: string): RateLimiter | undefined {
    return this.limiters.get(name);
  }

  getAllStats() {
    const stats: Record<string, any> = {};
    this.limiters.forEach((limiter, name) => {
      // This is a simplified stats - in reality you'd want to aggregate all keys
      stats[name] = { activeLimiters: Object.keys(limiter['store']).length };
    });
    return stats;
  }

  resetLimiter(name: string): boolean {
    const limiter = this.limiters.get(name);
    if (limiter) {
      // Reset all keys for this limiter
      Object.keys(limiter['store']).forEach(key => limiter.reset(key));
      return true;
    }
    return false;
  }
}

export const rateLimitService = new RateLimitService();