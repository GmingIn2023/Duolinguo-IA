import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Local, isolated PostgreSQL only (127.0.0.1). Never a Supabase host: connection settings are hard-coded on purpose.
export const here = path.dirname(fileURLToPath(import.meta.url));
export const repo = path.resolve(here, "../..");
export const PORT = 54329;
const PASSWORDS = { supabase_admin: "local-only-pass", postgres: "pg", authenticator: "x" };

export function client(user = "postgres") {
  return new pg.Client({ host: "127.0.0.1", port: PORT, database: "postgres", user, password: PASSWORDS[user] });
}

/** Runs a script on ONE connection with the simple protocol, like the Supabase SQL editor does for a pasted script. */
export async function runSql(sql, user = "postgres") {
  const c = client(user);
  await c.connect();
  const notices = [];
  c.on("notice", (n) => notices.push(n.message));
  try {
    const res = await c.query(sql);
    return { res, notices };
  } finally {
    await c.end();
  }
}
export const runFile = (file, user) => runSql(readFileSync(file, "utf8"), user);
export const migrations = () => readdirSync(path.join(repo, "supabase/migrations")).filter((f) => f.endsWith(".sql")).sort();
export const migrationPath = (name) => path.join(repo, "supabase/migrations", name);
