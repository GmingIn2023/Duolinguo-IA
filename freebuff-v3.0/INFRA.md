# Infrastructure state

Checked live during this work. Secrets are named, never printed.

## Supabase

| Item | Value |
|------|-------|
| Project ref | `yskiozjbvjzcneylwcji` |
| Name | `gusgus` |
| Region | `eu-west-3` |
| URL | `https://yskiozjbvjzcneylwcji.supabase.co` |
| Status | `ACTIVE_HEALTHY` |
| Auth health | 200 with the publishable key |
| Migrations | 7 applied |

### Earlier outage, resolved

An earlier round of this work concluded the auth host was gone (NXDOMAIN, failed grants). That was
wrong, or at least transient: the project now resolves, answers, and returns a proper
`400 invalid_credentials` for a bad password instead of a transport failure. **Do not repeat the
"auth is dead" conclusion.** What did come out of it is real: `proxy.ts` now survives an auth
outage instead of 500-ing the landing page (change C2).

### Schema

- `award_xp` exists with its 7-argument signature.
- `complete_lesson` exists.
- Public tables: `profiles`, `lesson_progress`, `lesson_resume`, `notes`, `review_items`,
  `xp_events`.
- Row counts: **0 in every table.** There are no real accounts yet, which is why no end-to-end
  auth test could be run.

Writes go through the admin client and are always scoped to the signed-in user's id; learners can
only read their own rows. That design predates this work and was not changed.

## Render

| Item | Value |
|------|-------|
| URL | `https://duolinguo-ia.onrender.com` |
| Service id | `srv-dbcfhh9kjs5s73a7s0ag` |
| Owner | `tea-dbc5nut9fdbs73bvdal0` |
| Live commit | `3e80cba` |
| Latest deploy | `dep-dbhtclm0tbcc73ahg71g` |

Environment variables present (values not read): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SITE_URL`.

`SITE_URL` matters for the new SEO routes: `metadataBase`, `robots.ts` and `sitemap.ts` all prefer
it over the hard-coded Render fallback. If it is set to the Render URL, canonical and sitemap URLs
will be correct there.

## Known drift: `render.yaml` does not describe the live service

The blueprint in the repo says:

- build: `npm ci --include=dev`
- health check path: `/login`

The live service actually runs:

- build: `npm install; npm run build`
- **no health check**

`render.yaml` was left untouched. Editing the file does not change a service that was created
outside the blueprint, and doing it properly needs dashboard access (or a Render API token) plus a
decision about restart behaviour. It is listed in `REMAINING.md` rather than half-fixed.

## Domain

No DNS or domain change was made. `Gusgus.ia` exists only as a wordmark, a metadata string and an
`aria-label`. The site is still served from `duolinguo-ia.onrender.com`.
