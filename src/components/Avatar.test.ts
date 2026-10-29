import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TRACK_IDS } from "@/content";
import { Avatar, type Mood } from "./Avatar";

const MOODS: Mood[] = ["happy", "cheer", "oops", "think", "sleep", "wow"];
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
      expect(html).not.toContain("m-blink");
      expect(html).not.toContain("m-look");
    }
  });

  it("awake mascots with open eyes can follow the pointer and blink", () => {
    for (const track of TRACK_IDS) {
      for (const mood of ["happy", "oops", "think"] as Mood[]) {
        const html = render(track, mood);
        expect(html).toContain("m-look");
        expect(html).toContain("m-blink");
      }
    }
  });

  it("happy mascots (cheer) keep their smiling closed eyes without the look group", () => {
    for (const track of TRACK_IDS) expect(render(track, "cheer")).not.toContain("m-look");
  });
});

describe("Avatar motion and accessibility", () => {
  it("is hidden from assistive technology when decorative", () => {
    const html = renderToStaticMarkup(createElement(Avatar, { track: "fox", decorative: true }));
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
  });
  it("breathes only when asked, and plays its mood once", () => {
    expect(renderToStaticMarkup(createElement(Avatar, { track: "gecko", animate: true }))).toContain("m-alive");
    expect(renderToStaticMarkup(createElement(Avatar, { track: "gecko" }))).not.toContain("m-alive");
    expect(render("bird", "cheer")).toContain("m-cheer");
  });
});
