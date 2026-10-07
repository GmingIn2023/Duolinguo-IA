# Gusgus — Way of Learning AI

## Product
A web/mobile learning platform that teaches people to understand and use AI through short, progressive lessons and quizzes (Duolingo-like loop, premium execution). French-language content.

## Users and jobs
- **Bird — complete beginners**: understand what AI is, stop being intimidated, use it safely.
- **Gecko — high-school / university students**: use AI to learn (not to cheat), check sources, revise.
- **Fox — AI for work**: write effective work prompts, protect confidential data, review AI output critically.

Core loop: onboarding questions → level estimate → suggested track (changeable) → track map → lesson → quiz with error correction → XP → saved progress → spaced-repetition reviews (daily due items + ~10-minute weekly review of the week's lessons).

## Mechanism / position
Concepts first, tools second. Lessons teach durable mental models (next-token prediction, hallucinations, prompting, privacy) before tool-specific lessons (ChatGPT, Claude, Gemini, DeepSeek, Perplexity). Tool facts live in one versioned file with `lastVerified` dates so they can be re-checked weekly.

## Constraints
- Content must be pedagogically sound, not padded. Volatile tool facts are isolated and dated.
- Desktop first for iteration 1, excellent mobile adaptation required.
- Light theme primarily.

## Platform
web (responsive, mobile web).

## Stack
Next.js 16 (App Router) + TypeScript + Tailwind 4 + Supabase (auth, Postgres, RLS). Decided by the build lead per brief ("idéalement Next.js + TypeScript + Tailwind + Supabase").

## Brand commitments (from the brief)
- Name: "Gusgus — Way of Learning AI".
- Mascot families per track: Bird (beginner), Gecko (student), Fox (work). Simple for MVP.
- White / black / very clean greys; colour only where it does a job. Strong typography, large compositions, crafted cards, generous space, sober but memorable motion.
- Not a generic SaaS UI.

## Assumptions (inferred, not confirmed)
- Audience is French-speaking (brief written in French).
- No payments or social features in the MVP.
