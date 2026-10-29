---
id: 5
title: "Unlayered component CSS silently beats Tailwind v4 responsive utilities (max-md:hidden never hides)"
status: open
type: internal
skill: [impeccable]
proposes_skill: []
target_file: []
siblings_checked: "family: frontend design skills; members: impeccable (craft-floor Verify), frontend-design (assumed)"
area: verifying responsive behaviour of a Tailwind v4 project that also ships plain CSS files
date: 2026-10-29
session_context: "Gusgus v2 audit: src/app/landing.css `.landing .plan-col { display: grid }` vs `max-md:hidden`"
commands_verified: "run: playwright at 390px, `.plan-col:visible` count 3 before fix, 1 after (data attribute + media query in the same unlayered sheet)"
---
Tailwind v4 emits utilities inside `@layer utilities`; any unlayered rule wins regardless of specificity.
A component class that sets `display`, `padding` or `width` therefore cancels `max-md:hidden`, `px-0`,
`sm:w-auto` placed next to it. Unit tests and lint pass; only a screenshot at the breakpoint shows it.
Same session: a `.btn` link with `px-0 lg:hidden` kept its padding. Worth one line in a craft/verify
checklist: "after mixing custom classes with responsive utilities, count visible elements at each breakpoint".
