# Migrations : état local et distant, et procédure d'application

Relevé fait en **lecture seule** sur le projet Supabase `gusgus` (région eu-west-3) le 17 octobre 2026. Depuis, aucune requête n'a été envoyée à la base distante, et rien n'a été appliqué.

Légende : **[V]** vérifié (relevé, requête ou test réellement exécuté) · **[H]** hypothèse, non vérifiée.

## 1. État relevé

| Version | Fichier local | Historique distant | Schéma distant |
|---|---|---|---|
| `20261004093428` init_gusgus | oui (renommé depuis `20261004000000`) | oui | appliqué |
| `20261004093453` lock_handle_new_user | oui (voir §1.1) | oui | appliqué |
| `20261004145345` lock_progress_writes | oui | oui | appliqué |
| `20261004145457` disable_client_write_policies | oui | oui | appliqué |
| `20261013210000` refonte_levels_prefs_notes | oui | **absente** | **appliquée** (colonnes `level10` et `preferences`, tables `notes` et `lesson_resume`, index `xp_events_checkpoint_once`) |
| `20261017000000` award_xp_replay_window | oui (nouvelle) | absente | **pas appliquée** : `award_xp` a toujours 6 arguments |

Conclusion **[V]** : la refonte a été appliquée sans passer par l'historique des migrations. Le schéma est correct, mais l'historique est incomplet et deux versions locales ne correspondaient pas. Un `supabase db push` aurait tenté de rejouer `init_gusgus` et échoué.

### 1.1 Le fichier `20261004093453_lock_handle_new_user.sql`

La base distante conserve le texte de cette migration. Seuls ses **60 premiers caractères** ont été lus : `revoke execute on function public.handle_new_user() from pub…`. Le dépôt contient déjà cette instruction (init et refonte). Le fichier la reproduit à l'identique ; la refaire ne change rien (idempotente). **[H]** : la fin de la ligne est la même que dans `init_gusgus` ; elle n'a pas été relue en entier.

### 1.2 Ce que la base distante a confirmé **[V]**

`award_xp` à 6 arguments, `security invoker`, `search_path` vide, exécutable seulement par `postgres` et `service_role`, sans objet dépendant. `xp_events` : `ref text` (nullable), `created_at timestamptz default now()`, contrainte `source in ('lesson','review','weekly','checkpoint')`, index uniques `xp_events_weekly_once` et `xp_events_checkpoint_once`. `supabase_migrations.schema_migrations` : colonnes `version` (obligatoire), `name`, `statements`, `created_by`, `idempotency_key`, `rollback` (facultatives). RLS actif sur les six tables.

## 2. Ce que fait la migration `20261017000000`

Remplace `award_xp` (6 arguments) par une version à 7 arguments dont le dernier, `p_replay_hours`, vaut 0 par défaut, et qui retourne en plus `paid` (XP réellement crédité). Avec `p_replay_hours > 0` et un montant positif, elle prend un verrou consultatif de transaction sur (utilisateur, source, ref) puis refuse (montant 0) si un événement payé existe déjà dans la fenêtre. Elle termine par `notify pgrst, 'reload schema'` pour que l'API voie la nouvelle signature.

### 2.1 Compatibilité : ce qui est vérifié, ce qui ne l'est pas

- **[V]** La signature supprimée correspond à la fonction distante ; les colonnes, types et contraintes utilisés existent ; les droits sont reproduits à l'identique ; aucun objet ne dépend de la fonction.
- **[V]** La syntaxe SQL et PL/pgSQL de la migration et des tests est acceptée par l'analyseur PostgreSQL (analyse statique, sans base).
- **[V]** Le **nouveau code** échoue si la migration manque : il envoie toujours `p_replay_hours`.
- **[H] NON VÉRIFIÉ** : que l'**ancien code** continue de fonctionner après la migration. Il appelle `award_xp` avec 6 arguments nommés ; avec la valeur par défaut, PostgREST devrait résoudre l'appel vers la nouvelle fonction. Cela n'a jamais été exécuté.
  - Au niveau SQL, le test `supabase/tests/progress_lock.sql` appelle `award_xp` avec 6 arguments : il le confirme **seulement au niveau SQL**.
  - Au niveau API (PostgREST), la seule vérification honnête est l'étape K ci-dessous : valider un cours avec l'ancien code encore déployé.
- **[H]** Les deux requêtes simultanées sont sérialisées par le verrou (raisonnement sur le fonctionnement de PostgreSQL, non exécuté en vrai). Le test SQL ne peut pas simuler deux sessions.
- **[V]** Le code de progression (leçons, révisions, bonus, séries) est testé contre un **modèle en mémoire** de la base, y compris des requêtes simultanées (`src/lib/progressService.test.ts`). Ces tests prouvent la logique TypeScript, pas le SQL.

### 2.3 Deux protections qui ne dépendent pas de cette migration

La révision quotidienne et `lesson_progress` sont protégées **dans le code** (comparaison-et-échange sur l'état précédent), sans nouvelle migration : le correctif correspondant ne change aucune table.

## 3. Procédure (depuis le tableau de bord Supabase, onglet « SQL Editor »)

À faire seulement après la fusion et la vérification de la nouvelle landing. Une étape à la fois ; si un résultat n'est pas celui attendu, s'arrêter. Les blocs prêts à copier sont dans la page de procédure générée à partir de ces fichiers.

| Étape | Action | Écrit en base ? | Sauvegarde / intervention |
|---|---|---|---|
| A | État de départ et compteurs (lecture) | non | noter le résultat |
| B | Sauvegarder la définition actuelle de `award_xp` (lecture) | non | **obligatoire** : copier le texte dans une note |
| C | Export des données en JSON (lecture, option) | non | contient des données personnelles : à garder en privé |
| D | `supabase/tests/progress_lock.sql` **avant** la migration (référence) | non, transaction annulée | le test doit passer sur la base actuelle |
| E | Journal : déclarer la refonte | **oui** (table d'historique) | manuelle ; annulable par un `delete` |
| F | Appliquer la migration, entourée de `begin; … commit;` | **oui** (remplace une fonction) | manuelle ; annulation = étape Z |
| G | Vérifier la fonction (lecture) | non | comparer avec le résultat attendu |
| H | `supabase/tests/award_xp_replay.sql` | non, transaction annulée | |
| I | `supabase/tests/progress_lock.sql` **après** la migration | non, transaction annulée | couvre l'appel à 6 arguments, au niveau SQL |
| J | Vérifier l'absence de traces (lecture) | non | compteurs identiques à A |
| K | Valider un cours avec le **compte de test**, ancien code encore déployé | **oui** (données de test) | seule vérification de l'ancien code au niveau API |
| L | Journal : déclarer la migration | **oui** (table d'historique) | seulement si tout ce qui précède est bon |
| Z | Annulation | **oui** | seulement avec un retour au déploiement Vercel précédent |

### 3.1 Les tests « annulés » ne laissent rien de persistant : ce qui est vérifié et ce qui ne l'est pas

- **[V]** Les deux scripts commencent par `begin;` et finissent par `rollback;`. Les utilisateurs, profils, événements et verrous qu'ils créent sont annulés avec la transaction. Les changements de rôle et de configuration sont locaux à la transaction (`set local`, `set_config(..., true)`).
- **[V]** Si un test échoue, une exception interrompt la transaction : elle ne peut plus être validée.
- **Non annulé par nature** : la numérotation automatique de `xp_events.id` avance (trous dans les identifiants). Sans conséquence.
- **[H]** L'éditeur SQL exécute le script sur une seule connexion. Si ce n'était pas le cas, `begin` et `rollback` pourraient ne pas s'appliquer ensemble. D'où l'étape J, qui le contrôle : aucun utilisateur `@replay.test` ou `@lock.test` ne doit subsister et les compteurs doivent être ceux de l'étape A.

### 3.2 Requêtes de contrôle

Étape A (compteurs, à comparer avec l'étape J) :

```sql
select (select count(*) from auth.users) as utilisateurs,
       (select count(*) from public.profiles) as profils,
       (select count(*) from public.xp_events) as evenements_xp,
       (select count(*) from public.lesson_progress) as progressions,
       (select count(*) from public.review_items) as revisions;
```

Étape J (absence de traces des tests) :

```sql
select count(*) as utilisateurs_de_test_restants
  from auth.users
 where email like '%@replay.test' or email like '%@lock.test';
```

Étapes E et L (journal : équivalent de `supabase migration repair --status applied`) :

```sql
insert into supabase_migrations.schema_migrations (version, name)
select v.version, v.name
  from (values ('20261013210000', 'refonte_levels_prefs_notes')) as v(version, name)
 where not exists (select 1 from supabase_migrations.schema_migrations s where s.version = v.version);
```

(pour L, remplacer par `('20261017000000', 'award_xp_replay_window')`). **[H]** L'insertion suppose que le rôle de l'éditeur a le droit d'écrire dans cette table ; sinon, utiliser `supabase migration repair --status applied <version>` depuis un ordinateur.

### 3.3 Étape K : la vérification de l'ancien code

Avec le déploiement **actuel** encore en ligne (pas le nouveau code), valider un cours avec un compte de test et vérifier que les points augmentent. Si l'enregistrement échoue, exécuter l'étape Z tout de suite. Cette étape crée des données dans le compte de test : c'est voulu.

### 3.4 Étape Z : annulation

Recrée l'ancienne fonction à partir du texte sauvegardé à l'étape B (à préférer) ou de `20261004145345_lock_progress_writes.sql`. À n'utiliser qu'avec un retour au déploiement précédent : le nouveau code a besoin de la version à 7 arguments.

## 4. Risques et limites

- La migration remplace une fonction : pendant la transaction (quelques millisecondes), un appel simultané peut attendre ou, très rarement, échouer. Choisir un moment calme (la base compte 2 profils au 17 octobre 2026).
- Aucune sauvegarde automatique n'est garantie : sa disponibilité dépend de l'offre Supabase **[H]**. L'étape B (définition) suffit à revenir en arrière sur la fonction ; l'étape C exporte les données.
- Le test de simultanéité réelle (deux sessions) n'est pas automatisable depuis l'éditeur. À défaut, la sécurité repose sur le verrou consultatif (raisonnement) et sur les tests du modèle.
- `supabase/tests/award_xp_replay.sql` et la migration ont été **analysés statiquement** mais jamais exécutés.

## Strictness of `20261017000000`

The migration asserts, before dropping, that exactly one `award_xp` exists and that it is the 6-argument one. Applied twice, or on a database whose function differs from the repository, it fails with an explicit message and (inside `begin; … commit;`) leaves everything unchanged. Run it only inside the explicit transaction of procedure block F.
