// Freshness check for time-sensitive tool facts, run every Monday. Exit code 1 when a tool has not been re-verified
// within its cadence (30 days, see src/content/tools.ts).
import { TOOLS, staleTools } from "../src/content/tools.ts";

const stale = staleTools();
for (const t of Object.values(TOOLS)) {
  const flag = stale.includes(t) ? "À REVÉRIFIER" : "ok";
  console.log(`${flag.padEnd(13)} ${t.name.padEnd(11)} vérifié le ${t.lastVerified} (tous les ${t.reviewEveryDays} j) · ${t.sources.join(", ")}`);
}
if (stale.length) {
  console.log(`\n${stale.length} outil(s) à revérifier. Mets à jour src/content/tools.ts puis la date lastVerified.`);
  process.exit(1);
}
