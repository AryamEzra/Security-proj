
const buckets = new Map<string, { tokens: number; lastRefill: number }>();

export function rateLimit({ capacity = 10, refillPerSec = 1 }: { capacity?: number; refillPerSec?: number } = {}) {
  return (key: string) => {
    const now = Date.now();
    const b = buckets.get(key) ?? { tokens: capacity, lastRefill: now };
    const elapsedSec = (now - b.lastRefill) / 1000;
    const refill = Math.floor(elapsedSec * refillPerSec);
    if (refill > 0) {
      b.tokens = Math.min(capacity, b.tokens + refill);
      b.lastRefill = now;
    }
    if (b.tokens <= 0) {
      buckets.set(key, b);
      return false; // rate limited
    }
    b.tokens -= 1;
    buckets.set(key, b);
    return true;
  };
}
