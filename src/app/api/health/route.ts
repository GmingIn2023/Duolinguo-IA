import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Render health check. Deliberately touches nothing (no Supabase call): a health check that
 * depends on the database would restart the service whenever Supabase hiccups.
 */
export function GET() {
  return NextResponse.json(
    { status: "ok", service: "gusgus" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
