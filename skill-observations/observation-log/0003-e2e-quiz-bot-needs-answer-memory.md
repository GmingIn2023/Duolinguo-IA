---
id: 3
title: Generic quiz-solving e2e helpers loop forever on retry-until-correct quizzes unless they read the shown correction
status: open
type: internal
skill: [test-driven-development]
proposes_skill: []
target_file: [e2e/helpers.ts]
siblings_checked: none
area: e2e testing of learning loops
date: 2026-10-04
session_context: Gusgus MVP core-loop test
commands_verified: "run: npx playwright test -g 'core loop' → 2 passed after the fix"
---
The quiz re-queues wrong answers until correct. A helper that answers blindly never passes ordering questions.
Fix: read "Bonne réponse" from the correction sheet and apply it on retry; key memory by full question content
(several questions share the heading "Complète la phrase.").
