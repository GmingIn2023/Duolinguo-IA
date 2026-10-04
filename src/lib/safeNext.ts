/** Only same-origin relative paths: blocks //evil.com, /\evil.com and absolute URLs (open redirect). */
export function safeNext(value: unknown, fallback = "/learn"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
