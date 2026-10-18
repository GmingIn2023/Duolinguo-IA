import path from "node:path";
import { here, runFile, migrations, migrationPath } from "./lib.mjs";

// Builds a Supabase-like database on a FRESH server (start-db.mjs wipes its data directory at each start): bootstrap (roles, auth schema) then every migration, in order, as `postgres`.
// Pass --upto=<migration file name> to stop before later migrations (used to test the apply order).
const upto = process.argv.find((a) => a.startsWith("--upto="))?.slice(7);
await runFile(path.join(here, "bootstrap.sql"), "supabase_admin");
for (const m of migrations()) {
  await runFile(migrationPath(m));
  console.log("applied", m);
  if (upto && m === upto) break;
}
