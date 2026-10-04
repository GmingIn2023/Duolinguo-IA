// Visual QA capture: E2E_EMAIL=… E2E_EMPTY_EMAIL=… E2E_PASSWORD=… node e2e/screens.mjs <outDir>
import { chromium, devices } from "@playwright/test";
const out = process.argv[2] ?? ".impeccable/review/shots";
const base = "http://localhost:3000";
const args = process.env.HTTPS_PROXY ? [`--proxy-server=${process.env.HTTPS_PROXY}`, "--proxy-bypass-list=localhost;127.0.0.1"] : [];
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args });
const settle = (p) => p.waitForTimeout(1100); // let entrance motion finish

async function login(p, email) {
  await p.goto(`${base}/login`);
  await p.getByLabel("Email").fill(email);
  await p.getByLabel("Mot de passe").fill(process.env.E2E_PASSWORD);
  await p.getByRole("button", { name: "Se connecter" }).click();
  await p.waitForURL(/learn/);
}

for (const [name, ctxOpts] of [["desktop", { viewport: { width: 1440, height: 900 } }], ["mobile", devices["iPhone 13"]]]) {
  const ctx = await b.newContext({ ...ctxOpts, ignoreHTTPSErrors: true });
  const p = await ctx.newPage();
  const shot = async (n, full = true) => { await settle(p); await p.screenshot({ path: `${out}/${name}-${n}.png`, fullPage: full }); };

  await p.goto(base); await shot("01-landing");
  await p.goto(`${base}/onboarding`); await shot("02-onboarding", false);
  for (const r of [/au travail/, "Quelques fois", /prédit la suite/, "Je ne sais pas"]) { await p.getByRole("radio", { name: r }).first().click(); await p.waitForTimeout(400); }
  await shot("03-onboarding-result");
  await p.goto(`${base}/signup?track=fox&level=2`); await shot("04-signup", false);
  await p.goto(`${base}/nope`); await shot("05-404", false);

  await login(p, process.env.E2E_EMPTY_EMAIL);
  await shot("06-learn-empty");
  await p.goto(`${base}/review`); await shot("07-review-empty");
  await p.goto(`${base}/profile`); await shot("08-profile-empty");
  await ctx.clearCookies();

  await login(p, process.env.E2E_EMAIL);
  await shot("09-learn");
  await p.goto(`${base}/tracks`); await shot("10-tracks");
  await p.goto(`${base}/review`); await shot("11-review");
  await p.goto(`${base}/profile`); await shot("12-profile");
  await p.goto(`${base}/lesson/panorama-outils`); await shot("13-lesson-intro", false);
  await p.getByRole("button", { name: "Commencer le cours" }).click(); await shot("14-lesson-learn");
  await p.goto(`${base}/lesson/hallucinations`);
  await p.getByRole("button", { name: "Commencer le cours" }).click();
  await p.getByRole("button", { name: "Passer au quiz" }).click();
  await shot("15-q-truefalse", false);
  await p.getByRole("radio", { name: "Vrai" }).click(); await p.getByRole("button", { name: "Vérifier" }).click(); await shot("16-q-wrong", false);
  await p.getByRole("button", { name: "Continuer" }).click(); await shot("17-q-ranking", false);
  await p.getByRole("button", { name: "Vérifier" }).click(); await p.getByRole("button", { name: "Continuer" }).click();
  await shot("18-q-ai-analysis");
  await p.getByRole("checkbox", { name: /probablement inventée/ }).click();
  await p.getByRole("checkbox", { name: /fausse impression/ }).click();
  await p.getByRole("button", { name: "Vérifier" }).click(); await shot("19-q-right", false);
  await ctx.close();
}
await b.close();
console.log("done");
