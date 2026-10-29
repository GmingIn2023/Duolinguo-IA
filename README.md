# Gusgus — Way of Learning AI

Apprendre l'IA : 47 cours sourcés sur 10 thèmes, 3 parcours séparés en chapitres (Découvrir, Pratiquer, Construire), un test de niveau par parcours, un mini-jeu en bêta (L'atelier du prompt), des quiz à 10 types de questions, des révisions qui reviennent sous une autre forme, un carnet de notes.

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
npm run test:e2e       # parcours complets desktop + mobile (serveur lancé sur :3000, ou BASE_URL=…)
E2E_SWEEP=1 BASE_URL=http://localhost:3000 npx playwright test content-sweep --project=desktop
                       # avec `npm run dev` : joue chaque question des 47 cours dans la vraie interface
npm run content:check  # infos outils à revérifier (aussi chaque lundi en CI)
```

Tests de base de données (droits, `award_xp`, fenêtre anti-rejeu) : exécuter `supabase/tests/progress_lock.sql`, `award_xp_replay.sql` puis `complete_lesson.sql` dans l'éditeur SQL Supabase (transactions annulées, aucune donnée modifiée). État des migrations et marche à suivre : `supabase/MIGRATIONS.md`.

Les tests connectés demandent un compte de test confirmé, passé par l'environnement : `E2E_EMAIL=… E2E_PASSWORD=… npm run test:e2e` (sinon ils sont ignorés). Ne jamais commiter ces identifiants.

## Où modifier

- **Cours et quiz** : `src/content/lessons/*.ts` · parcours, chapitres et thèmes : `src/content/curriculum.ts` · mini-jeu : `src/content/atelier.ts`
- **Aperçu de développement** (404 en production) : `/dev/preview?view=gallery` (les 17 blocs et 10 types de questions), `?view=lesson&id=…`, `?view=quiz&type=…`
- **Infos sur ChatGPT, Claude, Gemini, DeepSeek, Perplexity** : `src/content/tools.ts` (seul endroit, avec `lastVerified`)
- **Schéma de base** : `supabase/migrations/`
- **Design system** : `DESIGN.md` et `src/app/globals.css`

## À savoir

- Supabase exige la confirmation par email. Le service d'email par défaut est très limité : pour tester des inscriptions, désactive « Confirm email » (Authentication → Sign In / Providers → Email) ou branche un SMTP.
- **XP et progression sont verrouillées** : les utilisateurs n'ont qu'un accès en lecture à `xp_events`, `lesson_progress`, `review_items` et aux colonnes XP/série de `profiles` (seuls nom et parcours sont modifiables). Le serveur écrit avec `SUPABASE_SECRET_KEY` (`src/lib/supabase/admin.ts`, server-only) et crédite l'XP via les fonctions atomiques `award_xp` et `complete_lesson` (XP + progression d'un cours dans une seule transaction). Sans cette variable, rien n'est enregistré. À définir aussi dans Vercel (variable serveur, jamais `NEXT_PUBLIC_`).

## Variables d'environnement

| Variable | Où | Valeur |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | navigateur + serveur | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | navigateur + serveur | clé publique (`sb_publishable_…`) |
| `SUPABASE_SECRET_KEY` | serveur uniquement | clé secrète (`sb_secret_…`), jamais `NEXT_PUBLIC_` |
| `SITE_URL` (optionnel) | serveur | URL publique du site, pour le lien de confirmation d'inscription |

La migration `supabase/migrations/20261013210000_refonte_levels_prefs_notes.sql` (additive, réexécutable) doit être appliquée **avant** de déployer cette version.
Les migrations `20261017000000_award_xp_replay_window.sql` puis `20261018000000_complete_lesson.sql` (dans cet ordre) sont à appliquer avant de déployer. Tests sur une base locale isolée : `supabase/local-test/README.md`. La première (nouvelle signature de `award_xp`, avec la fenêtre anti-rejeu) doit elle aussi être appliquée **avant** de déployer : l'ancienne fonction à 6 arguments est remplacée par une version à 7 arguments (le dernier, `p_replay_hours`, a une valeur par défaut), et le nouveau code échoue si la migration manque. Que l'ancien code continue de fonctionner après elle **n'est pas vérifié** : voir `supabase/MIGRATIONS.md`. Le code de progression (`src/lib/progressService.ts`) dépend aussi de la contrainte « une seule ligne par utilisateur et par cours / notion » de `lesson_progress` et `review_items` (clés primaires de la migration d'init).
