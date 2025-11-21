import NodeCache from 'node-cache';

// Create cache instances
const cache = new NodeCache({ 
  stdTTL: 600, // 10 minutes default TTL
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Better performance
});

// Cache keys
const CACHE_KEYS = {
  PROVIDERS: 'providers:all',
  PROVIDER_MODELS: (providerId: string) => `providers:${providerId}:models`,
  PROVIDER_STATUS: (providerId: string) => `providers:${providerId}:status`,
  SYNC_STATUS: (providerId: string) => `sync:${providerId}:status`
};

export class CacheService {
  /**
   * Get cached data
   */
  static get<T = any>(key: string): T | undefined {
    return cache.get<T>(key);
  }

  /**
   * Set cached data
   */
  static set(key: string, value: any, ttl?: number): boolean {
    return ttl !== undefined ? cache.set(key, value, ttl) : cache.set(key, value);
  }

  /**
   * Delete cached data
   */
  static del(key: string): number {
    return cache.del(key);
  }

  /**
   * Clear all cached data
   */
  static flush(): void {
    cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    return cache.getStats();
  }

  // Provider-specific methods
  static getProviders(): any[] | undefined {
    return this.get(CACHE_KEYS.PROVIDERS);
  }

  static setProviders(providers: any[]): boolean {
    return this.set(CACHE_KEYS.PROVIDERS, providers, 300); // 5 minutes
  }

  static getProviderModels(providerId: string): any[] | undefined {
    return this.get(CACHE_KEYS.PROVIDER_MODELS(providerId));
  }

  static setProviderModels(providerId: string, models: any[]): boolean {
    return this.set(CACHE_KEYS.PROVIDER_MODELS(providerId), models, 600); // 10 minutes
  }

  static getProviderStatus(providerId: string): any | undefined {
    return this.get(CACHE_KEYS.PROVIDER_STATUS(providerId));
  }

  static setProviderStatus(providerId: string, status: any): boolean {
    return this.set(CACHE_KEYS.PROVIDER_STATUS(providerId), status, 60); // 1 minute
  }

  static getSyncStatus(providerId: string): any | undefined {
    return this.get(CACHE_KEYS.SYNC_STATUS(providerId));
  }

  static setSyncStatus(providerId: string, status: any): boolean {
    return this.set(CACHE_KEYS.SYNC_STATUS(providerId), status, 30); // 30 seconds
  }

  /**
   * Invalidate all provider-related cache
   */
  static invalidateProviderCache(providerId: string): void {
    this.del(CACHE_KEYS.PROVIDER_MODELS(providerId));
    this.del(CACHE_KEYS.PROVIDER_STATUS(providerId));
    this.del(CACHE_KEYS.SYNC_STATUS(providerId));
  }

  /**
   * Invalidate all cache
   */
  static invalidateAllCache(): void {
    this.flush();
  }

  /**
   * Cache with fallback to function
   */
  static async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Fetch data and cache it
    const data = await fetchFunction();
    this.set(key, data, ttl);
    
    return data;
  }

  /**
   * Cache provider models with fallback
   */
  static async getProviderModelsWithCache(
    providerId: string,
    fetchFunction: () => Promise<any[]>
  ): Promise<any[]> {
    return this.getOrSet(
      CACHE_KEYS.PROVIDER_MODELS(providerId),
      fetchFunction,
      600 // 10 minutes
    );
  }
}

// Cache middleware for Express
export function cacheMiddleware(ttl: number = 300) {
  return (req: any, res: any, next: any) => {
    const key = `route:${req.originalUrl}:${JSON.stringify(req.query)}`;
    
    // Try to get cached response
    const cachedResponse = CacheService.get(key);
    if (cachedResponse) {
      res.set('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(body: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        CacheService.set(key, body, ttl);
        res.set('X-Cache', 'MISS');
      }
      return originalJson.call(this, body);
    };

    next();
  };
}

// Clear cache on application shutdown
process.on('SIGINT', () => {
  console.log('Clearing cache on shutdown...');
  CacheService.flush();
});

process.on('SIGTERM', () => {
  console.log('Clearing cache on shutdown...');
  CacheService.flush();
});