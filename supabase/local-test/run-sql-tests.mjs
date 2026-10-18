import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { repo, runSql, runFile, client, migrationPath } from "./lib.mjs";

// Needs: node start-db.mjs (other terminal) and node reset.mjs. Runs every supabase/tests/*.sql, then the unexpected-state checks.
let failed = 0;
const ok = (name, pass, detail = "") => { console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`); if (!pass) failed++; };

for (const f of readdirSync(path.join(repo, "supabase/tests")).filter((x) => x.endsWith(".sql")).sort()) {
  try {
    const { notices, res } = await runFile(path.join(repo, "supabase/tests", f));
    const rows = (Array.isArray(res) ? res : [res]).flatMap((r) => r.rows ?? []).map((r) => JSON.stringify(r));
    ok(f, true, [...notices, ...rows].join(" | "));
  } catch (e) { ok(f, false, e.message); }
}

// Unexpected states for migration 20261018000000: it must refuse and change nothing.
const mig = readFileSync(migrationPath("20261018000000_complete_lesson.sql"), "utf8");
const sig = "public.complete_lesson(uuid,text,integer,integer,integer,integer,date,integer)";
async function inTx(setup) {
  const c = client(); await c.connect();
  try {
    await c.query("begin");
    if (setup) await c.query(setup);
    let error = null;
    try { await c.query(mig); } catch (e) { error = e; }
    await c.query("rollback");
    return error;
  } finally { await c.end(); }
}
let e = await inTx(null);
ok("migration applied twice is refused", e?.message.includes("already exists"), e?.message ?? "no error");
e = await inTx(`drop function ${sig}; drop function public.award_xp(uuid, integer, text, text, integer, date, integer);`);
ok("migration without the 7-argument award_xp is refused", e?.message.includes("needs the 7-argument award_xp"), e?.message ?? "no error");
const still = await runSql(`select to_regprocedure('${sig}') is not null as there, (select count(*) from pg_proc where proname = 'award_xp') as n`);
ok("state unchanged after the refusals", still.res.rows[0].there && Number(still.res.rows[0].n) === 1);

// Migration 20261017000000 on a state that is not the expected one is refused (strict drop + assertion).
const m17 = readFileSync(migrationPath("20261017000000_award_xp_replay_window.sql"), "utf8");
{
  const c = client(); await c.connect(); let err = null;
  try { await c.query("begin"); await c.query(m17); } catch (x) { err = x; } finally { await c.query("rollback"); await c.end(); }
  ok("award_xp migration on an already migrated database is refused", err?.message.includes("expected exactly the 6-argument"), err?.message ?? "no error");
}
console.log(failed ? `\n${failed} FAILED` : "\nall SQL checks passed");
process.exit(failed ? 1 : 0);
