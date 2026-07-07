export type CacheEntry<T> = {
  value: T;
  cachedAt: string;
  expiresAt: number;
};

export type CacheResult<T> = {
  value: T;
  cachedAt: string;
  hit: boolean;
};

export class MemoryCache {
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  async getOrSet<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<CacheResult<T>> {
    const now = Date.now();
    const cached = this.entries.get(key) as CacheEntry<T> | undefined;

    if (cached && cached.expiresAt > now) {
      return {
        value: cached.value,
        cachedAt: cached.cachedAt,
        hit: true
      };
    }

    const value = await loader();
    const cachedAt = new Date(now).toISOString();
    this.entries.set(key, {
      value,
      cachedAt,
      expiresAt: now + ttlMs
    });

    return {
      value,
      cachedAt,
      hit: false
    };
  }

  clear(): void {
    this.entries.clear();
  }
}

export const serverCache = new MemoryCache();
