# Gusgus v2 : design et plan

Demande du 29/10/2026 (en français, très détaillée). L'utilisateur a demandé une exécution autonome :
pas de questions en cours de route. Toutes les décisions ci-dessous sont donc les miennes, prises
pour coller à ses objectifs : **simple, clair, épuré, proche de Duolingo**.

## Intention

- L'attention sur téléphone est courte : moins de texte, plus d'interactions, une seule chose à faire par écran.
- Les trois parcours (Bird/Découvrir, Gecko/Pratiquer, Fox/Construire) deviennent **trois parcours
  indépendants** : chaque cours appartient à un seul parcours, l'apprenant ne voit que le sien.
- Le test de niveau devient **un test par parcours**, aligné sur ses chapitres : il valide des chapitres
  précis, et l'écran de résultat ne se contredit plus.
- Accueil connecté = chemin de cours vertical style Duolingo, avec une vue d'ensemble des chapitres.
- Les cours Bird et début Gecko deviennent très courts et interactifs ; Fox garde sa profondeur
  mais en pages plus courtes.

## Anti-objectifs

- Pas de jargon IA ni de remarques « en cours de développement » dans le site (seul un badge « bêta »).
- Pas de nouvelles fonctionnalités Duolingo absentes du produit (gemmes, ligues, vies).
- Pas de migration de base obligatoire avant déploiement (voir Données).
- Pas de branches dans le chemin : un chemin linéaire, des chapitres qui s'enchaînent.

## Structure du contenu

`Track.chapters: Chapter[]` remplace `nodes/units/col/lane`.
`Chapter = { id, name, blurb (≤ 60 car.), lessons: string[], project?: boolean }`.
Chaque chapitre non-projet a un **bilan facultatif** (coffre) en fin de chapitre (id = id du chapitre).
`Lesson.track` est déduit de la structure ; un cours n'apparaît que dans un parcours (testé).
`Lesson.prerequisites` disparaît : l'ordre du chemin fait foi.

Répartition (34 cours existants + 13 nouveaux = 47, soit +38 %) :

| Parcours | Chapitres | Cours |
|---|---|---|
| Bird · Découvrir | 6 (b1…b5 + b6 projet) | 15 (11 réécrits légers + 4 nouveaux) |
| Gecko · Pratiquer | 6 (g1…g5 + g6 projet) | 15 (9 raccourcis + 6 nouveaux) |
| Fox · Construire | 7 (f1…f6 + f7 projet) | 17 (14 repaginés + 3 nouveaux) |

Les identifiants des cours existants sont conservés (les progressions déjà enregistrées restent valides).

### Gabarits stricts par parcours (vérifiés par `content.test.ts`)

| | Bird | Gecko | Fox |
|---|---|---|---|
| Durée | 3 à 5 min | 4 à 8 min | 8 à 15 min (projet jusqu'à 40) |
| Parties | 4 à 6 | 5 à 8 | 6 à 12 |
| Prose par partie | ≤ 1 paragraphe (≤ 45 mots) | ≤ 2 (≤ 60 mots chacun) | ≤ 3 (≤ 90 mots chacun) |
| Interaction | ≥ 1 par partie (sauf 1) | ≥ 1 toutes les 2 parties | libre |
| Quiz final | 4 questions | 5 | 6 à 8 |
| Écriture libre | interdite | ≤ 3 mots attendus jusqu'à mi-Gecko, toujours « Passer » | toujours « Passer » |

Une « question à trous écrite » avec un bouton **Passer la question** (compte comme non réussie, sans boucle de rattrapage).

Nouveau type de question **`sort`** (ranger des cartes dans deux paniers) : très Duolingo, pour Bird.

## Test de niveau (par parcours)

1. « Qu'est-ce que tu veux faire avec l'IA ? » → choisit le test : Comprendre → Bird, Pratiquer → Gecko, Construire → Fox.
2. 10 questions, **ordre fixe**, non adaptatif, avec flèches précédent/suivant (réponses modifiables jusqu'à la fin) :
   - questions communes à tous (5 pour Bird et Gecko, 4 pour Fox) tirées d'un petit pool, dont en **3e position**
     la question originale « deux réponses différentes » (deux bulles d'IA + barres de probabilité, réponse en un tap) ;
   - puis une question par chapitre non-projet du parcours (5 Bird, 5 Gecko, 6 Fox), dans l'ordre des chapitres.
3. Résultat :
   - score /10 = bonnes réponses ; une question de chapitre réussie **valide ce chapitre** ;
   - point de départ = premier chapitre non validé, affiché en clair (« Tu commences au chapitre 3 : Écrire et résumer ») ;
   - tout validé et ≥ 9/10 (hors Fox) → proposer le test du parcours suivant ;
   - ≤ 3/10 (hors Bird) → proposer le test du parcours précédent ;
   - changer de parcours reste possible mais affiche un avertissement : le test portait sur X, rien n'est validé ailleurs, « Revenir à X ».
4. Le serveur re-note toujours (inscription et test refait connecté).

## Données (aucune migration requise)

- Résultat stocké par parcours : `preferences.placements[track] = { score, chapters, at }`, écrit par le serveur
  uniquement (admin client). `savePreferences` conserve les placements existants et ignore ceux envoyés par le client.
- À l'inscription : le résultat re-noté va dans `onboarding.placement` (colonne existante, copiée par le trigger).
- Lecture : `placements = { ...onboarding.placement, ...preferences.placements }`.
- `level10` = dernier score, conservé pour compatibilité.

## Progression

- Un cours est ouvert si le cours précédent du chemin est connu (terminé, ou chapitre validé par le test).
  Le premier cours d'un chapitre s'ouvre quand tous les cours du chapitre précédent sont connus.
- Mode « libre » (réglage) : tout le parcours est ouvert.
- Les cours d'un autre parcours sont en accès libre depuis le catalogue (ils ne bloquent rien et ne sont bloqués par rien).
- Bilan de chapitre : facultatif, ouvert quand tous les cours du chapitre sont connus, bonus XP une fois.

## Écrans

- **Landing** : flèches précédent/suivant dans le test ; étape 2 de « Comment ça marche » = vrai extrait de cours simple,
  mots-clés en gras, mini question ; étape 3 avec une touche manuscrite et un surlignage ; plan = trois parcours séparés,
  chacun avec sa mascotte, ses chapitres et ses cours en pastilles aux couleurs des thèmes ; légende plus petite.
- **Accueil (chemin)** : barre du haut (mascotte du parcours = bouton de changement de parcours, série, XP, objectif du jour) ;
  bandeau de chapitre collant à la couleur du parcours, avec bouton liste → vue des chapitres ; chemin vertical en zigzag,
  pastilles rondes à bord pressé (étoile, coffre pour le bilan, drapeau pour le projet), « Commencer » au-dessus
  de l'étape en cours, mascotte à côté du chemin ; clic → bulle courte (titre, durée, XP, une ligne, badge test vert/rouge
  avec infobulle, bouton).
- **Vue des chapitres** : cartes de chapitres de haut en bas, reliées ; jauge sur chaque ; chapitre en cours avec la mascotte
  et une bulle ; chapitres verrouillés grisés avec la condition en une ligne ; en bas, aperçu du parcours suivant seulement.
- **Changer de parcours** : feuille ouverte depuis la mascotte en haut à gauche, avertissement doux, progression conservée.
- **Cours (catalogue)** : inspiré de l'onglet Entraînement : carte héro (prochaine étape ou révision), lignes « Thèmes »
  avec icônes rondes, page de thème avec 3 à 5 cours, filtre durée discret dans un coin ; section mini-jeu (bêta).
- **Révisions** : textes courts, illustration de la mascotte.
- **Cours** : intro conservée, mascotte plus grande et redessinée ; pages courtes ; mascotte animée sur bonne/mauvaise réponse
  et en fin de cours ; « Passer » sur les questions écrites et les exercices.
- **Mini-jeu bêta « L'atelier du prompt »** : composer un prompt avec des cartes, l'aperçu de réponse change en direct,
  étoiles selon la qualité.
- **Réglages** : mode guidé/libre, durée de séance, objectif quotidien (XP), sons, animations de la mascotte, taille du texte.

## Approches considérées

1. **Garder les cours partagés entre parcours et filtrer l'affichage** : moins de contenu à écrire, mais le test et la
   progression resteraient incohérents (cours validés « en double », parcours mêlés). Rejeté : c'est le problème signalé.
2. **Parcours séparés, cours existants répartis sans doublon, nouveaux cours pour combler** (retenu) : un seul
   propriétaire par cours, identifiants conservés, test aligné sur les chapitres.
3. **Dupliquer chaque cours de base en trois versions** : cohérent mais triple la maintenance. Rejeté.

## Ordre d'exécution

1. Modèle de contenu (types, curriculum, logique de chemin, tests).
2. Placement par parcours (logique, stockage, actions serveur, inscription).
3. Mascottes redessinées + animations.
4. Landing (test, comment ça marche, plan).
5. Accueil chemin + vue des chapitres + changement de parcours.
6. Catalogue des cours + révisions + navigation.
7. Lecteur de cours et quiz (Passer, type `sort`, animations).
8. Contenu : Bird (15), Gecko (15), Fox (17), avec les gabarits testés.
9. Mini-jeu bêta, réglages.
10. Audit complet (tests, lint, typecheck, build, e2e, captures desktop + mobile), DESIGN.md, compte rendu.
