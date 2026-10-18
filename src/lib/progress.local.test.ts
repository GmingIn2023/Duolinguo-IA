import crypto from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Integration test of the REAL chain: progressService -> supabase-js -> PostgREST -> PostgreSQL, on the isolated local stack
 * in supabase/local-test (see its README). Skipped unless LOCAL_STACK=1. It never reads Supabase settings: the URL and the
 * key below are hard-coded for 127.0.0.1 and signed with a local-only secret, so it cannot reach a Supabase project.
 */
const enabled = process.env.LOCAL_STACK === "1";
vi.mock("server-only", () => ({}));

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
function jwt(role: string, sub?: string) {
  const h = b64({ alg: "HS256", typ: "JWT" });
  const p = b64({ role, ...(sub ? { sub } : {}), exp: Math.floor(Date.now() / 1000) + 3600 });
  return `${h}.${p}.${crypto.createHmac("sha256", "local-test-secret-local-test-secret-1234").update(`${h}.${p}`).digest("base64url")}`;
}
const API = "http://127.0.0.1:54331";

type Pg = { Client: new (cfg: object) => { connect(): Promise<void>; end(): Promise<void>; query(q: string, p?: unknown[]): Promise<{ rows: Record<string, unknown>[] }> } };
async function sql<T = Record<string, unknown>>(q: string, params: unknown[] = []): Promise<T[]> {
  const pgPath = path.resolve(process.cwd(), "supabase/local-test/node_modules/pg/lib/index.js");
  const pg = ((await import(/* @vite-ignore */ pathToFileURL(pgPath).href)) as { default: Pg }).default;
  const c = new pg.Client({ host: "127.0.0.1", port: 54329, database: "postgres", user: "postgres", password: "pg" });
  await c.connect();
  try { return (await c.query(q, params)).rows as T[]; } finally { await c.end(); }
}

async function rpc(fn: string, body: object, role = "service_role") {
  const res = await fetch(`${API}/rest/v1/rpc/${fn}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt(role)}` }, body: JSON.stringify(body) });
  const text = await res.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, json: json as Record<string, unknown> | null, text };
}

async function newUser() {
  const id = crypto.randomUUID();
  await sql("insert into auth.users (id, aud, role, email) values ($1, 'authenticated', 'authenticated', $2)", [id, `${id}@local.test`]);
  await sql("insert into public.profiles (id) values ($1) on conflict do nothing", [id]);
  return id;
}
async function state(id: string, lessonId: string) {
  return {
    xp: Number((await sql<{ xp: number }>("select xp from public.profiles where id = $1", [id]))[0].xp),
    paidEvents: await sql<{ amount: number }>("select amount from public.xp_events where user_id = $1 and source = 'lesson' and ref = $2 and amount > 0", [id, lessonId]),
    allEvents: Number((await sql<{ n: string }>("select count(*) n from public.xp_events where user_id = $1", [id]))[0].n),
    lp: (await sql<{ attempts: number; xp_earned: number; best_score: number }>("select attempts, xp_earned, best_score from public.lesson_progress where user_id = $1 and lesson_id = $2", [id, lessonId]))[0] ?? null,
  };
}

type Modules = { svc: typeof import("./progressService"); store: typeof import("./progressDb.supabase"); content: typeof import("@/content"); admin: typeof import("@/lib/supabase/admin") };
let m: Modules;
beforeAll(async () => {
  if (!enabled) return;
  process.env.NEXT_PUBLIC_SUPABASE_URL = API;
  process.env.SUPABASE_SECRET_KEY = jwt("service_role");
  m = { svc: await import("./progressService"), store: await import("./progressDb.supabase"), content: await import("@/content"), admin: await import("@/lib/supabase/admin") };
});

const fresh = (id: string) => ({ id, streakDays: 0, lastActiveDate: null as string | null });
const pick = () => {
  const lesson = m.content.LESSONS.find((l) => l.questions.length >= 3)!;
  return { lesson, graded: (right = 3) => lesson.questions.slice(0, 3).map((q, i) => ({ questionId: q.id, lessonId: lesson.id, correct: i < right })) };
};
const dbOf = () => m.store.supabaseProgressDb(m.admin.createAdminClient());

describe.skipIf(!enabled)("real chain: supabase-js -> PostgREST -> PostgreSQL 17", () => {
  it("a normal first validation pays in full and writes everything together", async () => {
    const { lesson, graded } = pick();
    const id = await newUser();
    const r = await m.svc.completeLessonCore(dbOf(), fresh(id), lesson, graded(3));
    const s = await state(id, lesson.id);
    expect(r.firstCompletion).toBe(true);
    expect(r.xpEarned).toBe(lesson.xp);
    expect(s.xp).toBe(r.xpEarned);
    expect(s.lp).toMatchObject({ attempts: 1, xp_earned: r.xpEarned, best_score: 100 });
  });

  it("a repeated validation pays nothing inside the window, counts the attempt and keeps the best score", async () => {
    const { lesson, graded } = pick();
    const id = await newUser();
    await m.svc.completeLessonCore(dbOf(), fresh(id), lesson, graded(3));
    const again = await m.svc.completeLessonCore(dbOf(), fresh(id), lesson, graded(1));
    const s = await state(id, lesson.id);
    expect(again).toMatchObject({ xpEarned: 0, firstCompletion: false });
    expect(s.lp).toMatchObject({ attempts: 2, best_score: 100, xp_earned: s.xp });
  });

  it("8 simultaneous validations pay once; profile total = ledger = xp_earned; one first completion", async () => {
    const { lesson, graded } = pick();
    const id = await newUser();
    const runs = await Promise.all(Array.from({ length: 8 }, (_, i) => m.svc.completeLessonCore(dbOf(), fresh(id), lesson, graded(3 - (i % 3)))));
    const s = await state(id, lesson.id);
    expect(s.paidEvents).toHaveLength(1);
    expect(s.xp).toBe(Number(s.paidEvents[0].amount));
    expect(s.lp).toMatchObject({ attempts: 8, xp_earned: s.xp });
    expect(runs.filter((r) => r.firstCompletion)).toHaveLength(1);
    expect(runs.reduce((a, r) => a + r.xpEarned, 0)).toBe(s.xp);
  });

  it("a failure while recording the progress rolls the XP back too, and the retry is a clean first completion", async () => {
    const { lesson, graded } = pick();
    const id = await newUser();
    await sql("create or replace function public.zz_boom() returns trigger language plpgsql as $f$ begin raise exception 'zz boom'; end $f$");
    await sql("create trigger zz_boom before insert or update on public.lesson_progress for each row execute function public.zz_boom()");
    try {
      await expect(m.svc.completeLessonCore(dbOf(), fresh(id), lesson, graded(3))).rejects.toThrow(/zz boom/);
      const s = await state(id, lesson.id);
      expect(s).toMatchObject({ xp: 0, allEvents: 0, lp: null }); // nothing survived: this was impossible with the two-step design
    } finally {
      await sql("drop trigger zz_boom on public.lesson_progress");
      await sql("drop function public.zz_boom()");
    }
    const retry = await m.svc.completeLessonCore(dbOf(), fresh(id), lesson, graded(3));
    expect(retry).toMatchObject({ firstCompletion: true, xpEarned: lesson.xp });
  });

  it("a failure while awarding the XP writes no progress", async () => {
    const { lesson, graded } = pick();
    const id = await newUser();
    await sql("create or replace function public.zz_boom2() returns trigger language plpgsql as $f$ begin raise exception 'zz boom xp'; end $f$");
    await sql("create trigger zz_boom2 before insert on public.xp_events for each row execute function public.zz_boom2()");
    try {
      await expect(m.svc.completeLessonCore(dbOf(), fresh(id), lesson, graded(3))).rejects.toThrow(/zz boom xp/);
      expect(await state(id, lesson.id)).toMatchObject({ xp: 0, allEvents: 0, lp: null });
    } finally {
      await sql("drop trigger zz_boom2 on public.xp_events");
      await sql("drop function public.zz_boom2()");
    }
  });

  it("daily reviews: two identical simultaneous submissions pay each notion once; award_xp still works", async () => {
    const { lesson, graded } = pick();
    const id = await newUser();
    for (const g of graded()) await sql("insert into public.review_items (user_id, question_id, lesson_id, box, due_at) values ($1, $2, $3, 2, now() - interval '1 day')", [id, g.questionId, g.lessonId]);
    const answers = graded().map((g) => ({ target: { questionId: g.questionId, lessonId: g.lessonId }, ok: true }));
    const run = () => m.svc.submitReviewCore(dbOf(), fresh(id), { mode: "daily", answers, expected: 3 });
    const results = await Promise.all([run(), run()]);
    expect(results.reduce((a, r) => a + r.xpEarned, 0)).toBe(6);
    expect((await state(id, lesson.id)).xp).toBe(6);
  });

  it("the existing 6-argument and 7-argument award_xp calls are still accepted", async () => {
    const id = await newUser();
    const six = await rpc("award_xp", { p_user: id, p_amount: 5, p_source: "review", p_ref: "daily", p_streak: 1, p_today: "2026-10-18" });
    const seven = await rpc("award_xp", { p_user: id, p_amount: 5, p_source: "review", p_ref: "daily", p_streak: 1, p_today: "2026-10-18", p_replay_hours: 0 });
    expect([six.status, seven.status]).toEqual([200, 200]);
  });

  it("complete_lesson refuses learners, visitors and invalid parameters, and a refused call writes nothing", async () => {
    const id = await newUser();
    const args = { p_user: id, p_lesson: "zz-lesson", p_xp_first: 40, p_xp_repeat: 8, p_score: 100, p_streak: 1, p_today: "2026-10-18", p_replay_hours: 20 };
    for (const role of ["authenticated", "anon"]) {
      const r = await rpc("complete_lesson", args, role);
      expect([401, 403]).toContain(r.status);
    }
    for (const bad of [{ p_xp_first: 501 }, { p_score: 101 }, { p_score: -1 }, { p_lesson: "" }, { p_replay_hours: 99999 }, { p_xp_repeat: -1 }]) {
      const r = await rpc("complete_lesson", { ...args, ...bad });
      expect(r.status).toBeGreaterThanOrEqual(400);
      expect(String(r.json?.message)).toMatch(/complete_lesson/);
    }
    const unknown = await rpc("complete_lesson", { ...args, p_user: crypto.randomUUID() });
    expect(unknown.status).toBeGreaterThanOrEqual(400);
    expect(await state(id, "zz-lesson")).toMatchObject({ xp: 0, allEvents: 0, lp: null });
    const ok = await rpc("complete_lesson", args);
    expect(ok.status).toBe(200);
  });
});
