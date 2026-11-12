interface CacheEntry {
  data: any;
  timestamp: number;
}

const responseCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<any>>();

/**
 * Synchronously reads a cached GET response if present and within `ttlMs`.
 * Allows React components to initialize state on the very first render without a loading flash.
 */
export function peekApiCache<T = any>(url: string, ttlMs = 60_000): T | undefined {
  const cached = responseCache.get(url);
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.data as T;
  }
  return undefined;
}

/**
 * Deduplicates concurrent GET requests to the same URL and caches JSON responses
 * for `ttlMs` milliseconds (default: 60 seconds).
 */
export async function cachedJsonFetch<T = any>(
  url: string,
  options?: RequestInit,
  ttlMs = 60_000
): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    const res = await fetch(url, { credentials: 'include', ...options });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      throw new Error(`Expected JSON from ${url}`);
    }
    return res.json();
  }

  const now = Date.now();
  const cached = responseCache.get(url);
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data as T;
  }

  const inflight = inflightRequests.get(url);
  if (inflight) {
    return inflight as Promise<T>;
  }

  const requestPromise = fetch(url, { credentials: 'include', ...options })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new Error(`Expected JSON from ${url}`);
      }
      const data = await res.json();
      responseCache.set(url, { data, timestamp: Date.now() });
      return data as T;
    })
    .finally(() => {
      inflightRequests.delete(url);
    });

  inflightRequests.set(url, requestPromise);
  return requestPromise;
}

/**
 * Invalidates cached GET responses matching the given URL prefix (or all if omitted).
 */
export function invalidateApiCache(prefix?: string) {
  if (!prefix) {
    responseCache.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }
}
