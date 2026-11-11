import type { NextConfig } from "next";

/**
 * Baseline security headers on every response. No Content-Security-Policy here: it needs a nonce set up with the
 * inline styles and scripts Next emits, and is a change of its own.
 */
const SECURITY_HEADERS = [
  // never guess a content type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // the app is never shown inside another site's frame (clickjacking)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // other sites only learn the origin, never the page (lesson ids, review modes)
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // nothing in the app uses these devices
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
