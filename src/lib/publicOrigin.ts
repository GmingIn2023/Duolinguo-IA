import "server-only";
import type { NextRequest } from "next/server";

/**
 * The origin a visitor actually sees.
 *
 * On Render the Node process receives the request on localhost:10000, so `request.nextUrl`
 * describes the internal hop, not the public site. Redirects built from it sent people to
 * `https://localhost:10000/...`. SITE_URL wins; the forwarded headers cover the other hosts.
 */
export function publicOrigin(request: NextRequest): string {
  const configured = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(/:$/, "");
  if (host) return `${proto}://${host}`;

  return request.nextUrl.origin;
}
