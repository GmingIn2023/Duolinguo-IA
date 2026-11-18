import { clientIp, rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * Collector for the Content-Security-Policy-Report-Only rollout.
 *
 * Reports are untrusted input: they are truncated, stripped of any query string (a token could end
 * up there) and written as one compact line to the Render log. Nothing is stored.
 */
const MAX_BYTES = 16 * 1024;

function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.split("?")[0].split("#")[0].replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 200);
}

function pick(report: Record<string, unknown>): string {
  const directive = clean(report["effective-directive"] ?? report["violated-directive"]);
  const blocked = clean(report["blocked-uri"]);
  const page = clean(report["document-uri"]);
  return `directive=${directive || "-"} blocked=${blocked || "-"} page=${page || "-"}`;
}

export async function POST(request: Request) {
  if (!rateLimit(`csp:${clientIp(request.headers)}`, 120, 60_000).ok) {
    return new Response(null, { status: 429 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BYTES) return new Response(null, { status: 413 });

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // Legacy "csp-report" envelope, and the Reporting API array used by report-to.
    const legacy = parsed["csp-report"];
    const modern = Array.isArray(parsed.body) ? (parsed.body[0] as Record<string, unknown>) : undefined;
    const report = (legacy ?? modern) as Record<string, unknown> | undefined;
    if (report) console.warn(`[csp] ${pick(report)}`);
  } catch {
    // A malformed report is not worth an error response: the browser is not listening.
  }

  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
