# Gusgus — Way of Learning AI

## Product
A web learning platform (responsive, mobile web) that teaches people to understand and use AI through short lessons, quizzes that explain mistakes, and spaced reviews. Duolingo-like loop, premium execution. French-language content. Live at https://duolinguo-ia.onrender.com.

## Users and jobs
Three separate tracks; a learner follows one at a time and only sees their own path.
- **Découvrir (Bird) — complete beginners**: understand what AI is, stop being intimidated, use it safely. Lessons of 3–5 min, one paragraph per screen, no writing exercises.
- **Pratiquer (Gecko) — studies and work**: learn with AI (not cheat with it), write and summarise, check and protect, organise and automate. Lessons of 4–8 min.
- **Construire (Fox) — technical**: tokens and models, evaluation, APIs, agents and MCP, RAG, coding with AI, an end-to-end document assistant project. Lessons of 8–15 min.

Source of truth for tracks and chapters: `src/content/curriculum.ts`. 47 lessons; each belongs to exactly one chapter of one track, and each track ends with a project.

## Core loop
Goal question → 10-question placement test on that track (3–4 common questions + one per chapter) → result with validated chapters and a starting chapter (or a suggestion to take the next / previous track's test) → Duolingo-style path, top to bottom, one chapter at a time → lesson (intro, short screens with small checks, summary) → quiz with explanations → XP, streak, daily goal → spaced reviews (daily due items, weekly review). Switching track goes through the mascot switcher, with a warning.

Beta: « L'atelier du prompt », a mini-game where the learner builds a request from cards and sees the likely answer change. Marked only with a small « bêta » badge.

## Mechanism / position
Concepts first, tools second. Durable mental models (next-token prediction, hallucinations, prompting, privacy, evaluation) before tool-specific advice. Volatile tool facts live in one dated file (`src/content/tools.ts`, re-checked weekly with `npm run content:check`).

## Constraints
- Content must be accurate, sourced and short; key notions in bold, human tone, no AI disclaimers in the product.
- Strict lesson format per track, enforced by `src/content/content.test.ts`.
- Mobile as good as desktop. Light theme.
- XP and progress are written only by the server (secret key); learners can read, not write, their progress.

## Platform and stack
Web. Next.js 16 (App Router) + TypeScript + Tailwind 4 + Supabase (auth, Postgres, RLS). Hosted on Render (free plan, auto-deploy from `main`).

## Brand
- Name: "Gusgus — Way of Learning AI". Visual system in `DESIGN.md` ("The Tile Table": pressed-edge tiles, Archivo display + Geist).
- One mascot per track (bird, gecko, fox) that reacts to right/wrong answers and celebrates the end of a lesson.
- Not a generic SaaS UI.

## Non-goals (for now)
Payments, social features, AI-generated feedback in production.
