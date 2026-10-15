const BASE = "http://gusgus.invalid";

/**
 * Only same-origin relative paths (open redirect guard). Blocks //evil.com, /\evil.com, absolute
 * URLs, and control characters: browsers strip tabs and newlines, so "/\t/evil.com" would become
 * "//evil.com" once followed.
 */
export function safeNext(value: unknown, fallback = "/learn"): string {
  if (typeof value !== "string" || value.length > 512 || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const url = new URL(value, BASE);
    if (url.origin !== BASE) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
