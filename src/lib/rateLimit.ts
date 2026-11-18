/**
 * Fixed-window rate limiter, kept in memory.
 *
 * Render runs this app as a single Node process, so one Map is enough. Two limits are known and
 * written down in ETAPE-2-SECURITE-LEGAL: the counters reset on deploy, and they are per instance.
 * If the service ever scales out, move them to a shared store before relying on them.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  if (buckets.size >= MAX_BUCKETS) sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count += 1;
  return { ok: true };
}

/**
 * Reads the counter without consuming anything.
 *
 * Login uses this instead of `rateLimit`: on a shared address (school, office, household), a
 * hundred successful sign-ins must never count. Only the failures call `recordFailure`.
 */
export function rateLimitStatus(key: string, limit: number, now = Date.now()): RateLimitResult {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) return { ok: true };
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { ok: true };
}

/** Counts one failed attempt. Never call it after a success. */
export function recordFailure(key: string, windowMs: number, now = Date.now()): void {
  if (buckets.size >= MAX_BUCKETS) sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
}

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Still full: drop the oldest entries, so a flood cannot grow the map without bound.
  if (buckets.size >= MAX_BUCKETS) {
    const excess = buckets.size - Math.floor(MAX_BUCKETS / 2);
    let dropped = 0;
    for (const key of buckets.keys()) {
      if (dropped++ >= excess) break;
      buckets.delete(key);
    }
  }
}

/** Render sets x-forwarded-for and overwrites it; the first entry is the client. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const raw = forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || "unknown";
  return raw.slice(0, 64);
}

/** In dev every browser shares one address, so production limits would lock the author out. */
export const limitFactor = () => (process.env.NODE_ENV === "production" ? 1 : 20);

export function throttleMessage(retryAfterSeconds: number, action: "login" | "signup" | "forgot"): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  const subject =
    action === "login"
      ? "tentatives de connexion"
      : action === "signup"
        ? "comptes créés depuis cet appareil"
        : "demandes de lien";
  return `Trop de ${subject}. Réessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.`;
}

/** Tests only. */
export function resetRateLimits() {
  buckets.clear();
}
