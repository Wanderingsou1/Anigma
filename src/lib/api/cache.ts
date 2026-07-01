import NodeCache from "node-cache";

// Default TTL: 10 minutes
const cache = new NodeCache({
  stdTTL: 600,
  checkperiod: 120,
  useClones: false, // Better performance for read-heavy usage
});

/**
 * Get cached data or fetch and cache it
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 600
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const data = await fetcher();
  cache.set(key, data, ttlSeconds);
  return data;
}

/**
 * Invalidate a specific cache key
 */
export function invalidateCache(key: string): void {
  cache.del(key);
}

/**
 * Invalidate all keys matching a prefix
 */
export function invalidateCachePrefix(prefix: string): void {
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  cache.del(keys);
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  return cache.getStats();
}

export default cache;
