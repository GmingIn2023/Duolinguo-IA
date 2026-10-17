# Migrations : état local et distant

Relevé en lecture seule du projet Supabase `gusgus` (région eu-west-3), le 17 octobre 2026. Rien n'a été appliqué ni modifié sur la base.

## Ce qui a été constaté

| Version | Fichier local | Historique distant | Schéma distant |
|---|---|---|---|
| `20261004093428` init_gusgus | oui (renommé depuis `20261004000000`) | oui | appliqué |
| `20261004093453` lock_handle_new_user | oui (fichier vide, voir son en-tête) | oui | `handle_new_user` est la version de la refonte |
| `20261004145345` lock_progress_writes | oui | oui | appliqué |
| `20261004145457` disable_client_write_policies | oui | oui | appliqué |
| `20261013210000` refonte_levels_prefs_notes | oui | **absente** | **appliquée** (colonnes `level10` et `preferences`, tables `notes` et `lesson_resume`, index `xp_events_checkpoint_once`) |
| `20261017000000` award_xp_replay_window | oui (nouvelle) | absente | **pas appliquée** : `award_xp` a toujours 6 arguments |

Conclusion : la refonte a été appliquée sur la base sans passer par l'historique des migrations (probablement depuis l'éditeur SQL). Le schéma est correct, mais l'historique est incomplet, et deux versions locales ne correspondaient pas aux versions distantes. Un `supabase db push` aurait tenté de rejouer `init_gusgus` et échoué.

## À faire par toi (je n'ai rien exécuté)

1. Déclarer la refonte comme déjà appliquée, sans la rejouer :
   ```bash
   supabase migration repair --status applied 20261013210000
   ```
2. Vérifier que les historiques concordent (aucune ligne « Local seulement » ni « Remote seulement » ne doit rester, sauf `20261017000000`) :
   ```bash
   supabase migration list
   ```
3. Appliquer la nouvelle migration **avant** de déployer le code qui passe `p_replay_hours` :
   ```bash
   supabase db push
   ```
   Elle supprime l'ancienne fonction `award_xp` à 6 arguments et crée celle à 7 arguments (le dernier a une valeur par défaut). Le code déployé avant la migration échouerait sur l'appel.
4. Lancer les deux tests SQL dans l'éditeur SQL (chacun s'annule en fin de transaction) : `supabase/tests/progress_lock.sql` puis `supabase/tests/award_xp_replay.sql`.

## Limites

- Le test `award_xp_replay.sql` vérifie les règles en séquence. Deux requêtes simultanées ne peuvent pas être simulées dans une seule session : le verrou `pg_advisory_xact_lock` est conçu pour les faire attendre l'une l'autre, mais ce point doit être vu à la main (deux sessions) ou par un test de charge.
- La migration et son test SQL n'ont pas pu être exécutés ici (pas de Postgres local, et la base distante n'a pas été modifiée).
