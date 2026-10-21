import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { existsSync } from "node:fs";
import { here } from "./lib.mjs";

// PostgREST (local binary, see README) on 127.0.0.1:54330 plus a tiny proxy on 54331 that maps supabase-js's /rest/v1/* to it.
const bin = process.env.POSTGREST_BIN ?? path.join(here, ".postgrest", process.platform === "win32" ? "postgrest.exe" : "postgrest");
if (!existsSync(bin)) { console.error(`PostgREST binary not found: ${bin}. Download it from https://github.com/PostgREST/postgrest/releases (v14.x) or set POSTGREST_BIN.`); process.exit(1); }
const pgBin = path.join(here, "node_modules/@embedded-postgres", `${process.platform === "win32" ? "windows" : process.platform}-x64`, "native", process.platform === "win32" ? "bin" : "lib");
const child = spawn(bin, [path.join(here, "postgrest.conf")], { stdio: "inherit", env: { ...process.env, PATH: `${pgBin}${path.delimiter}${process.env.PATH}` } });
child.on("exit", (c) => process.exit(c ?? 1));

http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const headers = { ...req.headers }; delete headers.host; delete headers["content-length"];
  try {
    const r = await fetch("http://127.0.0.1:54330" + req.url.replace(/^\/rest\/v1/, ""), { method: req.method, headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const out = Buffer.from(await r.arrayBuffer());
    const h = {}; r.headers.forEach((v, k) => { if (!["content-encoding", "transfer-encoding", "content-length"].includes(k)) h[k] = v; });
    res.writeHead(r.status, h); res.end(out);
  } catch (e) { res.writeHead(502); res.end(String(e)); }
}).listen(54331, "127.0.0.1", () => console.log("api proxy on http://127.0.0.1:54331 (Ctrl+C to stop)"));
for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => { child.kill(); process.exit(0); });
