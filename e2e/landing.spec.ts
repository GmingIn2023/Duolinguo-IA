import { expect, test } from "@playwright/test";
import { LESSONS, TRACKS, trackLessons } from "../src/content";
import { answerCorrectly } from "./quiz";

// The landing page: public, no account needed.

test.describe("whole page", () => {
  test("every visible text keeps WCAG AA contrast on its real background", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2500); // entrance motion
    const fails = await page.evaluate(() => {
      // any CSS colour (rgb, oklab, color-mix…) is resolved to RGBA through a canvas pixel
      const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
      const parse = (c: string) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = "#000";
        ctx.fillStyle = c;
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
      };
      const lum = (c: { r: number; g: number; b: number }) => {
        const f = (v: number) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
      };
      const backgroundOf = (el: Element | null) => {
        const layers: { r: number; g: number; b: number; a: number }[] = [];
        for (let e = el; e; e = e.parentElement) {
          const c = parse(getComputedStyle(e).backgroundColor);
          if (c && c.a > 0) {
            layers.push(c);
            if (c.a >= 1) break;
          }
        }
        let base = { r: 251, g: 246, b: 236 };
        for (const l of layers.reverse()) base = { r: l.r * l.a + base.r * (1 - l.a), g: l.g * l.a + base.g * (1 - l.a), b: l.b * l.a + base.b * (1 - l.a) };
        return base;
      };
      const out: string[] = [];
      let checked = 0;
      document.querySelectorAll("body *").forEach((el) => {
        if (el.closest("svg") && el.tagName !== "text") return;
        if (["SCRIPT", "STYLE"].includes(el.tagName) || el.closest(".sr-only") || el.closest("[data-nextjs-toast], nextjs-portal")) return;
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? "").trim().length > 1);
        if (!own) return;
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (!rect.width || !rect.height || style.display === "none") return;
        let opacity = 1;
        for (let e: Element | null = el; e; e = e.parentElement) opacity *= parseFloat(getComputedStyle(e).opacity);
        if (opacity < 0.05) return; // a bubble waiting its turn is not on screen
        const fg = parse(style.color);
        const bg = backgroundOf(el);
        const a = fg.a * opacity;
        const mixed = { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) };
        const [hi, lo] = [lum(mixed), lum(bg)].sort((x, y) => y - x);
        const ratio = (hi + 0.05) / (lo + 0.05);
        checked++;
        const size = parseFloat(style.fontSize);
        const large = size >= 24 || (size >= 18.66 && parseInt(style.fontWeight) >= 700);
        if (ratio < (large ? 3 : 4.5)) out.push(`${(el.textContent ?? "").trim().slice(0, 40)} (${ratio.toFixed(2)})`);
      });
      return { out, checked };
    });
    expect(fails.checked, "the audit must actually look at the page").toBeGreaterThan(80);
    expect(fails.out, fails.out.join("\n")).toEqual([]);
  });

  test("the token demo starts complete and each draw changes the sentence", async ({ page }) => {
    await page.goto("/");
    const demo = page.locator("section", { has: page.getByRole("heading", { name: "Regarde-le choisir ses mots." }) });
    await expect(demo.getByText("Pour réussir une mayonnaise, commence par")).toBeVisible();
    await expect(demo.getByRole("list", { name: /probabilité/ }).getByRole("listitem")).toHaveCount(5);
    const seen = new Set<string>();
    for (let i = 0; i < 25; i++) {
      await demo.getByRole("button", { name: "Relancer" }).click();
      seen.add((await demo.locator("p[aria-live=\"polite\"]").first().textContent()) ?? "");
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  test("the footer mascots wake up when the page ends", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator("footer").getByText("zzz")).toHaveCSS("opacity", "0", { timeout: 8000 });
  });
});

test.describe("how it works: the thread and its four stops", () => {
  test("the thread passes through every numbered stop, at desktop and phone widths", async ({ page }) => {
    await page.goto("/");
    await page.locator("#comment").scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const gaps = await page.evaluate(() => {
      const path = document.querySelector<SVGPathElement>(".how-base")!;
      const box = document.querySelector(".how-trail")!.getBoundingClientRect();
      const len = path.getTotalLength();
      const samples = Array.from({ length: 800 }, (_, i) => path.getPointAtLength((i / 799) * len));
      return [...document.querySelectorAll(".how-dot")].map((d) => {
        const r = d.getBoundingClientRect();
        const cx = r.left + r.width / 2 - box.left;
        const cy = r.top + r.height / 2 - box.top;
        return Math.min(...samples.map((p) => Math.hypot(p.x - cx, p.y - cy)));
      });
    });
    expect(gaps).toHaveLength(4);
    for (const gap of gaps) expect(gap).toBeLessThan(6);
  });

  test("the four stops light up as you scroll, and each card carries real content", async ({ page }) => {
    await page.goto("/");
    const steps = page.locator(".how-step");
    await expect(steps).toHaveCount(4);
    await page.locator(".how-again").scrollIntoViewIfNeeded();
    await expect(page.locator(".how-step.is-reached")).toHaveCount(4);
    await expect(page.locator(".how-chapters li.is-start")).toContainText("Tu commences ici");
    // the course excerpt asks a real true/false question and answers it on the spot
    await page.getByRole("radiogroup", { name: "Vrai ou faux" }).getByRole("radio", { name: "Vrai" }).click();
    await expect(page.locator(".how-try-why")).toContainText(/Juste\.|Pas tout à fait\./);
    await expect(page.locator(".how-mark-hl")).toBeVisible();
  });

  test("reduced motion: the thread is already drawn and every card is readable at rest", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator(".how-step.is-reached")).toHaveCount(4);
    const hidden = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>(".how-card")].filter((c) => getComputedStyle(c).transform !== "none" || Number(getComputedStyle(c).opacity) < 1).length);
    expect(hidden).toBe(0);
    await context.close();
  });
});

test.describe("themes and plan, drawn from the real curriculum", () => {
  test("ten theme tiles, one dot per lesson, and a tile lights its lessons in every track", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("list", { name: "Les dix thèmes" }).getByRole("button")).toHaveCount(10);
    await expect(page.locator("#plan button.plan-dot")).toHaveCount(LESSONS.length);
    const agents = page.getByRole("button", { name: /Agents IA/ });
    await agents.click();
    await expect(agents).toHaveAttribute("aria-pressed", "true");
    // Découvrir has no agents lesson; Construire does
    await expect(page.locator("#plan-bird button.plan-dot:not([data-dim])")).toHaveCount(0);
    expect(await page.locator("#plan-fox button.plan-dot:not([data-dim])").count()).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Afficher tous les thèmes" }).click();
    await expect(page.locator("#plan button.plan-dot[data-dim]")).toHaveCount(0);
  });

  test("a lesson dot can be reached and read with the keyboard", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle"); // the plan reacts only once the page is hydrated
    const col = page.locator("#plan-bird");
    await col.scrollIntoViewIfNeeded();
    const first = col.locator("button.plan-dot").first();
    await first.focus();
    await page.keyboard.press("Enter");
    await expect(col.locator("p[aria-live] strong")).toHaveText((await first.getAttribute("aria-label"))!);
  });

  test("the three tracks each draw their own chapters", async ({ page }) => {
    await page.goto("/");
    for (const t of ["bird", "gecko", "fox"] as const) {
      const col = page.locator(`#plan-${t}`);
      await expect(col.locator(".plan-chapters > li")).toHaveCount(TRACKS[t].chapters.length);
      await expect(col.locator("button.plan-dot")).toHaveCount(trackLessons(t).length);
    }
  });
});

test.describe("level test inside the landing page", () => {
  test("the question bank (with its answers) is only downloaded when the test starts", async ({ page }) => {
    const MARK = "dans une base de r"; // ASCII part of a bank question, absent from every other module
    const holders: string[] = [];
    page.on("response", async (res) => {
      if (!res.url().includes("/_next/") || !res.url().endsWith(".js")) return;
      try {
        if ((await res.text()).includes(MARK)) holders.push(res.url());
      } catch {}
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // the whole landing is on screen and usable, yet the bank has not been downloaded
    const goals = page.getByRole("radiogroup", { name: "Ton objectif" });
    await expect(goals).toBeVisible();
    expect(holders, `bank found in: ${holders.join(", ")}`).toEqual([]);
    await goals.getByRole("radio", { name: /Construire avec l'IA/ }).click();
    await expect(page.locator("#test").getByRole("button", { name: "Je ne sais pas" })).toBeVisible({ timeout: 20_000 });
    expect(holders.length).toBeGreaterThan(0);
  });

  test("everything right on the Construire test: 10/10, straight to the final project, answers travel to signup", async ({ page }) => {
    await page.goto("/");
    const box = page.locator("#test");
    await box.getByRole("radio", { name: /Construire avec l'IA/ }).click();
    for (let i = 1; i <= 10; i++) {
      await expect(box.getByRole("progressbar", { name: "Avancement du test" })).toHaveAttribute("aria-valuenow", String(i - 1), { timeout: 20_000 });
      await answerCorrectly(box);
      await box.getByRole("button", { name: /^Valider/ }).click();
    }
    await expect(box.locator("p", { hasText: "Ton score" })).toContainText("10/10");
    // every tested chapter is validated; the final project is never skipped by a test
    await expect(box.getByRole("heading", { name: `Tu commences au chapitre ${TRACKS.fox.chapters.length} : ${TRACKS.fox.chapters.at(-1)!.name}` })).toBeVisible();
    await box.getByRole("button", { name: "Créer mon compte et commencer" }).click();
    await expect(page).toHaveURL(/\/signup\?track=fox/, { timeout: 30_000 });
    const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem("gusgus.onboarding") ?? "{}"));
    expect(stored.placement).toHaveLength(10);
    expect(stored.goal).toBe("build");
    expect(stored.tested).toBe("fox");
    expect(stored.track).toBe("fox");
  });

  test("« Je ne sais pas » everywhere on Découvrir: 0/10, start at chapter 1, and a warning when picking another track", async ({ page }) => {
    await page.goto("/");
    const box = page.locator("#test");
    await box.getByRole("radio", { name: /Comprendre ce qu'est l'IA/ }).click();
    for (let i = 0; i < 10; i++) await box.getByRole("button", { name: "Je ne sais pas" }).click({ timeout: 20_000 });
    await expect(box.locator("p", { hasText: "Ton score" })).toContainText("0/10");
    await expect(box.getByRole("heading", { name: /Tu commences au chapitre 1/ })).toBeVisible();
    await box.getByRole("button", { name: "Choisir un autre parcours" }).click();
    await box.getByRole("radio", { name: /Pratiquer/ }).click();
    await expect(box.getByRole("alert")).toContainText("Ton test portait sur Découvrir");
    await box.getByRole("button", { name: /Revenir à Découvrir/ }).click();
    await expect(box.getByRole("alert")).toHaveCount(0);
    await box.getByRole("button", { name: "Refaire le test" }).click();
    await expect(box.getByRole("button", { name: "Je ne sais pas" })).toBeVisible();
  });

  test("choosing a track directly skips the test and still reaches signup", async ({ page }) => {
    await page.goto("/");
    await page.locator("#depart").getByRole("button", { name: /Pratiquer/ }).click();
    const panel = page.getByRole("status").filter({ hasText: "Tu pars sur Pratiquer" });
    await expect(panel).toBeVisible();
    await panel.getByRole("button", { name: "Créer mon compte et commencer" }).click();
    await expect(page).toHaveURL(/\/signup\?track=gecko/, { timeout: 30_000 });
    const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem("gusgus.onboarding") ?? "{}"));
    expect(stored.placement).toEqual([]);
  });
});

test("the three guides are links with a readable name, in track order", async ({ page }) => {
  await page.goto("/");
  const guides = page.getByRole("list", { name: "Les trois parcours" }).getByRole("link");
  await expect(guides).toHaveCount(3);
  await expect(guides.nth(0)).toHaveAccessibleName(/Découvrir/);
  await expect(guides.nth(1)).toHaveAccessibleName(/Pratiquer/);
  await expect(guides.nth(2)).toHaveAccessibleName(/Construire/);
});

test("one speech bubble is visible at a time, and it does not need a hover", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1600); // entrance motion, then the first bubble
  const visible = page.locator('.bubble-say[data-on="true"]');
  await expect(visible).toHaveCount(1);
  await expect(visible).toBeVisible();
});

test("pointing at a guide keeps its bubble and focusing by keyboard works too", async ({ page }) => {
  await page.goto("/");
  const gecko = page.getByRole("list", { name: "Les trois parcours" }).getByRole("link").nth(1);
  await gecko.focus();
  await expect(page.locator('.bubble-say[data-on="true"]')).toContainText("tombe souvent à côté");
});

test("no horizontal scroll and the headline is complete", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const title = page.getByRole("heading", { level: 1 });
  for (const line of ["Apprends l'IA", "comme une", "langue."]) await expect(title).toContainText(line);
});

test("reduced motion: everything is visible at rest and nothing keeps moving", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator(".landing-scene .guide").first()).toBeVisible();
  const animations = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && (a.effect?.getTiming().iterations ?? 1) === Infinity).length);
  expect(animations).toBe(0);
  await context.close();
});
