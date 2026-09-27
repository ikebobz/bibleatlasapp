/**
 * Tiny bounded cache (insertion-order LRU-ish).
 *
 * Server caches live inside stateless worker isolates, so an unbounded Map is
 * a slow memory leak that grows with traffic. Every server-side memo in the
 * app goes through this so it has an explicit ceiling.
 */
export function boundedCache<V>(max = 200) {
  const map = new Map<string, V>();
  return {
    get(key: string): V | undefined {
      const value = map.get(key);
      if (value === undefined) return undefined;
      // Refresh recency so hot entries survive eviction.
      map.delete(key);
      map.set(key, value);
      return value;
    },
    set(key: string, value: V) {
      if (map.has(key)) map.delete(key);
      else if (map.size >= max) {
        const oldest = map.keys().next().value;
        if (oldest !== undefined) map.delete(oldest);
      }
      map.set(key, value);
    },
    get size() {
      return map.size;
    },
  };
}
