import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabasePublishableKey } from "@/lib/supabase/env";

const PROTECTED = ["/learn", "/map", "/jeu", "/courses", "/lesson", "/review", "/notes", "/profile"];

/**
 * The policy is served in Report-Only for now: the browser reports violations instead of blocking,
 * so the rollout cannot break a page. `next dev` needs 'unsafe-eval' for React Refresh, and
 * upgrade-insecure-requests is pointless (and noisy) on localhost.
 */
function contentSecurityPolicy(nonce: string): string {
  const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const supabaseWs = supabase.replace(/^http/, "ws");
  const dev = process.env.NODE_ENV !== "production";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // Next injects inline styles (fonts, layout); scripting stays nonce-only.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${supabase ? ` ${supabase}` : ""}`,
    "font-src 'self' data:",
    `connect-src 'self'${supabase ? ` ${supabase} ${supabaseWs}` : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "manifest-src 'self'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
    "report-to csp",
    "report-uri /api/csp-report",
  ].join("; ");
}

/** Refreshes the Supabase session cookie and keeps signed-out visitors out of the app. */
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = contentSecurityPolicy(nonce);

  // Next reads the nonce from this request header and stamps it on its own scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);

  const next = () => NextResponse.next({ request: { headers: requestHeaders } });
  let response = next();
  let signedIn = false;
  let authUnavailable = false;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabasePublishableKey(),
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll(toSet) {
            toSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = next();
            toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      },
    );

    const { data } = await supabase.auth.getClaims();
    signedIn = Boolean(data?.claims);
  } catch {
    // A missing env var or an unreachable auth service must not 500 public pages.
    authUnavailable = true;
  }

  const path = request.nextUrl.pathname;
  let result = response;

  if (!signedIn && PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    if (authUnavailable) url.searchParams.set("error", "service");
    result = NextResponse.redirect(url);
  } else if (signedIn && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/learn";
    url.search = "";
    result = NextResponse.redirect(url);
  }

  // Every response carries the policy, redirects included, so the rollout sees the whole site.
  result.headers.set("Content-Security-Policy-Report-Only", policy);
  result.headers.set("Reporting-Endpoints", 'csp="/api/csp-report"');
  return result;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
