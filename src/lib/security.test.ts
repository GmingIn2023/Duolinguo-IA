import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Static guards for the "server-authoritative progress" rule.
// The database side (grants, award_xp) is tested by supabase/tests/progress_lock.sql.

const root = path.resolve(import.meta.dirname, "..");
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) && !f.endsWith(".test.ts") ? [p] : [];
  });
const sources = files(root).map((p) => ({ path: path.relative(root, p), code: readFileSync(p, "utf8") }));
const ADMIN = "lib/supabase/admin.ts";

describe("secret key stays on the server", () => {
  it("is read in a single server-only module", () => {
    const readers = sources.filter((s) => s.code.includes("SUPABASE_SECRET_KEY")).map((s) => s.path);
    expect(readers).toEqual([ADMIN]);
    expect(sources.find((s) => s.path === ADMIN)!.code).toMatch(/^import "server-only";/);
  });

  it("is never exposed through a NEXT_PUBLIC_ variable", () => {
    for (const s of sources) expect(s.code, s.path).not.toMatch(/NEXT_PUBLIC_\w*(SECRET|SERVICE)/);
  });

  it("is never imported by a client component", () => {
    const clients = sources.filter((s) => /^["']use client["']/.test(s.code));
    expect(clients.length).toBeGreaterThan(0);
    for (const c of clients) expect(c.code, c.path).not.toMatch(/supabase\/admin/);
  });
});

describe("progress writes", () => {
  const code = sources.map((s) => s.code).join("\n");

  it("go through the admin client for XP, progress and reviews", () => {
    const writes = [...code.matchAll(/(\S*)\.from\("(xp_events|lesson_progress|review_items)"\)\s*\.(insert|upsert|update|delete)\(/g)];
    expect(writes.length).toBeGreaterThan(0);
    for (const [all, receiver] of writes) expect(receiver, all).toBe("createAdminClient()");
  });

  it("never set xp, streak or activity date from the learner's client", () => {
    const profileUpdates = [...code.matchAll(/\.from\("profiles"\)\s*\.update\(\{([^}]*)\}/g)].map((m) => m[1]);
    for (const fields of profileUpdates) expect(fields).not.toMatch(/\b(xp|streak_days|last_active_date|placement_level)\b/);
  });

  it("credits XP only through the award_xp function", () => {
    expect(code).toMatch(/createAdminClient\(\)\s*\.rpc\("award_xp"/);
  });
});
