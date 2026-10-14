import type { Lesson } from "../types";

export const devLessons: Lesson[] = [
  {
    id: "coder-avec-ia",
    title: "Coder avec un assistant IA",
    objective: "Faire écrire une fonction à un assistant en lui donnant le contexte et une spécification testable, avancer par petites modifications relues, et repérer les risques propres au code généré.",
    theme: "dev",
    difficulty: 3,
    format: "atelier",
    durationMin: 15,
    xp: 50,
    skills: [
      "Donner à l'assistant le contexte et les conventions d'un projet",
      "Spécifier un comportement par des exemples et des cas limites avant de générer",
      "Avancer par petites modifications en lisant chaque diff",
      "Repérer code plausible mais faux, dépendances inventées et fuites de secrets",
    ],
    prerequisites: ["prompts-avances"],
    sections: [
      {
        id: "familles",
        title: "Trois familles d'outils",
        blocks: [
          {
            type: "text",
            body: "Tu écris une petite application de suivi du temps. Les utilisateurs saisissent des durées à la main : « 1h30 », « 45min », « 2h ». Il te faut une fonction qui convertit ces textes en minutes. Tu peux la demander à un assistant de trois manières très différentes, et le choix change ce que tu dois surveiller.",
          },
          {
            type: "table",
            headers: ["Famille", "Comment elle travaille", "Ce qu'elle voit", "Ce que tu contrôles"],
            rows: [
              ["Complétion dans l'éditeur", "Propose la suite pendant que tu tapes : une ligne, un bloc", "Le fichier ouvert et un peu de son voisinage", "Chaque suggestion, acceptée ou refusée une par une"],
              ["Chat", "Tu poses une question ou colles du code, il répond ; tu copies ce qui te convient", "Uniquement ce que tu lui donnes", "Tout : rien n'entre dans ton projet sans ton geste"],
              ["Agent de code", "Lit le dépôt, modifie plusieurs fichiers, lance des commandes (tests, installation), observe le résultat et recommence", "Le projet entier, selon les accès accordés", "Le but, les permissions, puis la relecture du diff final"],
            ],
            caption: "Des catégories, pas des produits : les outils changent vite et beaucoup combinent plusieurs familles.",
          },
          {
            type: "spectrum",
            title: "Qui tient le clavier ?",
            poles: ["Toi", "L'assistant"],
            items: [
              { label: "Complétion", position: 20, detail: "Tu écris, il finit tes phrases. L'erreur typique : accepter par réflexe une suggestion qui a l'air juste." },
              { label: "Chat", position: 50, detail: "Il écrit des blocs entiers, tu les intègres. L'erreur typique : coller sans avoir donné le contexte du projet." },
              { label: "Agent de code", position: 85, detail: "Il écrit, exécute et corrige. L'erreur typique : valider un gros changement sans l'avoir lu." },
            ],
            caption: "Plus tu délègues, plus ta relecture doit être organisée.",
          },
          {
            type: "keypoint",
            body: "Quelle que soit la famille, une règle ne change pas : le code qui entre dans ton projet est le tien. Tu en réponds, qu'il ait été tapé par toi ou généré.",
          },
        ],
      },
      {
        id: "contexte-spec",
        title: "Donner le contexte, spécifier avant de générer",
        blocks: [
          {
            type: "text",
            body: "Tu connais déjà les prompts structurés : un rôle, un contexte, une tâche, un format. Pour du code, le contexte prend une forme précise, et une pièce s'ajoute : **la spécification**, c'est-à-dire la description du comportement attendu, assez précise pour qu'on puisse dire si le code est bon ou non.",
          },
          {
            type: "compare",
            title: "Deux demandes pour la même fonction",
            columns: ["Vague", "Spécifiée"],
            rows: [
              { label: "La demande", a: "« Écris une fonction qui convertit une durée en minutes. »", b: "Langage, signature, formats acceptés, formats refusés, comportement en cas d'erreur, conventions du projet" },
              { label: "Ce que l'assistant doit deviner", a: "Le langage, les formats, que faire de « 1h75 », d'une chaîne vide, d'un nombre négatif", b: "Presque rien" },
              { label: "Ce que tu peux vérifier", a: "Seulement que « ça a l'air de marcher »", b: "Chaque exemple, un par un" },
            ],
          },
          {
            type: "anatomy",
            title: "Le prompt complet",
            segments: [
              { text: "Projet Python 3.12, sans dépendance externe. Module `durees.py`. ", label: "contexte technique", detail: "Version du langage et contrainte sur les dépendances : sans elle, l'assistant peut proposer une bibliothèque que tu ne veux pas, ou qui n'existe pas." },
              { text: "Conventions : annotations de type, noms en français, erreurs signalées par `ValueError`. ", label: "conventions", detail: "Ce qui distingue du code correct de du code qui s'intègre à ton projet." },
              { text: "Écris `duree_en_minutes(texte: str) -> int`. ", label: "signature", detail: "Nom, paramètres, type de retour : la surface exacte attendue." },
              { text: "Valides : « 1h30 » donne 90, « 2h » donne 120, « 45min » donne 45, « 90min » donne 90. Espaces autour et majuscules tolérés. ", label: "comportement attendu", detail: "Des exemples concrets entrée et sortie valent mieux qu'une description." },
              { text: "Invalides, à refuser par `ValueError` : chaîne vide, « abc », « -5min », « 1h75 » (après des heures, les minutes vont de 0 à 59), « 1h30min ». ", label: "cas limites", detail: "C'est ici que se joue la qualité. Les cas limites que tu n'écris pas seront tranchés au hasard." },
              { text: "Donne d'abord les tests pytest, puis la fonction. N'ajoute rien d'autre.", label: "format et ordre", detail: "Demander les tests en premier oblige à fixer le comportement avant d'écrire le code." },
            ],
            caption: "Touche chaque partie. Écrire cette spécification t'a obligé à décider toi-même ce que vaut « 1h75 » : c'est la partie du travail qui ne se délègue pas.",
          },
          {
            type: "code",
            lang: "python",
            code: `import pytest

from durees import duree_en_minutes


@pytest.mark.parametrize("texte, attendu", [
    ("1h30", 90),
    ("2h", 120),
    ("45min", 45),
    ("90min", 90),
    (" 1H30 ", 90),
])
def test_durees_valides(texte, attendu):
    assert duree_en_minutes(texte) == attendu


@pytest.mark.parametrize("texte", ["", "abc", "-5min", "1h75", "1h30min"])
def test_durees_invalides(texte):
    with pytest.raises(ValueError):
        duree_en_minutes(texte)`,
            caption: "La spécification, traduite en tests. Relis-les ligne par ligne : ce sont eux qui diront si le code est juste.",
          },
          {
            type: "mistake",
            title: "Faire écrire les tests après le code, par le même assistant, sans les lire",
            why: "L'assistant écrit alors des tests qui décrivent ce que son code fait, erreurs comprises. Si la fonction accepte « 1h75 », le test généré vérifiera fièrement que « 1h75 » donne 135.",
            fix: "Les tests découlent de ta spécification, pas du code. Écris ou valide les cas attendus avant, et vérifie que chaque cas limite de ta liste a bien son test.",
          },
          {
            type: "check",
            question: {
              id: "coder-avec-ia:c1",
              type: "multi",
              concept: "specification",
              prompt: "Quels éléments manquent à cette demande : « Fais-moi une fonction JavaScript qui valide une adresse e-mail » ?",
              options: [
                { id: "a", text: "Des exemples d'adresses à accepter et à refuser" },
                { id: "b", text: "Ce que la fonction renvoie ou lève en cas d'adresse invalide" },
                { id: "c", text: "Le contexte : où elle sera utilisée, avec quelles conventions et dépendances" },
                { id: "d", text: "Le langage", feedback: "Il est donné : JavaScript." },
              ],
              answer: ["a", "b", "c"],
              explanation: "Sans exemples, sans comportement d'erreur et sans contexte, l'assistant choisit à ta place, et tu n'as rien pour vérifier son choix.",
            },
          },
        ],
      },
      {
        id: "petits-pas",
        title: "Petits pas : une modification, un diff",
        blocks: [
          {
            type: "text",
            body: "L'assistant renvoie la fonction ci-dessous. Elle est courte, lisible, et elle a l'air juste. Avant de te fier à cette impression, lance les tests.",
          },
          {
            type: "code",
            lang: "python",
            code: `import re


def duree_en_minutes(texte: str) -> int:
    """Convertit '1h30', '2h' ou '45min' en nombre de minutes."""
    m = re.fullmatch(r"(?:(\\d+)h(\\d{1,2})?|(\\d+)min)", texte.strip().lower())
    if m is None:
        raise ValueError(f"Durée illisible : {texte!r}")
    if m.group(3) is not None:
        return int(m.group(3))
    return int(m.group(1)) * 60 + int(m.group(2) or 0)`,
            caption: "Première version générée. Neuf tests passent sur dix.",
          },
          {
            type: "text",
            title: "Le test qui échoue",
            body: "`duree_en_minutes(\"1h75\")` renvoie 135 au lieu de lever une erreur. Le code est plausible : accepter deux chiffres après le « h » semble raisonnable. Il est pourtant faux au regard de ta spécification, et seul le test que tu avais prévu le révèle. Sans lui, « 1h75 » serait parti en production.",
          },
          {
            type: "steps",
            title: "La discipline des petits pas",
            items: [
              { title: "Une modification à la fois", body: "Demande la correction de ce cas précis, pas « améliore la fonction ». Un changement, une raison." },
              { title: "Lis le diff", body: "Regarde ce qui a été retiré et ajouté, ligne par ligne. Si l'assistant a touché autre chose que ce que tu demandais, tu dois savoir pourquoi." },
              { title: "Relance tous les tests", body: "Pas seulement celui qui échouait : une correction peut casser un cas qui marchait." },
              { title: "Enregistre l'état qui marche", body: "Un commit par étape validée. Si la suite dérape, tu reviens en arrière en une commande." },
            ],
          },
          {
            type: "code",
            lang: "diff",
            code: `     if m.group(3) is not None:
         return int(m.group(3))
-    return int(m.group(1)) * 60 + int(m.group(2) or 0)
+    minutes = int(m.group(2) or 0)
+    if minutes >= 60:
+        raise ValueError(f"Minutes invalides dans {texte!r}")
+    return int(m.group(1)) * 60 + minutes`,
            caption: "Le diff de la correction : quatre lignes, un seul sujet. Il se lit en vingt secondes, et les dix tests passent.",
          },
          {
            type: "mistake",
            title: "Demander dix changements d'un coup et valider en bloc",
            why: "Un diff de 400 lignes sur douze fichiers ne se relit pas vraiment : on survole, on fait confiance, et le défaut passe. C'est encore plus vrai avec un agent de code, qui peut produire ce volume en une minute.",
            fix: "Découpe la demande comme tu découperais ton propre travail. Si un diff est trop gros pour être lu attentivement, c'est la demande qui était trop grosse : annule et redemande en plus petit.",
          },
          {
            type: "check",
            question: {
              id: "coder-avec-ia:c2",
              type: "ordering",
              concept: "petits-pas",
              prompt: "Remets dans l'ordre un cycle de travail sain avec un assistant de code.",
              items: [
                { id: "a", text: "Écrire le comportement attendu et les cas limites" },
                { id: "b", text: "Faire générer une modification ciblée" },
                { id: "c", text: "Lire le diff" },
                { id: "d", text: "Lancer tous les tests" },
                { id: "e", text: "Enregistrer l'état validé (commit)" },
              ],
              answer: ["a", "b", "c", "d", "e"],
              explanation: "Spécifier, générer petit, lire, tester, enregistrer. Chaque tour laisse le projet dans un état connu.",
            },
          },
        ],
      },
      {
        id: "comprendre",
        title: "Ce que tu dois comprendre toi-même",
        blocks: [
          {
            type: "text",
            body: "L'assistant peut écrire plus vite que toi. Il ne peut pas répondre du code à ta place, ni savoir ce que ton projet doit faire. Trois choses restent de ton côté.",
          },
          {
            type: "table",
            headers: ["Tu dois comprendre", "Pourquoi", "Comment t'en assurer"],
            rows: [
              ["Ce que le code doit faire", "C'est toi qui connais le besoin ; l'assistant ne voit que ta demande", "Tu sais écrire les exemples entrée et sortie sans aide"],
              ["Ce que fait chaque ligne retenue", "Tu devras la modifier et la déboguer plus tard, peut-être sans assistant", "Tu peux l'expliquer à voix haute, ligne par ligne"],
              ["Ce que le code touche", "Fichiers, réseau, base de données, argent : c'est là que sont les dégâts possibles", "Tu sais lister les effets de bord de la fonction"],
            ],
          },
          {
            type: "dialogue",
            label: "Se faire expliquer plutôt que valider à l'aveugle",
            turns: [
              { who: "user", text: "Explique-moi l'expression régulière de la fonction, morceau par morceau. Puis donne-moi deux entrées qu'elle accepte et auxquelles je n'ai peut-être pas pensé." },
              { who: "ai", text: "Elle décrit deux formes possibles. La première : un ou plusieurs chiffres, la lettre h, puis éventuellement un ou deux chiffres (les minutes). La seconde : un ou plusieurs chiffres suivis de « min ». `fullmatch` exige que tout le texte corresponde. Deux entrées acceptées auxquelles penser : « 0h » qui donne 0, et « 1h5 » qui donne 65 minutes et non 1 h 50." },
            ],
            note: "L'explication fait apparaître deux décisions que tu n'avais pas prises : une durée nulle est-elle valide ? « 1h5 » doit-il être accepté ? À toi de trancher, puis d'ajouter les tests correspondants.",
          },
          {
            type: "keypoint",
            body: "Critère simple : n'intègre pas une ligne que tu ne saurais pas expliquer. Quand tu ne comprends pas, demande l'explication, pas une nouvelle version.",
          },
        ],
      },
      {
        id: "risques",
        title: "Les risques propres au code généré",
        blocks: [
          {
            type: "table",
            headers: ["Risque", "À quoi ça ressemble", "Parade"],
            rows: [
              ["Code plausible mais faux", "Il s'exécute, passe les cas évidents et se trompe sur un cas limite (« 1h75 »)", "Tests écrits à partir de la spécification, cas limites compris"],
              ["Fonction ou option inventée", "Un appel à une méthode qui n'existe pas dans la version que tu utilises", "Exécuter le code ; consulter la documentation officielle de la bibliothèque"],
              ["Dépendance inventée", "Une commande d'installation pour un paquet au nom crédible, qui n'existe pas", "Vérifier le paquet sur le registre officiel avant toute installation"],
              ["Faille de sécurité", "Requête construite par concaténation, entrée non validée, droits trop larges", "Relecture ciblée sécurité ; outils d'analyse ; ne jamais supposer que « généré » veut dire « sûr »"],
              ["Secret dans le prompt", "Tu colles un fichier de configuration avec une clé d'API ou un mot de passe", "Retirer ou remplacer les secrets avant de coller ; les garder hors du code"],
            ],
          },
          {
            type: "definition",
            term: "Slopsquatting",
            body: "Attaque qui exploite les dépendances inventées par les modèles : quelqu'un enregistre sur un registre public un paquet portant un nom que les assistants ont tendance à halluciner, et y place du code malveillant. Le développeur qui installe sans vérifier le nom suggéré exécute ce code. Le terme, apparu en 2025, est construit sur « typosquatting » (qui mise, lui, sur les fautes de frappe).",
          },
          {
            type: "steps",
            title: "Avant d'installer une dépendance suggérée",
            items: [
              { title: "Demande-toi si tu en as besoin", body: "Pour convertir « 1h30 » en minutes, la bibliothèque standard suffit. Chaque dépendance ajoutée est du code d'inconnus que tu exécutes." },
              { title: "Cherche le paquet toi-même", body: "Sur le registre officiel de ton langage, en tapant le nom : existe-t-il, depuis quand, qui le maintient, renvoie-t-il vers un dépôt de code cohérent ?" },
              { title: "Recoupe avec une source indépendante", body: "La documentation officielle du projet que tu veux utiliser donne le nom exact du paquet à installer. Un nom proche n'est pas le bon nom." },
              { title: "Ne laisse pas un agent installer sans accord", body: "L'installation de paquets fait partie des commandes qui méritent une confirmation humaine." },
            ],
          },
          {
            type: "mistake",
            title: "Coller le fichier de configuration entier pour « donner le contexte »",
            why: "Le contexte utile est la structure du fichier, pas ses valeurs. Une clé collée dans un prompt a quitté ta machine : elle se trouve chez un tiers, dans un historique de conversation, hors de ton contrôle.",
            fix: "Remplace les valeurs par des marqueurs (`CLE_API=xxxx`) avant de coller. Si un secret est déjà parti, considère-le comme compromis : révoque-le et génères-en un nouveau.",
          },
          {
            type: "exercise",
            title: "Spécifie, génère, vérifie",
            minutes: 6,
            prompt: "Tu as besoin d'une fonction `prix_ttc(prix_ht, taux)` qui renvoie le prix toutes taxes comprises arrondi au centime. 1) Sans assistant, écris cinq exemples entrée et sortie, dont au moins trois cas limites, et décide pour chacun ce qui doit se passer. 2) Rédige le prompt complet sur le modèle de l'anatomie vue plus haut, en demandant les tests d'abord. 3) Soumets-le à un assistant, lis le code, et cherche un cas de ta liste qu'il traite mal ou un cas que tu avais oublié.",
            hints: [
              "Cas limites à envisager : prix nul, prix négatif, taux supérieur à 1 (0,2 ou 20 ?), montants qui tombent pile sur un demi-centime.",
              "En Python comme en JavaScript, 0.1 + 0.2 ne vaut pas exactement 0.3 : demande-toi dans quel type tu veux manipuler de l'argent.",
            ],
            solution: "Des décisions défendables : `prix_ttc(100, 0.2)` vaut 120.00 ; `prix_ttc(0, 0.2)` vaut 0 ; un prix négatif lève une erreur (ou est accepté pour les avoirs, mais alors tu l'écris) ; un taux hors de l'intervalle 0 à 1 lève une erreur, ce qui évite la confusion entre 0,2 et 20 ; l'arrondi au demi-centime suit une règle que tu nommes explicitement. Le piège à trouver : beaucoup de versions générées utilisent des nombres flottants et la fonction d'arrondi par défaut. Or les flottants ne représentent pas exactement la plupart des décimaux, et en Python `round` arrondit les cas exactement médians vers le chiffre pair. Résultat : certains montants sont arrondis un centime en dessous de ce qu'attend ta comptabilité. Une version robuste calcule en décimaux exacts (le module `decimal` en Python, des centimes entiers en JavaScript) avec un mode d'arrondi choisi. Si ton prompt ne disait rien du type ni de la règle d'arrondi, l'assistant a tranché à ta place : c'est exactement le « plausible mais faux » de ce cours. Tu as réussi l'exercice si tu peux expliquer chaque ligne retenue et si chaque cas limite a son test.",
          },
        ],
      },
    ],
    summary: [
      "Complétion, chat, agent de code : trois degrés de délégation. Dans tous les cas, le code intégré est le tien.",
      "Donne le contexte (langage, version, dépendances, conventions) et une spécification : signature, exemples, cas limites, comportement en cas d'erreur.",
      "Fixe les tests à partir de la spécification, avant ou avec le code, et lis-les.",
      "Avance par petits pas : une modification, un diff relu, tous les tests, un commit.",
      "N'intègre pas une ligne que tu ne saurais pas expliquer.",
      "Méfie-toi du code plausible mais faux, des dépendances inventées (slopsquatting), des failles de sécurité et des secrets collés dans un prompt.",
    ],
    questions: [
      {
        id: "coder-avec-ia:q1",
        type: "match",
        concept: "familles-outils",
        prompt: "Associe chaque description à sa famille d'outils.",
        left: [
          { id: "l1", text: "Propose la fin de la ligne pendant que tu tapes" },
          { id: "l2", text: "Répond à une question sur un extrait que tu as collé" },
          { id: "l3", text: "Modifie plusieurs fichiers, lance les tests et corrige selon le résultat" },
        ],
        right: [
          { id: "r1", text: "Complétion dans l'éditeur" },
          { id: "r2", text: "Chat" },
          { id: "r3", text: "Agent de code" },
        ],
        answer: ["r1", "r2", "r3"],
        explanation: "Trois niveaux de délégation : finir tes phrases, écrire des blocs que tu intègres, agir directement sur le projet.",
      },
      {
        id: "coder-avec-ia:q2",
        type: "mcq",
        concept: "specification",
        prompt: "Quel élément d'une demande de code réduit le plus le risque d'obtenir du « plausible mais faux » ?",
        options: [
          { id: "a", text: "Des exemples entrée et sortie, cas limites compris" },
          { id: "b", text: "La formule « écris un code propre et sans bug »", feedback: "C'est une intention, pas un critère : elle ne dit pas ce que « juste » signifie ici." },
          { id: "c", text: "Une demande très courte, pour ne pas embrouiller l'assistant", feedback: "Moins tu précises, plus il devine." },
        ],
        answer: "a",
        explanation: "Les exemples fixent le comportement attendu et deviennent des tests : ils transforment une impression en vérification.",
      },
      {
        id: "coder-avec-ia:q3",
        type: "ai_analysis",
        concept: "risques-code",
        prompt: "Qu'est-ce qui doit t'alerter dans cette réponse ?",
        userMessage: "Comment lire un fichier Excel en Python et envoyer son contenu à mon API ? Voici ma config : API_URL=https://api.exemple.test, API_KEY=sk-prod-8f3a91c2e7…",
        aiResponse: "Installe d'abord le paquet avec `pip install excel-fast-reader-pro`, puis utilise ce code : `import excel_fast_reader as efr` … `requests.post(API_URL, headers={\"Authorization\": \"sk-prod-8f3a91c2e7…\"}, data=efr.load(\"fichier.xlsx\"))`. Ce code est prêt pour la production.",
        options: [
          { id: "a", text: "L'utilisateur a collé une clé d'API de production dans son message" },
          { id: "b", text: "Le paquet suggéré doit être vérifié sur le registre officiel avant toute installation" },
          { id: "c", text: "La clé est écrite en dur dans le code proposé" },
          { id: "d", text: "« Prêt pour la production » est affirmé sans aucun test ni gestion d'erreur" },
          { id: "e", text: "Python ne sait pas lire les fichiers Excel", feedback: "Des bibliothèques réelles le font très bien. Le problème est de vérifier que celle proposée existe." },
        ],
        answer: ["a", "b", "c", "d"],
        explanation: "Quatre risques du cours réunis : secret dans le prompt, dépendance peut-être inventée, secret dans le code, assurance sans vérification.",
      },
      {
        id: "coder-avec-ia:q4",
        type: "fill_choice",
        concept: "slopsquatting",
        prompt: "Complète la phrase.",
        sentence: "Le slopsquatting consiste à publier un paquet malveillant sous un nom ___.",
        options: [
          { id: "a", text: "que les assistants IA ont tendance à inventer" },
          { id: "b", text: "identique à celui d'un paquet très connu" },
          { id: "c", text: "choisi complètement au hasard" },
        ],
        answer: "a",
        explanation: "L'attaquant mise sur les noms hallucinés par les modèles. Vérifier l'existence et l'origine d'un paquet avant de l'installer suffit à déjouer le piège.",
      },
      {
        id: "coder-avec-ia:q5",
        type: "true_false",
        concept: "tests",
        statement: "Si l'assistant écrit lui-même les tests après avoir écrit le code et qu'ils passent tous, le code est conforme à ton besoin.",
        answer: false,
        explanation: "Ces tests décrivent ce que le code fait, pas ce qu'il devrait faire. Seuls des cas attendus fixés à partir de ta spécification prouvent quelque chose.",
      },
      {
        id: "coder-avec-ia:q6",
        type: "mcq",
        concept: "petits-pas",
        prompt: "Un agent de code te présente un diff de 600 lignes réparties sur quinze fichiers pour « ajouter l'export CSV et nettoyer un peu ». Que fais-tu ?",
        options: [
          { id: "a", text: "Tu refuses et tu redemandes l'export seul, sans le « nettoyage »" },
          { id: "b", text: "Tu acceptes si les tests passent", feedback: "Les tests ne couvrent pas tout, et tu intégrerais 600 lignes que personne n'a lues." },
          { id: "c", text: "Tu parcours rapidement les noms de fichiers puis tu valides", feedback: "Survoler n'est pas relire : c'est ainsi que les défauts passent." },
        ],
        answer: "a",
        explanation: "Un diff trop gros pour être lu signale une demande trop grosse. Un changement, une raison, un diff lisible.",
      },
      {
        id: "coder-avec-ia:q7",
        type: "written",
        concept: "comprendre-son-code",
        prompt: "Un camarade te dit : « Je ne comprends pas ce que fait cette fonction générée, mais elle marche, donc je la garde. » Réponds-lui en deux phrases.",
        placeholder: "Le problème, c'est que…",
        criteria: [
          { id: "responsable", label: "Il devra la maintenir, la déboguer ou en répondre", anyOf: ["maint", "débog", "debog", "debug", "modifi", "corrig", "responsab", "répond", "repond", "plus tard", "évoluer", "evoluer"] },
          { id: "marche", label: "« Elle marche » ne prouve pas qu'elle est juste partout", anyOf: ["cas limite", "cas particulier", "plausible", "pas testé", "pas teste", "test", "faille", "sécurité", "securite", "bug", "faux", "erreur"] },
          { id: "expliquer", label: "Se la faire expliquer avant de l'intégrer", anyOf: ["expliqu", "comprend", "ligne par ligne", "relire", "relis"] },
        ],
        minCriteria: 2,
        modelAnswer: "Le problème, c'est qu'elle marche sur les cas que tu as essayés, pas forcément sur les cas limites, et que tu ne pourras ni la corriger ni la faire évoluer si tu ne la comprends pas. Demande à l'assistant de te l'expliquer ligne par ligne et écris des tests avant de la garder.",
        explanation: "Deux raisons : « ça marche » n'est pas une preuve, et le code intégré devient ta responsabilité.",
      },
    ],
    reviewQuestions: [
      {
        id: "coder-avec-ia:r1",
        type: "multi",
        concept: "specification",
        prompt: "Tu veux une fonction qui calcule l'âge à partir d'une date de naissance. Quels cas limites dois-tu trancher toi-même avant de demander le code ?",
        options: [
          { id: "a", text: "Une date de naissance dans le futur" },
          { id: "b", text: "Une personne née un 29 février" },
          { id: "c", text: "Le jour même de l'anniversaire" },
          { id: "d", text: "La couleur du thème de l'éditeur", feedback: "Sans rapport avec le comportement de la fonction." },
        ],
        answer: ["a", "b", "c"],
        explanation: "Chaque cas limite non spécifié sera tranché au hasard par l'assistant. Les nommer, c'est décider.",
      },
      {
        id: "coder-avec-ia:r2",
        type: "mcq",
        concept: "slopsquatting",
        prompt: "L'assistant te suggère d'installer un paquet dont tu n'as jamais entendu parler. Quel est le bon premier geste ?",
        options: [
          { id: "a", text: "Chercher ce paquet sur le registre officiel et dans la documentation du projet concerné" },
          { id: "b", text: "L'installer pour voir s'il existe", feedback: "S'il existe et qu'il est malveillant, l'installation suffit à exécuter son code." },
          { id: "c", text: "Redemander à l'assistant s'il est sûr de lui", feedback: "Il confirmera probablement avec la même assurance. Il faut une source indépendante." },
        ],
        answer: "a",
        explanation: "On vérifie l'existence, l'ancienneté et l'origine d'un paquet avant de l'exécuter chez soi, jamais après.",
      },
      {
        id: "coder-avec-ia:r3",
        type: "true_false",
        concept: "risques-code",
        statement: "Une clé d'API collée par erreur dans un prompt doit être révoquée et remplacée.",
        answer: true,
        explanation: "Elle a quitté ta machine et tu ne contrôles plus où elle est stockée. La seule réponse sûre est de la rendre inutilisable.",
      },
      {
        id: "coder-avec-ia:r4",
        type: "ordering",
        concept: "petits-pas",
        prompt: "Un test échoue après une génération. Remets les gestes dans l'ordre.",
        items: [
          { id: "a", text: "Lire le test en échec et comprendre l'écart avec la spécification" },
          { id: "b", text: "Demander une correction limitée à ce cas" },
          { id: "c", text: "Lire le diff proposé" },
          { id: "d", text: "Relancer l'ensemble des tests" },
        ],
        answer: ["a", "b", "c", "d"],
        explanation: "Comprendre avant de demander, cibler la demande, relire, puis vérifier que rien d'autre n'a cassé.",
      },
    ],
    sources: [
      {
        title: "Best practices for using GitHub Copilot",
        publisher: "GitHub Docs",
        url: "https://docs.github.com/en/copilot/get-started/best-practices",
        verified: "2026-10-13",
      },
      {
        title: "Slopsquatting",
        publisher: "Wikipédia (en anglais)",
        url: "https://en.wikipedia.org/wiki/Slopsquatting",
        verified: "2026-10-13",
      },
    ],
  },
  {
    id: "deboguer-et-relire-code",
    title: "Déboguer et relire du code généré",
    objective: "Rapporter un bug de façon exploitable, mener la boucle reproduire, hypothèse, test, correctif, non-régression avec un assistant, et relire un code généré avec une grille en six points.",
    theme: "dev",
    difficulty: 4,
    format: "labo",
    durationMin: 15,
    xp: 50,
    skills: [
      "Rédiger un rapport de bug complet et minimal",
      "Faire classer des hypothèses avant tout correctif",
      "Verrouiller un correctif par un test de non-régression",
      "Relire du code généré : correction, cas limites, sécurité, lisibilité, dépendances, tests",
    ],
    prerequisites: ["coder-avec-ia"],
    sections: [
      {
        id: "rapporter",
        title: "Rapporter un bug à l'IA",
        blocks: [
          {
            type: "text",
            body: "Ton application liste les clients par pages de vingt. Un utilisateur te signale que le client « Abadie », le premier de la base, n'apparaît nulle part. Tu ouvres le chat et tu tapes : « ma pagination ne marche pas, corrige ». L'assistant va répondre, et avec assurance. Mais sur quoi ? Il ne voit ni ton code, ni ton erreur, ni ce que « marcher » veut dire pour toi. Il va produire le correctif le plus probable pour un bug de pagination en général.",
          },
          {
            type: "definition",
            term: "Exemple minimal reproductible",
            body: "Le plus petit morceau de code et de données qui fait apparaître le bug à coup sûr. On l'obtient en retirant tout ce qui n'est pas nécessaire pour reproduire le problème. Souvent, le construire suffit à trouver la cause.",
          },
          {
            type: "anatomy",
            title: "Un rapport de bug exploitable",
            segments: [
              { text: "Python 3.12, module standard sqlite3. ", label: "environnement", detail: "Langage, version, bibliothèques. Un même code peut se comporter différemment d'une version à l'autre." },
              { text: "Fonction ci-dessous, appelée avec chercher_clients(db, \"\", page=1, par_page=2) sur une table de 5 clients d'id 1 à 5. ", label: "code minimal et appel", detail: "Le code concerné et l'appel exact, sur des données réduites que l'assistant peut se représenter entièrement." },
              { text: "Attendu : les clients d'id 1 et 2. ", label: "attendu", detail: "Sans attendu, l'assistant doit deviner ce que « correct » signifie." },
              { text: "Obtenu : les clients d'id 3 et 4. Aucune erreur affichée. ", label: "obtenu", detail: "Le résultat réel, copié tel quel. S'il y avait un message d'erreur, il figurerait ici en entier, trace comprise." },
              { text: "Déjà essayé : page=0 renvoie bien 1 et 2, mais l'interface numérote les pages à partir de 1. ", label: "déjà essayé", detail: "Évite les suggestions que tu as déjà écartées, et apporte ici un indice décisif sur la cause." },
              { text: "Ne corrige pas encore : donne tes hypothèses classées de la plus probable à la moins probable, avec pour chacune comment la vérifier.", label: "consigne", detail: "Tu demandes un diagnostic avant un traitement. C'est le cœur de la méthode." },
            ],
            caption: "Touche chaque partie. Ce rapport prend deux minutes à écrire et en économise vingt.",
          },
          {
            type: "compare",
            title: "Ce que chaque rapport permet",
            columns: ["« Ça ne marche pas, corrige »", "Rapport complet"],
            rows: [
              { label: "Base de la réponse", a: "Les bugs les plus fréquents en général", b: "Ton code, tes données, ton écart précis" },
              { label: "Risque", a: "Un correctif qui change autre chose et masque le symptôme", b: "Un diagnostic que tu peux vérifier" },
              { label: "Message d'erreur", a: "Résumé de mémoire (« une erreur de type »)", b: "Copié en entier : type, message, fichier, ligne, trace" },
            ],
          },
          {
            type: "mistake",
            title: "Tronquer ou paraphraser le message d'erreur",
            why: "La ligne la plus utile d'une trace est souvent la dernière, ou celle qui cite ton propre fichier au milieu. En résumant, tu retires justement l'indice qui localise le problème.",
            fix: "Colle le message et la trace complets, tels quels. Retire seulement les secrets et les données personnelles qui s'y trouveraient.",
          },
        ],
      },
      {
        id: "boucle",
        title: "Hypothèses d'abord : la boucle de débogage",
        blocks: [
          {
            type: "flow",
            title: "La boucle",
            loop: true,
            nodes: [
              { label: "Reproduire", detail: "Obtenir le bug à volonté, sur le plus petit cas possible. Un bug que tu ne sais pas reproduire, tu ne sauras pas non plus prouver qu'il est corrigé." },
              { label: "Hypothèse", detail: "Formuler une cause précise et vérifiable : « le décalage est calculé avec page au lieu de page - 1 ». Pas « il y a un souci dans la pagination »." },
              { label: "Test", detail: "Une expérience qui confirme ou réfute l'hypothèse : afficher la valeur du décalage pour page=1, sans encore rien modifier." },
              { label: "Correctif", detail: "La plus petite modification qui traite la cause confirmée. Tu dois pouvoir expliquer pourquoi elle marche." },
              { label: "Non-régression", detail: "Un test automatique qui échouait avant le correctif et passe après. Il reste dans le projet : le bug ne reviendra pas en silence." },
            ],
            caption: "Si le test réfute l'hypothèse, on revient à l'étape « hypothèse » avec une information de plus, sans avoir abîmé le code.",
          },
          {
            type: "dialogue",
            label: "La réponse au rapport de bug",
            turns: [
              { who: "ai", text: "Hypothèses, de la plus probable à la moins probable. 1) Le décalage est calculé comme page × par_page : pour page=1 il vaut 2, donc les deux premières lignes sont sautées. Ton essai avec page=0 va dans ce sens. Vérification : affiche la valeur de `debut` pour page=1. 2) La requête n'a pas de ORDER BY : l'ordre des lignes n'est pas garanti. Vérification : ajoute ORDER BY id et compare. 3) Les deux premiers clients sont exclus par le filtre sur le nom. Vérification : exécute la requête sans LIMIT." },
              { who: "user", text: "`debut` vaut 2 pour page=1. Hypothèse 1 confirmée. Propose le correctif minimal, et un test qui échoue avec le code actuel." },
            ],
            note: "L'assistant propose, tu vérifies, puis tu autorises le correctif. Au passage, l'hypothèse 2 a révélé un vrai défaut secondaire (l'absence de tri), à traiter séparément.",
          },
          {
            type: "code",
            lang: "python",
            code: `import sqlite3

from clients import chercher_clients


def test_page_1_commence_au_premier_client(tmp_path):
    db = tmp_path / "test.db"
    con = sqlite3.connect(db)
    con.execute("CREATE TABLE clients (id INTEGER PRIMARY KEY, nom TEXT, email TEXT)")
    con.executemany(
        "INSERT INTO clients (nom, email) VALUES (?, ?)",
        [(f"Martin {i}", f"m{i}@exemple.test") for i in range(1, 6)],
    )
    con.commit()
    con.close()

    resultats = chercher_clients(db, "Martin", page=1, par_page=2)

    assert [ligne[0] for ligne in resultats] == [1, 2]`,
            caption: "Le test de non-régression (pytest). Lance-le avant le correctif : il doit échouer. S'il passe déjà, il ne teste pas le bug.",
          },
          {
            type: "mistake",
            title: "Accepter un correctif qu'on ne comprend pas",
            why: "Un correctif peut faire disparaître le symptôme sans toucher la cause : entourer le code d'un `try/except` qui avale l'erreur, ajouter une condition spéciale pour ton cas de test, modifier le test lui-même pour qu'il passe. Les voyants repassent au vert, le bug est toujours là.",
            fix: "Avant d'accepter, réponds à trois questions : quelle était la cause ? pourquoi cette modification la traite-t-elle ? qu'est-ce qu'elle change d'autre ? Si tu ne sais pas, demande l'explication, pas un autre correctif.",
          },
          {
            type: "check",
            question: {
              id: "deboguer-et-relire-code:c1",
              type: "ordering",
              concept: "boucle-debogage",
              prompt: "Remets la boucle de débogage dans l'ordre.",
              items: [
                { id: "a", text: "Reproduire le bug sur un cas minimal" },
                { id: "b", text: "Formuler une hypothèse précise sur la cause" },
                { id: "c", text: "Tester l'hypothèse sans modifier le code" },
                { id: "d", text: "Appliquer le correctif minimal" },
                { id: "e", text: "Ajouter un test de non-régression" },
              ],
              answer: ["a", "b", "c", "d", "e"],
              explanation: "On ne corrige qu'une cause confirmée, et on verrouille le correctif par un test qui échouait avant.",
            },
          },
        ],
      },
      {
        id: "grille",
        title: "La grille de relecture",
        blocks: [
          {
            type: "text",
            body: "Déboguer, c'est réagir à un défaut qui s'est montré. Relire, c'est chercher ceux qui ne se sont pas encore montrés. Le code généré a une particularité : il est toujours bien présenté. Noms corrects, commentaires, style régulier. Cette propreté de surface endort l'attention ; une grille oblige à regarder au bon endroit.",
          },
          {
            type: "table",
            headers: ["Point", "Questions à se poser"],
            rows: [
              ["1. Correction", "Le code fait-il ce qui est demandé sur le cas nominal ? Les calculs d'indices, de bornes et de décalages sont-ils justes ?"],
              ["2. Cas limites", "Entrée vide, nulle, négative, énorme, de mauvais type ? Première et dernière page ? Liste vide ? Caractères spéciaux ?"],
              ["3. Sécurité", "Une entrée utilisateur est-elle insérée dans une requête, une commande, un chemin de fichier, du HTML ? Les entrées sont-elles validées ? Y a-t-il un secret dans le code ?"],
              ["4. Lisibilité", "Pourrais-tu modifier ce code dans six mois ? Les ressources ouvertes (fichiers, connexions) sont-elles refermées ?"],
              ["5. Dépendances", "Chaque import existe-t-il vraiment, dans une version que tu utilises ? Est-il nécessaire ?"],
              ["6. Tests", "Existe-t-il des tests ? Couvrent-ils les cas limites, ou seulement le cas facile ?"],
            ],
            caption: "Six points, dans cet ordre : inutile de discuter du style d'un code qui est faux.",
          },
          {
            type: "definition",
            term: "Injection",
            body: "Faille où une donnée fournie par l'utilisateur est interprétée comme du code par le système qui la reçoit. Elle apparaît quand on assemble une requête ou une commande en y collant directement le texte reçu. L'injection SQL en est la forme la plus connue.",
          },
          {
            type: "keypoint",
            body: "Tu peux demander à l'assistant de relire son propre code avec cette grille : il trouve de vrais défauts. Mais il en manque aussi, et il en invente parfois. Sa relecture complète la tienne, elle ne la remplace pas.",
          },
        ],
      },
      {
        id: "labo",
        title: "Labo : relire un extrait pas à pas",
        blocks: [
          {
            type: "text",
            body: "Voici la fonction complète d'où venait le bug de pagination, telle qu'un assistant l'avait générée. Elle s'exécute sans erreur et renvoie des résultats. Avant de lire la suite, prends deux minutes : applique la grille et note tout ce que tu trouves.",
          },
          {
            type: "code",
            lang: "python",
            code: `import sqlite3

API_KEY = "sk-live-4f9a27d1c08b"  # clé du service d'envoi d'e-mails


def chercher_clients(db_path, nom, page=1, par_page=20):
    """Renvoie une page de clients dont le nom contient le texte donné."""
    con = sqlite3.connect(db_path)
    cur = con.cursor()
    debut = page * par_page
    requete = (
        f"SELECT id, nom, email FROM clients WHERE nom LIKE '%{nom}%' "
        f"LIMIT {par_page} OFFSET {debut}"
    )
    cur.execute(requete)
    return cur.fetchall()`,
            caption: "Extrait à relire. La clé est fictive.",
          },
          {
            type: "check",
            question: {
              id: "deboguer-et-relire-code:c2",
              type: "multi",
              concept: "grille-relecture",
              prompt: "Quels défauts cet extrait contient-il réellement ?",
              options: [
                { id: "a", text: "Le texte recherché est inséré directement dans la requête SQL" },
                { id: "b", text: "Le décalage saute la première page quand page vaut 1" },
                { id: "c", text: "Une clé d'API est écrite en dur dans le fichier" },
                { id: "d", text: "page et par_page ne sont jamais validés" },
                { id: "e", text: "sqlite3 est une dépendance inventée", feedback: "Non : sqlite3 fait partie de la bibliothèque standard de Python. Vérifier une dépendance, c'est aussi savoir reconnaître celles qui existent." },
              ],
              answer: ["a", "b", "c", "d"],
              explanation: "Quatre défauts, de natures différentes : sécurité (injection, secret), correction (décalage) et cas limites (validation). Passons-les en revue.",
            },
          },
          {
            type: "steps",
            title: "La relecture, point par point",
            items: [
              { title: "Correction : le décalage", body: "`debut = page * par_page` : pour la page 1, les vingt premiers clients sont sautés. Le calcul juste est `(page - 1) * par_page`. C'est le bug signalé par l'utilisateur." },
              { title: "Cas limites : aucune validation", body: "`page=0` ou `page=-3` produit un décalage nul ou négatif ; `par_page=1000000` renvoie toute la table ; rien ne vérifie que ces valeurs sont des entiers." },
              { title: "Sécurité : injection SQL", body: "`nom` est collé dans la requête par une f-string. Avec la valeur `' OR 1=1 --`, la requête devient `… WHERE nom LIKE '%' OR 1=1 --%' LIMIT …` : la condition est toujours vraie et tout ce qui suit `--` est un commentaire, limite de pagination comprise. Tous les clients sortent. `par_page` et `debut` sont insérés de la même façon." },
              { title: "Sécurité : secret en dur", body: "`API_KEY` est dans le code source : elle sera copiée dans le dépôt, son historique, et tout prompt où tu colleras ce fichier. Elle n'a d'ailleurs aucun rapport avec cette fonction." },
              { title: "Lisibilité et ressources", body: "La connexion n'est jamais fermée. Et sans `ORDER BY`, l'ordre des lignes n'est pas garanti : un même client peut apparaître sur deux pages ou sur aucune." },
              { title: "Dépendances et tests", body: "Dépendances : uniquement la bibliothèque standard, rien à signaler. Tests : aucun. Le bug de la page 1 aurait été attrapé par un seul test de trois lignes." },
            ],
          },
          {
            type: "code",
            lang: "python",
            code: `import sqlite3

PAR_PAGE_MAX = 100


def chercher_clients(db_path, nom, page=1, par_page=20):
    """Renvoie une page de clients dont le nom contient le texte donné."""
    if not isinstance(page, int) or page < 1:
        raise ValueError("page doit être un entier supérieur ou égal à 1")
    if not isinstance(par_page, int) or not 1 <= par_page <= PAR_PAGE_MAX:
        raise ValueError(f"par_page doit être un entier entre 1 et {PAR_PAGE_MAX}")

    debut = (page - 1) * par_page
    con = sqlite3.connect(db_path)
    try:
        cur = con.execute(
            "SELECT id, nom, email FROM clients "
            "WHERE nom LIKE ? ORDER BY id LIMIT ? OFFSET ?",
            (f"%{nom}%", par_page, debut),
        )
        return cur.fetchall()
    finally:
        con.close()`,
            caption: "Version corrigée. Les valeurs passent par des paramètres (les « ? ») : la base les traite comme des données, jamais comme du SQL. La clé d'API a quitté le code pour une variable d'environnement, et l'ancienne a été révoquée.",
          },
          {
            type: "text",
            title: "Pourquoi les paramètres règlent l'injection",
            body: "Avec une requête paramétrée, le texte SQL et les valeurs voyagent séparément. `' OR 1=1 --` n'est plus qu'une chaîne de caractères qu'on cherche dans la colonne `nom` ; elle ne trouve simplement aucun client. La documentation de Python le dit sans détour : toujours utiliser des paramètres plutôt que les opérations sur les chaînes pour insérer des valeurs dans une requête. Valider les entrées reste utile (les bornes de `page`), mais ne remplace pas les paramètres. Détail qui subsiste : dans un `LIKE`, les caractères `%` et `_` tapés par l'utilisateur gardent leur rôle de jokers. Ce n'est pas une injection, mais c'est un comportement à décider.",
          },
          {
            type: "exercise",
            title: "À toi : relis et fais corriger",
            minutes: 6,
            prompt: "Voici une fonction générée (Python) : `def lire_rapport(nom_fichier): chemin = \"/srv/rapports/\" + nom_fichier ; return open(chemin).read()`. Elle sert une page web où l'utilisateur choisit le rapport à afficher. 1) Applique les six points de la grille et note chaque défaut. 2) Rédige le message à envoyer à l'assistant pour obtenir d'abord ses hypothèses sur les risques, puis un correctif minimal. 3) Écris en une phrase le test de non-régression que tu exigerais.",
            hints: [
              "Que se passe-t-il si `nom_fichier` vaut `../../etc/passwd` ?",
              "Que se passe-t-il si le fichier n'existe pas ? Et qui referme le fichier ?",
            ],
            solution: "1) Correction : fonctionne sur le cas nominal. Cas limites : fichier inexistant (exception non gérée, à transformer en erreur claire), nom vide, fichier très volumineux lu d'un seul bloc. Sécurité : `nom_fichier` vient de l'utilisateur et est collé dans un chemin ; avec `../../etc/passwd`, la fonction lit un fichier hors du dossier prévu. C'est une traversée de répertoire, de la même famille que l'injection : une donnée change le sens de l'opération. Lisibilité : le fichier n'est jamais refermé (utiliser `with`), l'encodage n'est pas précisé. Dépendances : aucune. Tests : aucun. 2) Message : « Python 3.12. Fonction ci-dessous, appelée depuis une page web avec un nom choisi par l'utilisateur. Attendu : ne lire que des fichiers situés directement dans /srv/rapports. Avant tout correctif, liste les risques classés par gravité et dis comment vérifier chacun. Ensuite seulement, propose la modification minimale et les tests. » 3) Correctif attendu : résoudre le chemin complet, vérifier qu'il se trouve bien à l'intérieur de `/srv/rapports` (ou, mieux, n'accepter qu'un nom figurant dans la liste des rapports existants), et lever une erreur sinon. Test de non-régression : appeler la fonction avec `../../etc/passwd` et vérifier qu'elle lève une erreur sans rien lire. Si l'assistant propose seulement de supprimer les `..` du nom, demande-lui pourquoi cela suffirait : une liste de valeurs autorisées est plus sûre qu'un filtrage de valeurs interdites.",
          },
        ],
      },
    ],
    summary: [
      "Un rapport de bug utile contient : l'environnement, un code minimal qui reproduit, l'attendu, l'obtenu, le message d'erreur complet et ce que tu as déjà essayé.",
      "Demande des hypothèses classées et leur moyen de vérification avant tout correctif.",
      "La boucle : reproduire, hypothèse, test, correctif minimal, test de non-régression qui échouait avant.",
      "N'accepte pas un correctif que tu ne sais pas expliquer : il peut masquer le symptôme sans traiter la cause.",
      "Relis le code généré avec la grille : correction, cas limites, sécurité, lisibilité, dépendances, tests.",
      "Une entrée utilisateur ne se colle jamais dans une requête : on utilise des requêtes paramétrées, et les secrets restent hors du code.",
    ],
    questions: [
      {
        id: "deboguer-et-relire-code:q1",
        type: "multi",
        concept: "rapport-de-bug",
        prompt: "Quels éléments doivent figurer dans un rapport de bug adressé à un assistant ?",
        options: [
          { id: "a", text: "Le message d'erreur complet, trace comprise" },
          { id: "b", text: "Le plus petit code qui reproduit le problème" },
          { id: "c", text: "Le résultat attendu et le résultat obtenu" },
          { id: "d", text: "Ce que tu as déjà essayé" },
          { id: "e", text: "L'intégralité du projet, pour ne rien oublier", feedback: "Trop de code noie le problème. On cherche l'exemple minimal, pas l'exhaustivité." },
        ],
        answer: ["a", "b", "c", "d"],
        explanation: "Ces quatre éléments remplacent les suppositions de l'assistant par des faits. Un exemple minimal vaut mieux qu'un projet entier.",
      },
      {
        id: "deboguer-et-relire-code:q2",
        type: "mcq",
        concept: "hypotheses",
        prompt: "Pourquoi demander des hypothèses classées avant un correctif ?",
        options: [
          { id: "a", text: "Pour vérifier la cause avant de modifier le code, et éviter un correctif qui masque le symptôme" },
          { id: "b", text: "Pour que la réponse soit plus longue", feedback: "La longueur n'est pas le but. On cherche un diagnostic vérifiable." },
          { id: "c", text: "Parce que l'assistant ne sait pas corriger du code directement", feedback: "Il sait, et c'est le piège : il corrige volontiers une cause supposée." },
        ],
        answer: "a",
        explanation: "Un correctif sans diagnostic répond au bug le plus probable en général. Les hypothèses te donnent quelque chose à tester avant de toucher au code.",
      },
      {
        id: "deboguer-et-relire-code:q3",
        type: "ai_analysis",
        concept: "correctif-compris",
        prompt: "Tu as signalé que la fonction plante avec `KeyError: 'email'` sur certains clients. Que penser de ce correctif ?",
        userMessage: "Ma fonction plante avec KeyError: 'email' pour certains clients. Corrige.",
        aiResponse: "Voici le correctif : j'ai entouré le traitement d'un bloc `try: … except Exception: pass`. La fonction ne plante plus. J'ai aussi mis à jour le test pour qu'il n'utilise que des clients ayant un e-mail.",
        options: [
          { id: "a", text: "L'erreur est avalée : les clients sans e-mail sont ignorés en silence" },
          { id: "b", text: "La cause (des clients sans champ « email ») n'est ni expliquée ni traitée" },
          { id: "c", text: "Le test a été modifié pour éviter le cas qui échouait" },
          { id: "d", text: "`except Exception` masquera aussi toutes les autres erreurs futures" },
          { id: "e", text: "Le correctif est bon puisque la fonction ne plante plus", feedback: "Ne plus planter n'est pas fonctionner : le symptôme a disparu, pas le bug." },
        ],
        answer: ["a", "b", "c", "d"],
        explanation: "C'est le correctif cosmétique type. La bonne démarche : décider ce qui doit arriver pour un client sans e-mail, traiter ce cas explicitement, et garder un test qui le couvre.",
      },
      {
        id: "deboguer-et-relire-code:q4",
        type: "fill_choice",
        concept: "non-regression",
        prompt: "Complète la phrase.",
        sentence: "Un bon test de non-régression ___ avant le correctif et passe après.",
        options: [
          { id: "a", text: "échoue" },
          { id: "b", text: "passe déjà" },
          { id: "c", text: "n'est pas exécuté" },
        ],
        answer: "a",
        explanation: "S'il passe avant le correctif, il ne détecte pas le bug. C'est son échec initial qui prouve qu'il le surveille.",
      },
      {
        id: "deboguer-et-relire-code:q5",
        type: "mcq",
        concept: "injection-sql",
        prompt: "Laquelle de ces lignes Python est protégée contre l'injection SQL ?",
        options: [
          { id: "a", text: "`cur.execute(\"SELECT * FROM clients WHERE nom = ?\", (nom,))`" },
          { id: "b", text: "`cur.execute(f\"SELECT * FROM clients WHERE nom = '{nom}'\")`", feedback: "La f-string colle la valeur dans le texte SQL : une apostrophe dans `nom` suffit à en changer le sens." },
          { id: "c", text: "`cur.execute(\"SELECT * FROM clients WHERE nom = '\" + nom + \"'\")`", feedback: "La concaténation a exactement le même défaut que la f-string." },
        ],
        answer: "a",
        explanation: "Avec le paramètre `?`, la valeur est transmise à part : la base la traite comme une donnée, quel que soit son contenu.",
      },
      {
        id: "deboguer-et-relire-code:q6",
        type: "match",
        concept: "grille-relecture",
        prompt: "Associe chaque défaut au point de la grille qui le détecte.",
        left: [
          { id: "l1", text: "La dernière page renvoie une ligne de trop" },
          { id: "l2", text: "La fonction plante sur une liste vide" },
          { id: "l3", text: "Un mot de passe est écrit dans le fichier" },
          { id: "l4", text: "Un import désigne un paquet introuvable" },
        ],
        right: [
          { id: "r1", text: "Correction" },
          { id: "r2", text: "Cas limites" },
          { id: "r3", text: "Sécurité" },
          { id: "r4", text: "Dépendances" },
        ],
        answer: ["r1", "r2", "r3", "r4"],
        explanation: "Chaque point de la grille oriente le regard vers une famille de défauts que la bonne présentation du code ne laisse pas voir.",
      },
      {
        id: "deboguer-et-relire-code:q7",
        type: "true_false",
        concept: "grille-relecture",
        statement: "Un code généré bien présenté, avec des noms clairs et des commentaires, a moins besoin d'être relu.",
        answer: false,
        explanation: "La présentation soignée est la norme du code généré et ne dit rien de sa justesse. Elle rend au contraire la relecture plus nécessaire, parce qu'elle endort.",
      },
      {
        id: "deboguer-et-relire-code:q8",
        type: "written",
        concept: "correctif-compris",
        prompt: "L'assistant te propose un correctif de trois lignes que tu ne comprends pas, et les tests passent. Que fais-tu avant de l'accepter ? Réponds en deux phrases.",
        placeholder: "Avant de l'accepter, je…",
        criteria: [
          { id: "expliquer", label: "Demander ou obtenir l'explication de la cause et du correctif", anyOf: ["expliqu", "comprend", "pourquoi", "cause", "ligne par ligne"] },
          { id: "symptome", label: "Vérifier qu'il traite la cause et pas seulement le symptôme", anyOf: ["symptôme", "symptome", "masqu", "cach", "aval", "vraie cause", "cause réelle", "cause reelle", "contourn"] },
          { id: "test", label: "S'appuyer sur un test de non-régression", anyOf: ["non-régression", "non-regression", "non régression", "non regression", "test qui échou", "test qui echou", "échouait avant", "echouait avant", "reprodui"] },
        ],
        minCriteria: 2,
        modelAnswer: "Avant de l'accepter, je demande à l'assistant d'expliquer quelle était la cause et pourquoi ces lignes la traitent, pour m'assurer qu'elles ne masquent pas seulement le symptôme. Je vérifie aussi qu'un test de non-régression échouait avant le correctif et passe après.",
        explanation: "Des tests au vert ne suffisent pas : un correctif peut les faire passer en avalant l'erreur. Comprendre la cause et disposer d'un test qui reproduisait le bug sont les deux garanties.",
      },
    ],
    reviewQuestions: [
      {
        id: "deboguer-et-relire-code:r1",
        type: "mcq",
        concept: "rapport-de-bug",
        prompt: "Lequel de ces messages donne le plus de chances d'obtenir un diagnostic juste ?",
        options: [
          { id: "a", text: "« Python 3.12. `moyenne([])` lève ZeroDivisionError (trace ci-dessous). Attendu : renvoyer None pour une liste vide. Code : … »" },
          { id: "b", text: "« Ma fonction moyenne a un bug, tu peux regarder ? »", feedback: "Ni code, ni erreur, ni attendu : l'assistant ne peut que supposer." },
          { id: "c", text: "« J'ai une erreur de division quelque part dans mon projet de 3 000 lignes, le voici. »", feedback: "L'erreur est résumée et le code n'est pas réduit : le signal est noyé." },
        ],
        answer: "a",
        explanation: "Environnement, appel exact, erreur complète, attendu, code minimal : tout ce qu'il faut pour raisonner sur le cas réel.",
      },
      {
        id: "deboguer-et-relire-code:r2",
        type: "ordering",
        concept: "non-regression",
        prompt: "Tu viens de confirmer la cause d'un bug. Remets la suite dans l'ordre.",
        items: [
          { id: "a", text: "Écrire un test qui reproduit le bug" },
          { id: "b", text: "Constater que ce test échoue" },
          { id: "c", text: "Appliquer le correctif minimal" },
          { id: "d", text: "Constater que ce test passe, ainsi que tous les autres" },
        ],
        answer: ["a", "b", "c", "d"],
        explanation: "Le test d'abord, son échec ensuite : c'est ce qui prouve qu'il surveille bien le bug. Puis le correctif, puis la vérification complète.",
      },
      {
        id: "deboguer-et-relire-code:r3",
        type: "multi",
        concept: "injection-sql",
        prompt: "Dans quelles situations une entrée utilisateur risque-t-elle d'être interprétée comme du code ?",
        options: [
          { id: "a", text: "Elle est concaténée dans une requête SQL" },
          { id: "b", text: "Elle est insérée dans une commande système lancée par le programme" },
          { id: "c", text: "Elle est ajoutée à un chemin de fichier sans vérification" },
          { id: "d", text: "Elle est transmise comme paramètre d'une requête paramétrée", feedback: "C'est justement la protection : la valeur reste une donnée." },
        ],
        answer: ["a", "b", "c"],
        explanation: "Même famille de failles : une donnée collée dans un texte que le système interprète. La parade est de séparer données et instructions, ou de n'accepter que des valeurs autorisées.",
      },
      {
        id: "deboguer-et-relire-code:r4",
        type: "ranking",
        concept: "grille-relecture",
        prompt: "Tu relis un code généré. Classe ces défauts selon l'ordre dans lequel les traiter.",
        scale: ["À traiter en premier", "À traiter en dernier"],
        items: [
          { id: "a", text: "Une entrée utilisateur est insérée telle quelle dans une requête SQL" },
          { id: "b", text: "Le calcul de pagination saute la première page" },
          { id: "c", text: "Aucun test ne couvre la liste vide" },
          { id: "d", text: "Une variable s'appelle `x` au lieu de `nombre_clients`" },
        ],
        answer: ["a", "b", "c", "d"],
        explanation: "La faille exploitable d'abord, puis le résultat faux, puis la couverture manquante, enfin le confort de lecture.",
      },
    ],
    sources: [
      {
        title: "sqlite3 — How to use placeholders to bind values in SQL queries",
        publisher: "Python Software Foundation, documentation Python",
        url: "https://docs.python.org/3/library/sqlite3.html",
        verified: "2026-10-13",
      },
      {
        title: "A03:2021 – Injection",
        publisher: "OWASP Top 10",
        url: "https://top10.owasp.org/2021/A03_2021-Injection/index.html",
        verified: "2026-10-13",
      },
    ],
  },
];
