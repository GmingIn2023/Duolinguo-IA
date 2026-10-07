# Gusgus — Way of Learning AI

Apprendre l'IA en cours de 5 minutes : 3 parcours (Bird débutant, Gecko étudiant, Fox travail), quiz avec correction, XP, révisions espacées et révision hebdomadaire.

**Stack** : Next.js 16 · TypeScript · Tailwind 4 · Supabase (auth, Postgres + RLS).

## Lancer

```bash
npm install
cp .env.example .env.local   # URL + clé publique déjà remplies ; ajoute SUPABASE_SECRET_KEY
npm run dev                  # http://localhost:3000
```

## Vérifier

```bash
npm test               # logique (notation, XP, répétition espacée, placement) + intégrité du contenu
npm run build && npm start
npm run test:e2e       # parcours complets desktop + mobile (serveur lancé sur :3000)
npm run content:check  # infos outils à revérifier (aussi chaque lundi en CI)
```

Test de sécurité base de données (droits, `award_xp`) : exécuter `supabase/tests/progress_lock.sql` dans l'éditeur SQL Supabase (transaction annulée, aucune donnée modifiée).

Les tests connectés demandent un compte de test confirmé, passé par l'environnement : `E2E_EMAIL=… E2E_PASSWORD=… npm run test:e2e` (sinon ils sont ignorés). Ne jamais commiter ces identifiants.

## Où modifier

- **Cours et quiz** : `src/content/lessons/*.ts` · parcours : `src/content/index.ts`
- **Infos sur ChatGPT, Claude, Gemini, DeepSeek, Perplexity** : `src/content/tools.ts` (seul endroit, avec `lastVerified`)
- **Schéma de base** : `supabase/migrations/`
- **Design system** : `DESIGN.md` et `src/app/globals.css`

## À savoir

- Supabase exige la confirmation par email. Le service d'email par défaut est très limité : pour tester des inscriptions, désactive « Confirm email » (Authentication → Sign In / Providers → Email) ou branche un SMTP.
- **XP et progression sont verrouillées** : les utilisateurs n'ont qu'un accès en lecture à `xp_events`, `lesson_progress`, `review_items` et aux colonnes XP/série de `profiles` (seuls nom et parcours sont modifiables). Le serveur écrit avec `SUPABASE_SECRET_KEY` (`src/lib/supabase/admin.ts`, server-only) et crédite l'XP via la fonction atomique `award_xp`. Sans cette variable, rien n'est enregistré. À définir aussi dans Vercel (variable serveur, jamais `NEXT_PUBLIC_`).
