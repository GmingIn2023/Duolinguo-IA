---
name: Gusgus — Way of Learning AI
description: Short, progressive AI lessons handled like physical tiles you pick up and press.
colors:
  paper: "#f1f1ee"
  surface: "#ffffff"
  sunk: "#e7e7e3"
  ink: "#000000"
  ink-2: "#3a3a37"
  muted: "#66665f"
  line: "#dcdcd6"
  edge: "#d3d3cc"
  bird: "#ffd43b"
  bird-deep: "#c99a00"
  bird-soft: "#fff5cc"
  gecko: "#3bd671"
  gecko-deep: "#189a47"
  gecko-soft: "#dcf7e5"
  fox: "#ff6b2c"
  fox-deep: "#c4470f"
  fox-soft: "#ffe6d9"
  good: "#137a3a"
  good-soft: "#e2f5e8"
  bad: "#c22a1b"
  bad-soft: "#fce8e5"
typography:
  display:
    fontFamily: "Archivo, sans-serif"
    fontSize: "clamp(3.25rem, 7.4vw, 7.25rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 112"
  headline:
    fontFamily: "Archivo, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 112"
  title:
    fontFamily: "Archivo, sans-serif"
    fontSize: "clamp(2rem, 3.2vw, 2.875rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 112"
  title-small:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 112"
  lede:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 1.3vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "'ss01'"
  body-reading:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  key: "8px"
  sm: "10px"
  field: "12px"
  choice: "14px"
  tile: "16px"
  badge: "24px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  2xl: "32px"
  3xl: "40px"
  section: "112px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "#262624"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "52px"
  button-accent:
    backgroundColor: "{colors.bird}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "52px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.sunk}"
  button-large:
    padding: "0 32px"
    height: "60px"
  tile:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.tile}"
    padding: "20px"
  tile-accent:
    backgroundColor: "{colors.bird}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    padding: "24px"
  tile-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.tile}"
    padding: "32px"
  tile-sunk:
    backgroundColor: "{colors.sunk}"
    textColor: "{colors.muted}"
    rounded: "{rounded.tile}"
    padding: "20px"
  choice:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.choice}"
    padding: "14px 18px"
    height: "56px"
  choice-selected:
    backgroundColor: "{colors.bird-soft}"
    textColor: "{colors.ink}"
  choice-correct:
    backgroundColor: "{colors.good-soft}"
    textColor: "{colors.ink}"
  choice-wrong:
    backgroundColor: "{colors.bad-soft}"
    textColor: "{colors.ink}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0 16px"
    height: "52px"
  nav-rail-item:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.field}"
    padding: "0 14px"
    height: "48px"
  nav-rail-item-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
---

# Design System: Gusgus — Way of Learning AI

## Overview

**Creative North Star: "The Tile Table"**

Learning AI is handled like physical objects on a cool grey table. Every lesson, panel and answer is a tile: a flat, opaque slab with a visible pressed underside that collapses when you push it. Progress is a column of tiles you work down, not a winding path of bubbles and not a SaaS card grid. The table is quiet (cool paper, white, true black); colour appears only as the flat field of the track you are in.

Type does the shouting. Archivo, set expanded and extra-bold, runs enormous on the landing and lesson-complete screens and at title scale everywhere else; Geist carries all UI and reading text calmly. Compositions are large and spare: one strong headline, one column of tiles, generous gaps. Motion is sober and physical: tiles lift 2px on hover and sink 4px on press, display lines rise out of a mask, wrong answers shake once.

The world refuses the category default of round lesson bubbles on a winding path, gradient fills, and blurred floating cards. Depth is a solid edge, never a glow.

**Key Characteristics:**
- Cool paper ground, white tiles, true black ink; one track colour per screen, used as flat fields.
- Every interactive object has a crisp pressed edge (solid, unblurred, offset straight down) that collapses on `:active`.
- Archivo expanded black for display, Geist for everything else; no uppercase labels.
- Pills for actions, 16px-cornered tiles for objects.
- Metadata sits below its title as a quiet muted line joined with middots.

## Colors

A near-monochrome table (cool greys, white, black) lit by exactly one flat track colour at a time.

### Primary
- **Ink Black** (`ink`): headlines, body text, the primary pill button, completed-lesson badges, the ink tile, focus outlines and selection. True black, never softened.

### Secondary (track accents, one per screen)
The active track sets `--accent`, `--accent-deep`, `--accent-soft` via `data-track` on a container; components only ever reference the accent variables, never a track by name.
- **Canary** (`bird`, deep `bird-deep`, soft `bird-soft`): Bird track (complete beginners). Also the fill of the XP bolt icon everywhere.
- **Leaf** (`gecko`, deep `gecko-deep`, soft `gecko-soft`): Gecko track (students).
- **Vermilion** (`fox`, deep `fox-deep`, soft `fox-soft`): Fox track (AI for work). Also the fill of the streak flame and the "watch out" bullet.

The base colour is the flat field (accent tile, current lesson badge, progress fill, due-count badge); the deep step is only ever its pressed edge; the soft step is the selected-choice and skill-chip wash. Text on any accent field is ink.

### Tertiary (feedback)
- **Correct Green** (`good`, `good-soft`): correct answer border, edge and feedback sheet; soft step is its wash.
- **Error Red** (`bad`, `bad-soft`): wrong answer border, edge, invalid field ring and feedback sheet.

### Neutral
- **Cool Paper** (`paper`): page ground, theme colour, inverse text on ink.
- **White** (`surface`): every tile, choice, field and the active nav item.
- **Sunk Grey** (`sunk`): locked lessons, empty progress track, ghost hover, neutral chips. Inset, never raised.
- **Graphite** (`ink-2`): secondary text and ledes (11:1 on white).
- **Stone** (`muted`): tertiary text and metadata lines (5:1 on white, 4.6:1 on paper). Do not go lighter for text.
- **Hairline** (`line`): 1px dividers, rail border, unselected choice and field strokes.
- **Underside** (`edge`): the pressed edge of white tiles. Exists only as a shadow colour.

### Named Rules
**The One Track Rule.** A screen shows one track colour, set by `data-track`. The landing's three-track stack is the only place all three appear together, each on its own tile.

**The Edge Is Deeper Rule.** A pressed edge is always the darker step of its own tile colour: `edge` under white, `accent-deep` under accent, Graphite under ink, `good`/`bad` under feedback states. Never a neutral grey under a coloured tile.

## Typography

**Display Font:** Archivo (variable, `wdth` axis at 112%, weight 800), fallback sans-serif
**Body Font:** Geist (with system-ui, sans-serif), stylistic set `ss01` on

**Character:** A wide, heavy grotesque that reads like a stamped label on a tile, paired with a neutral, precise UI sans that stays out of the way.

### Hierarchy
- **Display** (800, clamp(3.25rem, 7.4vw, 7.25rem), 0.92): landing hero only, set in masked reveal lines. The lesson-complete XP figure goes larger still (clamp(4.5rem, 16vw, 11rem), 0.85).
- **Headline** (800, clamp(2.5rem, 5vw, 4.5rem), 0.92): landing section heads, lesson intro titles, retry interstitials.
- **Title** (800, clamp(2rem, 3.2vw, 2.875rem), 0.98): page titles in the app (track name, "Parcours terminé."), quiz question headings, error states.
- **Title Small** (800, 1.5rem, 1.05, -0.02em): tile titles (track tiles, tool cards, lesson section heads), the wordmark.
- **Lede** (400, clamp(1.0625rem, 1.3vw, 1.25rem), 1.5, Graphite, max 38ch): the one sentence under a headline.
- **Body** (400, 1rem, 1.55); **Reading** (400, 1.0625rem, 1.65, Graphite, max 66ch) for lesson prose.
- **Label** (500, 0.875rem, Stone): metadata lines, stat labels. Sentence case; never uppercase, never letter-spaced.

All display text uses `text-wrap: balance`. Numbers that change (XP, streak, counts, scores) use tabular figures.

### Named Rules
**The Title-Then-Meta Rule.** Small metadata ("Bird · Débutant complet · 6 cours", "Découverte · 5 min · 20 XP") goes directly below its title, in Label style, joined with middots. Nothing small sits above a title: no kickers, no eyebrows, no category tags.

**The Two Voices Rule.** Archivo is only ever display (800, expanded). Geist is everything else, at 400 to 700. No third face, no Archivo at body size.

## Layout

Desktop first, mobile excellent. The landing uses a 12-column grid inside a 90rem container (16px gutter on phones, 32px from `sm`): the headline spans 7 columns, the offset track-tile stack spans 5 and steps right by 0, 2.5 and 5rem (the offsets collapse to a straight stack on phones). Sections are separated by large vertical space (80px, 112px from `lg`).

The app shell is a 16rem left rail plus content on `lg`; below `lg` it becomes a sticky 56px top bar (wordmark plus streak and XP) and a fixed four-item bottom bar with safe-area padding. The learn page is a centre tile column with a 20rem "Aujourd'hui" panel on the right from `xl`, sticky at the top; below `xl` the panel stacks under the column. Lesson and quiz screens are a single 48rem column under a sticky progress header, with the answer sheet fixed to the bottom.

Rhythm: tiles in a column sit 16 to 20px apart; tile padding is 20px, 24px on accent tiles, 28 to 32px on the current lesson and ink tiles; page sections inside the app are 40px apart.

## Elevation & Depth

Depth is material, not atmospheric. There is exactly one shadow grammar: a solid, unblurred edge offset straight down, in the darker step of the object's own colour. It reads as the thickness of a slab, not as light. Surfaces that are not touchable either have no edge (sunk tiles, locked lessons) or only a hairline.

### Shadow Vocabulary
- **Tile edge** (`box-shadow: 0 5px 0 var(--edge)`): every tile at rest. Accent tile uses `var(--accent-deep)`; ink tile uses `#3a3a37`.
- **Tile lift** (`box-shadow: 0 7px 0 …; transform: translateY(-2px)`): pressable tiles on hover (hover-capable devices only).
- **Tile press** (`box-shadow: 0 1px 0 …; transform: translateY(4px)`, 60ms): pressable tiles on `:active`; the edge collapses.
- **Button edge** (`box-shadow: 0 3px 0 #3a3a37`): primary pill; accent pill uses `0 3px 0 var(--accent-deep)`. Press is `translateY(2px) scale(0.985)`.
- **Small edge** (`box-shadow: 0 3px 0 var(--edge)`): choices, active rail item, rail profile card.
- **Inset floor** (`box-shadow: inset 0 -4px 0 var(--accent-deep)`): the current-lesson number badge and the progress fill, which sit in the accent field rather than on top of it.

### Named Rules
**The Pressed Edge Rule.** This world's material is the crisp pressed-edge tile ("ombre portée nette"), chosen explicitly by the user. Every raised object carries a 3 to 5px solid edge with zero blur, offset only on the y axis. No blurred shadows, no glows, no x offset, no elevation without an edge.

**The Edge Collapses Rule.** Anything with an edge that is pressable must physically press: on `:active` it moves down by the edge height minus 1px and the edge shrinks to match. A tile that keeps its edge when pressed is a picture of a button.

## Shapes

Two silhouettes. Actions are full pills (999px). Objects are soft-cornered slabs: tiles 16px, choices 14px, fields and rail items 12px, small buttons and inline blanks 8 to 10px, key badges 8px. Avatar badges are 16 to 24px squircle-ish squares filled with the accent. Strokes are inset box-shadows (1.5px hairline at rest, 2px ink or feedback colour when selected), so borders never change an object's size. Dots in bullet lists are 6px circles in ink (positive) or vermilion (warning). Mascots are flat inline SVG on accent fields.

## Components

### Buttons
Tactile and confident: every button is a pill with a short edge.
- **Shape:** full pill (999px), 52px tall, 24px side padding; large variant 60px tall, 32px padding, 17px text. Text is Geist 600, 16px.
- **Primary:** ink pill, paper text, 3px Graphite edge. Hover darkens to `#262624`. One per view.
- **Accent:** track-colour pill, ink text, 3px `accent-deep` edge.
- **Secondary:** white pill with a 1.5px inset ink ring; hover goes to paper.
- **Ghost:** transparent, 44px tall; hover fills Sunk Grey.
- **Press / Disabled:** `:active` moves 2px down and scales to 0.985; disabled is 35% opacity.
- **On ink tiles:** paper-filled pill or a pill with an inset 1.5px paper ring.

### Tiles (signature)
The unit of the world. A white slab, 16px corners, `0 5px 0` edge.
- **Variants:** white (default), accent (flat track colour, `accent-deep` edge), ink (black, paper text, Graphite edge, for milestones like "Parcours terminé." and the last step of the landing loop), sunk (grey, no edge, for locked or inert content).
- **Pressable:** links built as tiles lift on hover and collapse on press (160ms, 60ms on press, `cubic-bezier(0.16, 1, 0.3, 1)`).
- **Lesson tile:** number/check/lock badge on the left (56 to 72px, 16px corners: ink with a white check when done, accent with inset floor when current, paper with a lock when locked), Geist 600 title, Label meta line below. The current lesson is larger, has a 2px ink outline, a display-face title, its objective, and a primary pill on the right.

### Choices (quiz, onboarding)
- **Style:** full-width white slab, 56px min height, 14px corners, 1.5px Hairline inset ring, 3px edge, a 28px key badge (1, 2, 3…) on the left, Geist 500 at 17px.
- **States:** hover darkens the ring to Graphite; press drops 2px; selected fills `accent-soft` with a 2px ink ring and 3px ink edge; correct fills Correct Green soft with green ring and edge; wrong does the same in Error Red. Never colour alone: the feedback sheet names the result in words.

### Chips
- **Skill chips:** `accent-soft` fill, 8px corners, Geist 500 at 15px, no edge (they are labels, not objects).
- **Count badge:** accent pill with ink tabular number, on the Révisions nav item.

### Inputs / Fields
- **Style:** white, 52px tall, 12px corners, 1.5px Hairline inset ring, 16px padding; placeholder in Stone.
- **Focus:** ring becomes 2px ink (no glow).
- **Error:** ring becomes 2px Error Red with `aria-invalid`.

### Navigation
- **Rail (desktop):** 48px items, 12px corners, 20px line icon plus Geist 500 label in Graphite; hover fills Sunk; active becomes a white mini-tile with a 3px edge, ink text and a heavier icon stroke. The profile card (avatar, name, XP and streak) is pinned to the bottom as a small tile.
- **Bottom bar (mobile):** four equal columns, 22px icon over a 12px label, Stone at rest, ink when active; paper at 95% with backdrop blur and a hairline top border.

### Answer Sheet
A full-width sheet fixed to the bottom of the quiz, sliding up in 320ms. Correct uses the green wash with a green pill; wrong uses the red wash with a red pill and a one-time shake on the question. It states the result in bold ("Pas tout à fait."), the correct answer, then the explanation in Graphite.

### Masked Line Reveal (signature motion)
Display lines rise from below a clipping mask (900ms, 90ms stagger per line). Used only for the landing headline and the lesson-complete XP figure. Reduced motion shortens every animation and transition to 1ms.

## Do's and Don'ts

### Do:
- **Do** give every raised, touchable object a solid pressed edge (`0 3px 0` to `0 5px 0`, zero blur) in the darker step of its own colour, and collapse it on `:active`.
- **Do** set one track colour per screen through `data-track` and reference only `--accent`, `--accent-deep`, `--accent-soft` in components.
- **Do** put text on accent fields in ink, and keep accent use to flat fields (tiles, badges, progress fill, selected wash).
- **Do** place metadata directly below its title in Label style (14px, Stone, middot-separated).
- **Do** use Archivo 800 at `wdth` 112% for display only, with `text-wrap: balance` and tight negative tracking (-0.035em, -0.02em at small sizes).
- **Do** use pills for actions and 16px-cornered tiles for objects.
- **Do** use tabular figures for XP, streaks, counts and scores.

### Don't:
- **Don't** use blurred, coloured-glow or x-offset shadows; depth is a solid edge or nothing.
- **Don't** put kickers, eyebrows or small labels above a title.
- **Don't** set labels in uppercase or with wide letter-spacing.
- **Don't** draw progress as a winding path of round lesson bubbles; the track is a column of tiles.
- **Don't** use gradients on surfaces, buttons or text (the loading skeleton's grey shimmer is the only gradient).
- **Don't** mix two track colours on one screen outside the landing's track stack.
- **Don't** set text lighter than Stone (`muted`) on white or paper.
