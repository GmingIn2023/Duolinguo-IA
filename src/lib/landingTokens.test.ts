import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** Every text/background pair used on the landing must stay readable (WCAG AA, 4.5:1 for normal text). */
const read = (file: string) => readFileSync(path.resolve(import.meta.dirname, "..", "app", file), "utf8");

function tokens(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g)) out[m[1]] = m[2].toLowerCase();
  return out;
}

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const globals = tokens(read("globals.css").split("@theme")[0]);
const landing = { ...globals, ...tokens(read("landing.css").split("/* motion */")[0]) };

describe("landing colour tokens", () => {
  it("overrides the neutrals inside .landing only", () => {
    expect(read("landing.css")).toMatch(/\.landing\s*\{/);
    expect(landing.paper).toBe("#fbf6ec");
    expect(globals.paper).toBe("#f1f1ee"); // the app keeps its cool paper
  });

  it("keeps body text readable on paper and on tiles", () => {
    for (const fg of ["ink", "ink-2", "muted"] as const) {
      for (const bg of ["paper", "surface", "sunk"] as const) {
        expect(contrast(landing[fg], landing[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("keeps ink readable on every track and theme colour", () => {
    for (const c of ["bird", "gecko", "fox", "sky", "lilac", "rose", "teal", "indigo", "peach", "bird-soft", "gecko-soft", "fox-soft", "sky-soft", "lilac-soft", "rose-soft"]) {
      expect(contrast(landing.ink, landing[c]), `ink on ${c}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps inverse text readable on ink", () => {
    expect(contrast(landing.paper, landing.ink)).toBeGreaterThanOrEqual(7);
  });
});
