# Gusgus — Way of Learning AI

Apprendre l'IA en cours de 5 minutes : 3 parcours (Bird débutant, Gecko étudiant, Fox travail), quiz avec correction, XP, révisions espacées et révision hebdomadaire.

**Stack** : Next.js 16 · TypeScript · Tailwind 4 · Supabase (auth, Postgres + RLS).

## Lancer

```bash
npm install
cp .env.example .env.local   # déjà rempli pour le projet Supabase « gusgus »
npm run dev                  # http://localhost:3000
```

## Vérifier

```bash
npm test               # logique (notation, XP, répétition espacée, placement) + intégrité du contenu
npm run build && npm start
npm run test:e2e       # parcours complets desktop + mobile (serveur lancé sur :3000)
npm run content:check  # infos outils à revérifier (aussi chaque lundi en CI)
```

Les tests e2e utilisent le compte `e2e@gusgus.test` / `gusgus-e2e-2026`.

## Où modifier

- **Cours et quiz** : `src/content/lessons/*.ts` · parcours : `src/content/index.ts`
- **Infos sur ChatGPT, Claude, Gemini, DeepSeek, Perplexity** : `src/content/tools.ts` (seul endroit, avec `lastVerified`)
- **Schéma de base** : `supabase/migrations/`
- **Design system** : `DESIGN.md` et `src/app/globals.css`

## À savoir

- Supabase exige la confirmation par email. Le service d'email par défaut est très limité : pour tester des inscriptions, désactive « Confirm email » (Authentication → Sign In / Providers → Email) ou branche un SMTP.
- L'XP est calculée côté serveur, mais un utilisateur malin peut modifier sa propre ligne `profiles` via l'API (RLS par utilisateur). Acceptable pour un MVP ; à verrouiller avant un classement public.
