import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TRACK_IDS } from "@/content";
import { Avatar, type Mood } from "./Avatar";

const MOODS: Mood[] = ["happy", "cheer", "oops", "think", "sleep"];
const render = (track: (typeof TRACK_IDS)[number], mood: Mood) => renderToStaticMarkup(createElement(Avatar, { track, mood }));

describe("Avatar", () => {
  it("renders every track in every mood with an accessible name", () => {
    for (const track of TRACK_IDS) {
      for (const mood of MOODS) {
        const html = render(track, mood);
        expect(html).toContain("<svg");
        expect(html).toContain('role="img"');
        expect(html).toMatch(/aria-label="[^"]+"/);
      }
    }
  });

  it("sleeping mascots have closed eyes: nothing blinks and nothing looks around", () => {
    for (const track of TRACK_IDS) {
      const html = render(track, "sleep");
      expect(html).not.toContain("mascot-blink");
      expect(html).not.toContain("mascot-look");
    }
  });

  it("awake mascots with open eyes can follow the pointer and blink", () => {
    for (const track of TRACK_IDS) {
      for (const mood of ["happy", "oops", "think"] as Mood[]) {
        const html = render(track, mood);
        expect(html).toContain("mascot-look");
        expect(html).toContain("mascot-blink");
      }
    }
  });

  it("happy mascots (cheer) keep their smiling closed eyes without the look group", () => {
    for (const track of TRACK_IDS) expect(render(track, "cheer")).not.toContain("mascot-look");
  });
});
