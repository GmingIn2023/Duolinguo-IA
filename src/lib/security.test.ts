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
const sources = files(root).map((p) => ({ path: path.relative(root, p).split(path.sep).join("/"), code: readFileSync(p, "utf8") }));
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
    // the learner's own client: anything but the admin client (which only runs server-side, scoped to the user)
    const profileUpdates = [...code.matchAll(/(\S*?)\s*\.from\("profiles"\)\s*\.update\(\{([^}]*)\}/g)].filter((m) => m[1] !== "createAdminClient()").map((m) => m[2]);
    expect(profileUpdates.length).toBeGreaterThan(0);
    for (const fields of profileUpdates) expect(fields).not.toMatch(/\b(xp|streak_days|last_active_date|placement_level)\b/);
  });

  const service = () => sources.find((s) => s.path === "lib/progressService.ts")!.code;
  const store = () => sources.find((s) => s.path === "lib/progressDb.supabase.ts")!.code;
  const migrations = () => {
    const dir = path.resolve(root, "../supabase/migrations");
    return readdirSync(dir).map((f) => readFileSync(path.join(dir, f), "utf8")).join("\n");
  };

  it("pays one-off bonuses through sources the database makes unique", () => {
    expect(service()).toMatch(/award\(db, learner, CHECKPOINT_BONUS_XP, "checkpoint", mode, 0, today\)/);
    expect(service()).toMatch(/award\(db, learner, WEEKLY_BONUS_XP, "weekly", isoWeekKey\(now\), 0, today\)/);
    expect(migrations()).toMatch(/unique index xp_events_weekly_once on public\.xp_events \(user_id, ref\) where source = 'weekly'/);
    expect(migrations()).toMatch(/unique index if not exists xp_events_checkpoint_once on public\.xp_events \(user_id, ref\) where source = 'checkpoint'/);
  });

  // These are text guards: they stop the mechanism from being removed by accident.
  // The behaviour itself is tested in progressService.test.ts (against a model of the database) and in supabase/tests (real SQL).
  it("caps replay XP inside the database, so neither a loop nor simultaneous requests can farm it", () => {
    const actions = sources.find((s) => s.path === "app/actions.ts")!.code;
    expect(actions).not.toMatch(/recentlyCredited/);
    expect(service()).not.toMatch(/recentlyCredited/);
    // a lesson is paid by complete_lesson (XP + progress in one transaction), never by a separate award followed by a progress write
    expect(service()).toMatch(/db\.completeLesson\(\{/);
    expect(service()).toMatch(/replayHours: REPLAY_WINDOW_HOURS/);
    expect(service()).not.toMatch(/insertLessonProgress|updateLessonProgress|saveLessonProgress/);
    expect(service()).toMatch(/award\(db, learner, reviewXp\(paying\), "review", reviewRef, replayable \? REPLAY_WINDOW_HOURS : 0, today\)/);
    expect(migrations()).toMatch(/p_replay_hours integer default 0/);
    expect(migrations()).toMatch(/pg_advisory_xact_lock\(hashtextextended\(p_user::text/);
    // the old six-argument function must be dropped, or the call would be ambiguous
    expect(migrations()).toMatch(/drop function public\.award_xp\(uuid, integer, text, text, integer, date\)/);
  });

  it("marks a checkpoint as passed only for a session that passed", () => {
    expect(service()).toMatch(/reviewPassed\(\{ correct, answered: total, expected \}\)/);
    expect(service()).toMatch(/const reviewRef = passed \? mode : `try:\$\{mode\}`/);
    expect(service()).toMatch(/else if \(passed && replayable\)/);
    expect(service()).toMatch(/if \(passed && mode === "weekly"\)/);
  });

  it("keeps the compare-and-swap conditions that make simultaneous writes safe", () => {
    // daily review: only applies if the box is unchanged and the notion is still due (lesson progress is serialised inside complete_lesson)
    expect(store()).toMatch(/\.eq\("box", expected\.box\)\s*\.lte\("due_at", expected\.dueBefore\)/);
    expect(service()).toMatch(/\{ exclusive: daily \}/);
  });

  it("credits XP only through the award_xp and complete_lesson functions", () => {
    expect(code).toMatch(/createAdminClient\(\)\s*\.rpc\("award_xp"/);
    expect(code).toMatch(/createAdminClient\(\)\s*\.rpc\("complete_lesson"/);
    expect(store()).not.toMatch(/from\("lesson_progress"\)/); // no direct table write: it would bypass the transaction
  });

  it("locks complete_lesson to the server and validates its input", () => {
    const m = migrations();
    expect(m).toMatch(/revoke execute on function public\.complete_lesson\([^)]*\) from public, anon, authenticated/);
    expect(m).toMatch(/grant execute on function public\.complete_lesson\([^)]*\) to service_role/);
    expect(m).toMatch(/security invoker\s+set search_path = ''/);
    expect(m).toMatch(/public\.award_xp\(p_user, case when v_first/);
  });
});
