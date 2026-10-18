import EmbeddedPostgres from "embedded-postgres";
import { rmSync, existsSync } from "node:fs";
import path from "node:path";
import { here, PORT } from "./lib.mjs";

// An isolated PostgreSQL 17, throw-away data directory, localhost only. No link with any Supabase project.
const dir = path.join(here, ".data");
if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
const pgs = new EmbeddedPostgres({ databaseDir: dir, user: "supabase_admin", password: "local-only-pass", port: PORT, persistent: false });
await pgs.initialise();
await pgs.start();
console.log(`postgres ready on 127.0.0.1:${PORT} (Ctrl+C to stop)`);
const stop = async () => { await pgs.stop(); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
