# Étape 2 — Sécurité, CSP et socle légal

> 18 novembre 2026. Ce document décrit ce qui est en place, comment le vérifier, comment passer à l'étape suivante, et ce qui reste humain. Il est écrit pour être lu par un humain **et** par Claude au début du prochain chantier.

---

## 0. Ce qui est livré

| Chantier | État | Fichiers |
|---|---|---|
| CSP en Report-Only, nonce par requête | En place, aucun blocage | `src/proxy.ts`, `next.config.ts` |
| Collecteur de rapports CSP | En place | `src/app/api/csp-report/route.ts` |
| Rate limiting connexion / inscription / mot de passe oublié | En place | `src/lib/rateLimit.ts`, `src/app/auth/actions.ts` |
| Pages légales (mentions, confidentialité, cookies) | Écrites, **non publiées** tant que l'identité manque | `src/app/mentions-legales`, `src/app/confidentialite`, `src/app/cookies`, `src/lib/legal.ts` |
| 404 soignée et compatible nonce | En place | `src/app/not-found.tsx` |
| Socle fiscal | Documenté, rien à coder avant la première vente | ce document, §5 |

**Vérifié :** `typecheck`, `lint`, **307 tests**, `next build`. En local sur le build de production : en-tête `Content-Security-Policy-Report-Only` présent sur les pages **et** sur les redirections, 14 à 16 scripts portant le nonce, rapport CSP accepté en `204`, 404 rendue dynamiquement.

---

## 1. La CSP, en Report-Only

### La politique servie

```
default-src 'self';
script-src 'self' 'nonce-…' 'strict-dynamic';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://<ref>.supabase.co;
font-src 'self' data:;
connect-src 'self' https://<ref>.supabase.co wss://<ref>.supabase.co;
object-src 'none'; base-uri 'self'; form-action 'self';
frame-ancestors 'none'; frame-src 'none'; manifest-src 'self';
upgrade-insecure-requests;
report-to csp; report-uri /api/csp-report
```

### Pourquoi chaque directive

| Directive | Ce qu'elle ferme |
|---|---|
| `script-src` + nonce + `strict-dynamic` | Un script injecté ne s'exécute pas, même s'il vient du domaine |
| `object-src 'none'` | Les plugins Flash/PDF embarqués, vecteurs d'exécution |
| `base-uri 'self'` | Le détournement de `<base>` pour rediriger tous les liens relatifs |
| `form-action 'self'` | L'exfiltration d'un formulaire vers un domaine tiers |
| `frame-ancestors 'none'` | Le clickjacking (doublon de `X-Frame-Options`) |
| `connect-src` limité | Un script compromis ne peut pas envoyer les données ailleurs qu'à Supabase |
| `frame-src 'none'` | Aucune iframe tierce |
| `upgrade-insecure-requests` | Une ressource http:// oubliée passe en https |

`style-src` garde `'unsafe-inline'` : Next injecte des styles en ligne (polices, mise en page). C'est le seul assouplissement, et il ne concerne pas l'exécution de code. Le resserrer demanderait des hachages, à faire seulement si un audit le justifie.

### Pourquoi Report-Only

Le navigateur **signale** les violations au lieu de bloquer. Une erreur de politique ne peut donc pas casser une page en production. C'est la seule façon sérieuse de déployer une CSP sur un site vivant.

### Où vont les rapports

`POST /api/csp-report` (204, corps limité à 16 Ko, 120 rapports/minute par IP). Chaque rapport devient une ligne dans les logs Render :

```
[csp] directive=script-src blocked=inline page=https://duolinguo-ia.onrender.com/login
```

La query string est retirée avant écriture : un jeton ne peut pas fuiter dans les logs. Rien n'est stocké en base.

### Ce que le nonce impose

Un nonce change à chaque requête : une page **statique** ne peut pas le porter. Les routes HTML qui étaient prérendues sont donc passées en rendu dynamique (`/login`, `/signup`, `/login/forgot`, les trois pages légales, la 404). La page d'accueil l'était déjà. Restent statiques : `/dev/preview` (bac à sable de design), `robots.txt`, `sitemap.xml`, l'image Open Graph — aucun n'exécute de script.

C'est un coût assumé : quelques millisecondes de rendu par page, en échange d'une politique qui correspond réellement à ce qui est servi.

### Passer en enforcement

1. Laisser tourner **deux semaines** en Report-Only, avec au moins quelques dizaines de visites réelles.
2. Chercher `[csp]` dans les logs Render et corriger toute violation inattendue.
3. Dans `src/proxy.ts`, remplacer la ligne qui pose `Content-Security-Policy-Report-Only` par `Content-Security-Policy`. Garder `report-uri` : les violations continueront d'arriver.
4. Déployer, puis ouvrir les huit parcours critiques (accueil, onboarding, inscription, connexion, reset, parcours, leçon, révisions) et vérifier la console.
5. En cas de page cassée, remettre `-Report-Only` : le retour arrière est une ligne.
6. Une fois stable, retirer `'unsafe-eval'` du mode dev n'a aucun effet en production ; ne pas y toucher.

### Faux positifs attendus

- **Extensions de navigateur** : elles injectent des scripts que la CSP ne connaît pas. Elles apparaissent dans les rapports avec `blocked-uri` en `chrome-extension://`. À ignorer.
- **`report-uri` est déprécié** au profit de `report-to`, mais reste le seul compris par Safari. Les deux sont envoyés.
- **Pages en cache** : un rapport peut arriver avec une URL ancienne. Sans gravité.

---

## 2. Le rate limiting

| Action | Limite | Fenêtre | Clé |
|---|---:|---|---|
| Connexion | 10 **échecs** | 10 minutes | IP |
| Inscription | 5 | 1 heure | IP |
| Mot de passe oublié | 5 | 15 minutes | IP |
| Rapports CSP | 120 | 1 minute | IP |

En développement, les limites sont multipliées par 20 : tout le monde partage `localhost`, sinon l'auteur se bloquerait lui-même en testant.

**Seuls les échecs comptent pour la connexion.** Une adresse partagée (école, bureau, foyer) peut enchaîner autant de connexions réussies qu'elle veut : le compteur ne bouge que sur un mot de passe refusé, et une panne réseau ne le fait pas bouger non plus. Un succès ne remet pas le compteur à zéro non plus, sinon il suffirait d'un compte valide pour réinitialiser la fenêtre.

**Pourquoi par IP seulement.** Un compteur par compte permettrait à n'importe qui de bloquer le compte d'un autre en envoyant des tentatives (déni de service). L'IP est le bon grain : elle arrête le bourrage d'identifiants sans donner de levier sur un compte précis. Supabase applique déjà ses propres limites côté serveur.

**Message rendu :** « Trop de tentatives de connexion. Réessaie dans 3 minutes. » Le nombre de minutes est calculé depuis la fenêtre restante.

**Limites connues, à assumer :**
- Les compteurs vivent en mémoire : ils repartent à zéro à chaque déploiement.
- Ils sont par instance. Render tourne aujourd'hui avec **une** instance ; le jour où le service scale, il faudra un stockage partagé (Upstash, Redis) avant de compter dessus.
- Derrière un proxy, `x-forwarded-for` est fourni par Render. On ne l'utilise que pour throttler, jamais pour identifier quelqu'un.

**Tests :** `src/lib/rateLimit.test.ts` couvre la fenêtre, le refus, la réouverture, l'isolation des clés, l'extraction d'IP et le pluriel des messages.

---

## 3. Le socle légal

### Ce qui existe

- `src/lib/legal.ts` : **la seule source de vérité**. Identité de l'éditeur, hébergeur, sous-traitant, CNIL.
- Trois pages rédigées : `/mentions-legales`, `/confidentialite`, `/cookies`.
- `legalReady` : tant que les six champs obligatoires sont vides, les liens de pied de page sont masqués, les pages ne sont pas dans le sitemap et portent `noindex`. Une page légale à moitié remplie ne doit jamais être publique.

### Ce qu'il faut remplir (obligations LCEN, art. 1-1)

| Champ | Obligation |
|---|---|
| `name` | Nom et prénom + « EI », ou dénomination sociale |
| `status` | « Entrepreneur individuel » ou forme sociale + capital |
| `address` | Domicile ou siège social |
| `email` | Contact effectif (art. 19 LCEN) |
| `phone` | Numéro non surtaxé |
| `publicationDirector` | Toi, ou le représentant légal |
| `registration` | RNE / RCS + SIREN, si immatriculé |
| `vat` | Numéro de TVA, seulement si assujetti |

Dès que ces champs sont remplis, les liens apparaissent dans le pied de page de l'accueil, sous les formulaires de connexion, et dans le sitemap. Aucun autre code à toucher.

### Hébergeur et sous-traitant

- **Render Services, Inc.**, 525 Brannan Street, Suite 300, San Francisco, CA 94107, États-Unis — héberge l'application. DPA : `render.com/dpa`.
- **Supabase Pte. Ltd.**, 970 Toa Payoh North #07-04, Singapour 318992 — héberge la base et l'authentification, région **eu-west-3 (Paris)**. DPA : `supabase.com/legal/dpa`.

Les deux DPA doivent être acceptés/signés depuis les dashboards respectifs. C'est une action humaine, sans effet sur le code.

### Registre des traitements (à recopier dans un tableur)

| Traitement | Données | Base | Durée | Destinataires |
|---|---|---|---|---|
| Compte et apprentissage | email, prénom, progression, XP, révisions, notes | contrat | vie du compte | Supabase, Render |
| Emails transactionnels | email | contrat | temps de l'envoi | Supabase |
| Sécurité | IP, journaux | intérêt légitime | temps de l'analyse | Render |
| Mesure d'audience | aucune aujourd'hui | — | — | — |

---

## 4. Les cookies

### L'état réel

Un seul cookie : `sb-<ref>-auth-token.0` et `.1` (la session est découpée en deux). Durée : **400 jours**, renouvelée à chaque connexion (valeur par défaut de `@supabase/ssr`, vérifiée dans le paquet installé). Aucun cookie d'audience, de publicité ou de réseau social, aucun script tiers.

### La position, et pourquoi elle tient

L'article 82 de la loi Informatique et Libertés dispense de consentement les traceurs **strictement nécessaires** au service demandé. Un cookie de session qui sert uniquement à ne pas retaper son mot de passe à chaque page en fait partie. La CNIL cite explicitement l'authentification et la limitation des tentatives de connexion.

**Donc : pas de bandeau aujourd'hui.** En ajouter un serait du bruit, et un bandeau qui ne sert à rien est un mauvais signal.

### Quand un bandeau deviendra obligatoire

Dès qu'un outil de mesure d'audience, un pixel publicitaire, une vidéo intégrée ou un bouton de partage social est ajouté. Deux voies seulement :

1. **Consentement** : bandeau avec refus aussi simple que l'accord, choix conservé 6 mois maximum, possibilité de changer d'avis.
2. **Exemption CNIL** : outil utilisé pour le seul compte de l'éditeur, statistiques anonymes, pas de suivi inter-sites, IP tronquée, cookie ≤ 13 mois, données ≤ 25 mois, information et droit d'opposition.

Tant que ces conditions ne sont pas réunies, le bandeau est obligatoire. Ce choix se tranche **avant** d'installer l'outil, pas après.

---

## 5. Le fiscal — le début

### Aujourd'hui

Aucune vente, aucun paiement, aucune facture. Il n'y a donc rien à collecter ni à déclarer au titre du site. Mais la structure doit être prête avant la première vente.

### Le statut

Deux options réalistes :

- **Entreprise individuelle / micro-entreprise** : simple, plafonds de chiffre d'affaires, pas de capital, responsabilité personnelle. Adapté à un lancement.
- **SASU** : séparation patrimoniale, image plus « entreprise », comptabilité plus lourde, coût de création plus élevé.

Tant que le statut n'est pas choisi, aucune mention légale définitive n'est possible : c'est le premier champ à remplir dans `legal.ts`.

### Les seuils 2026 (à jour, vérifiés)

| Sujet | Seuil | Conséquence |
|---|---:|---|
| Micro-entreprise, prestations de services | 83 600 € | Au-delà, sortie du régime micro |
| Micro-entreprise, vente de biens | 203 100 € | idem |
| Franchise en base de TVA, services | 37 500 € (N-1) | Pas de TVA facturée |
| Franchise en base de TVA, seuil majoré | 41 250 € (année en cours) | TVA due dès le dépassement |
| Franchise en base de TVA, biens | 85 000 € / 93 500 € | — |

Le projet de seuil unique à 25 000 € a été **abandonné** (loi du 3 novembre 2025). Les seuils ci-dessus restent ceux de 2026.

Sous la franchise, les factures portent la mention **« TVA non applicable, art. 293 B du CGI »**.

### Ce qu'une facture devra contenir

Numéro séquentiel, date d'émission, identités et adresses complètes du vendeur et de l'acheteur, désignation précise de la prestation, quantité, prix unitaire, total HT, TVA (ou la mention d'exonération), total TTC, conditions et date de règlement, pénalités de retard. À conserver dix ans.

### Vendre des cours en ligne à des particuliers

- **Conditions générales de vente** obligatoires, accessibles avant l'achat.
- **Droit de rétractation de 14 jours.** Exception possible pour un contenu numérique fourni immédiatement, si l'acheteur a donné son accord exprès et renoncé à ce droit (art. L221-28, 13° du code de la consommation). La case doit être explicite, pas pré-cochée.
- **Prix TTC** affiché.
- **Médiateur de la consommation** : obligatoire pour tout professionnel vendant à des particuliers, avec ses coordonnées sur le site.
- **TVA européenne** : au-delà de 10 000 € de ventes B2C vers d'autres pays de l'UE, guichet OSS.

### Échéances à surveiller

- **Facturation électronique** : réception obligatoire pour toutes les entreprises en septembre 2026, émission progressive en 2027. À anticiper avec un logiciel compatible.
- **Comptable** : prévoir un rendez-vous avant la première vente, pas après.

### Les questions à poser à un comptable

1. EI ou SASU pour ce projet, compte tenu du niveau de revenus visé ?
2. Franchise en base ou option TVA dès le départ ?
3. Comment déclarer des ventes de contenus numériques à des particuliers hors France ?
4. Quel logiciel de facturation conforme à la réforme 2026-2027 ?
5. Quelles mentions exactes sur les factures de cours en ligne ?

> Ce document prépare le terrain, il ne remplace pas un professionnel. Les seuils changent chaque année : les revérifier avant toute décision.

---

## 6. Ce que Claude fait ensuite

Dans cet ordre, avec un critère d'acceptation à chaque fois.

1. **Relire et habiller les trois pages légales.** Une fois `legal.ts` rempli, vérifier la langue, la hiérarchie, la lisibilité mobile, et que rien ne promet plus que ce que le produit fait. Fichiers : `src/app/mentions-legales`, `src/app/confidentialite`, `src/app/cookies`, `src/components/LegalPage.tsx`. *Fini quand :* les trois pages passent en 320 px, sans jargon, et `legalReady` est vrai.
2. **Décider de la mesure d'audience et, si elle est retenue, poser le consentement.** Choisir un outil sobre, écrire le bandeau, stocker le choix, bloquer le script avant accord. *Fini quand :* aucun script d'audience ne part avant un choix explicite, et le refus est aussi facile que l'accord.
3. **Passer la CSP en enforcement.** Suivre la procédure du §1. *Fini quand :* deux semaines de rapports propres, puis zéro erreur console sur les huit parcours.
4. **Resserrer `style-src` si possible.** Remplacer `'unsafe-inline'` par des hachages ou un nonce sur les styles générés. *Fini quand :* aucune régression visuelle, et la directive n'a plus d'exception.
5. **Soigner l'expérience du throttle.** Le message est brut : ajouter un compte à rebours, désactiver le bouton pendant l'attente, ne pas perdre la saisie. Fichiers : `LoginForm.tsx`, `SignupForm.tsx`, `ForgotForm.tsx`. *Fini quand :* un utilisateur bloqué comprend quoi faire sans recharger.
6. **Écrire les CGV et le parcours d'achat** le jour où une vente est décidée, avec la case de renoncement au délai de rétractation. *Fini quand :* la case n'est pas pré-cochée et les CGV sont accessibles avant paiement.
7. **Vérifier la performance après le passage en dynamique.** Mesurer le TTFB et le LCP des routes sorties du statique. *Fini quand :* les budgets du plan mobile sont tenus, ou l'écart est expliqué.

---

## 7. Ce que l'humain doit faire

- [ ] Choisir le statut (EI/micro ou SASU) et immatriculer si ce n'est pas fait.
- [ ] Remplir les six champs obligatoires de `src/lib/legal.ts`.
- [ ] Créer l'adresse de contact (aujourd'hui inexistante) et la mettre dans `legal.ts`.
- [ ] Signer les DPA Render et Supabase depuis leurs dashboards.
- [ ] Ouvrir un registre des traitements avec le tableau du §3.
- [ ] Prendre rendez-vous avec un comptable avant la première vente.
- [ ] Décider de la mesure d'audience (et du budget associé).
- [ ] Relire les trois pages légales avec un œil juridique.
- [ ] Configurer un SMTP dédié (le lien de reset reste limité à 2 emails/heure sans lui).

---

## 8. Vérifications faites le 18 novembre

| Quoi | Résultat |
|---|---|
| `npm run typecheck` | 0 erreur |
| `npm run lint` | 0 erreur |
| `npx vitest run` | 307 passés, 8 ignorés |
| `npm run build` | succès, 26 routes |
| En-tête CSP sur `/login` | `content-security-policy-report-only` présent, nonce inclus |
| Nonces dans le HTML | 14 sur `/login`, 16 sur `/`, 0 sur la 404 avant correction, dynamique depuis |
| En-tête sur une redirection (`/learn`) | CSP présente sur le `307` |
| `POST /api/csp-report` | `204`, ligne `[csp]` écrite avec l'URL nettoyée |
| `GET /api/csp-report` | `405` |
| Pages légales | 16 marqueurs « à compléter », `noindex`, hors sitemap, liens masqués |

Le throttle est déclenché pour de vrai depuis l'action serveur dans `src/app/auth/actions.test.ts` : dix échecs bloquent sans rappeler Supabase, cinq succès ne consomment pas le quota, 25 succès ne bloquent jamais, et quinze pannes réseau ne comptent pas.

Non testé : le comportement des rapports CSP dans un vrai navigateur sur plusieurs jours.

---

## 9. Limites connues

- Compteurs de rate limit en mémoire, remis à zéro à chaque déploiement, par instance.
- Pas de CAPTCHA : le throttle suffit pour un lancement, pas pour une attaque distribuée.
- `style-src` garde `'unsafe-inline'`.
- `report-uri` est déprécié mais nécessaire pour Safari.
- Les pages légales sont invisibles tant que `legalReady` est faux — c'est voulu.
- Le site n'a toujours pas de SMTP dédié : la réinitialisation reste plafonnée par Supabase.
- Aucune mesure d'audience : on ne sait toujours pas où les gens décrochent.

---

## 10. Sources

- Next.js, CSP et nonces : https://nextjs.org/docs/app/guides/content-security-policy
- CNIL, cookies et mesure d'audience : https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience
- CNIL, informer les personnes : https://www.cnil.fr/fr/informer-les-personnes
- Service Public, mentions obligatoires d'un site : https://entreprendre.service-public.gouv.fr/vosdroits/F37351
- Service Public, franchise en base de TVA (2026) : https://entreprendre.service-public.gouv.fr/vosdroits/F23566
- economie.gouv.fr, seuils de TVA : https://www.economie.gouv.fr/entreprises/gerer-sa-fiscalite-et-ses-impots/autres-impots-et-taxes/entreprises-pouvez-vous-beneficier-de-la-franchise-de-tva
- Render, DPA : https://render.com/dpa
- Supabase, DPA : https://supabase.com/legal/dpa
