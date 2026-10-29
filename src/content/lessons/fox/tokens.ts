import type { Lesson } from "../../types";

const GLOSSARY = { title: "Glossary (LLM, Pretraining, Tokens, Temperature, Context window)", publisher: "Anthropic, documentation Claude", url: "https://platform.claude.com/docs/en/about-claude/glossary", verified: "2026-10-14" };
const CONTEXT_WINDOWS = { title: "Context windows", publisher: "Anthropic, documentation Claude", url: "https://platform.claude.com/docs/en/build-with-claude/context-windows", verified: "2026-10-14" };
const BEST_PRACTICES = { title: "Prompting best practices (Long context prompting)", publisher: "Anthropic, documentation Claude", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices", verified: "2026-10-14" };
const MODELS_OVERVIEW = { title: "Models overview (reliable knowledge cutoff, training data cutoff)", publisher: "Anthropic, documentation Claude", url: "https://platform.claude.com/docs/en/about-claude/models/overview", verified: "2026-10-14" };

/** Fox · chapitre 1 : le cours d'ouverture, la mécanique sur laquelle tout le parcours s'appuie */
export const foxTokens: Lesson[] = [
  {
    id: "tokens-et-temperature",
    title: "Tokens, contexte et température",
    objective: "Raisonner comme le modèle : tokens, fenêtre de contexte, tirage de la suite et date de coupure.",
    theme: "comprendre",
    difficulty: 3,
    format: "labo",
    durationMin: 10,
    xp: 40,
    skills: ["Estimer en tokens", "Régler la température selon la tâche", "Prévoir les limites de la fenêtre de contexte"],
    sections: [
      {
        id: "prediction",
        title: "Une seule opération",
        blocks: [
          {
            type: "text",
            body: "Un grand modèle de langage fait une seule opération, répétée : à partir de tout le texte reçu, il calcule **une distribution de probabilités sur le token suivant**, en tire un, l'ajoute, et recommence. Tout le reste du parcours (prompts, API, agents, RAG) consiste à contrôler **ce qu'il reçoit** et **ce qu'on fait de ce qu'il produit**.",
          },
          {
            type: "flow",
            loop: true,
            nodes: [
              { label: "Contexte", detail: "Prompt système, historique, documents, résultats d'outils : tout est du texte, découpé en tokens." },
              { label: "Distribution", detail: "Une probabilité pour chaque token possible du vocabulaire." },
              { label: "Tirage", detail: "Un token est choisi selon ces probabilités et les réglages (température…)." },
              { label: "Ajout", detail: "Le token rejoint le contexte. La génération s'arrête sur un token de fin ou une limite." },
            ],
            caption: "Touche chaque étape.",
          },
        ],
      },
      {
        id: "tokens",
        title: "Penser en tokens",
        blocks: [
          {
            type: "definition",
            term: "Token",
            body: "L'unité de texte du modèle : un mot courant, un morceau de mot, une ponctuation. Le découpage dépend du **tokenizer** de chaque modèle. Le français et le code consomment souvent plus de tokens par mot que l'anglais courant.",
          },
          {
            type: "anatomy",
            title: "Un découpage possible",
            segments: [
              { text: "anti", label: "token", detail: "Un préfixe fréquent devient souvent un token à part." },
              { text: "constitution", label: "token" },
              { text: "nellement", label: "token", detail: "Un mot rare est découpé en plusieurs morceaux." },
            ],
            caption: "Découpage illustratif : chaque tokenizer coupe différemment.",
          },
          {
            type: "check",
            question: {
              id: "tokens-et-temperature:c1",
              type: "mcq",
              concept: "tokens",
              prompt: "Pourquoi un modèle peut-il se tromper en comptant les « r » de « arrière » ?",
              options: [
                { id: "a", text: "Il voit des tokens, pas les lettres une par une" },
                { id: "b", text: "Il ne connaît pas l'alphabet" },
              ],
              answer: "a",
              explanation: "Les lettres sont noyées dans des morceaux de mots. Pour compter, mieux vaut lui faire épeler, ou utiliser du code.",
            },
          },
        ],
      },
      {
        id: "cout",
        title: "Tout se compte en tokens",
        blocks: [
          {
            type: "text",
            body: "Les API facturent **les tokens d'entrée et de sortie**, souvent à des prix différents. Les limites de débit et la latence suivent la même unité. Un historique qui grossit, c'est un coût qui grossit **à chaque appel**, puisque tout le contexte est renvoyé.",
          },
          {
            type: "check",
            question: {
              id: "tokens-et-temperature:c2",
              type: "true_false",
              concept: "cout",
              statement: "Dans une conversation par API, le coût d'un message dépend aussi de la longueur de l'historique renvoyé.",
              answer: true,
              explanation: "Chaque appel renvoie le contexte : les tokens d'entrée incluent tout l'historique.",
            },
          },
        ],
      },
      {
        id: "fenetre",
        title: "La fenêtre de contexte",
        blocks: [
          {
            type: "definition",
            term: "Fenêtre de contexte",
            body: "Le nombre maximal de tokens que le modèle traite en une fois : entrée **et** sortie. Au-delà, il faut couper, résumer ou retrouver seulement les passages utiles.",
          },
          {
            type: "text",
            body: "Une grande fenêtre n'est pas une mémoire parfaite : sur un contexte très chargé, l'information au milieu peut être **moins bien exploitée**. Mettre les documents longs en haut et la question à la fin, et ne garder que ce qui sert, améliore souvent les réponses.",
          },
          {
            type: "check",
            question: {
              id: "tokens-et-temperature:c3",
              type: "mcq",
              concept: "fenetre",
              prompt: "La fenêtre fait 200 000 tokens. Ton document en fait 190 000. Le risque principal ?",
              options: [
                { id: "a", text: "Peu de place pour la réponse, et un contexte moins bien exploité" },
                { id: "b", text: "Aucun : ça tient" },
              ],
              answer: "a",
              explanation: "La sortie compte dans la fenêtre, et un contexte saturé se lit moins bien. Retrouver les bons passages est souvent préférable.",
            },
          },
        ],
      },
      {
        id: "temperature",
        title: "Le tirage et la température",
        blocks: [
          {
            type: "text",
            body: "La **température** règle la part de hasard du tirage. Basse : le modèle prend presque toujours les tokens les plus probables, les sorties se ressemblent. Haute : il ose des suites moins probables, plus variées, parfois moins justes.",
          },
          {
            type: "spectrum",
            title: "Quelle température ?",
            poles: ["Basse", "Haute"],
            items: [
              { label: "Extraire des montants de factures", position: 5, detail: "Une seule bonne réponse : on veut de la stabilité." },
              { label: "Classer des tickets dans 5 catégories", position: 15 },
              { label: "Rédiger un mail", position: 50 },
              { label: "Trouver 20 idées de noms", position: 85, detail: "On cherche la variété." },
            ],
            caption: "Touche chaque tâche.",
          },
          {
            type: "mistake",
            title: "« Température 0 = réponse toujours identique »",
            why: "Elle réduit fortement la variabilité, mais selon les modèles et les infrastructures, deux appels identiques peuvent encore différer légèrement.",
            fix: "Ne fonde pas un système sur l'identité exacte des sorties : **valide** le résultat (format, valeurs) à chaque appel.",
          },
        ],
      },
      {
        id: "coupure",
        title: "La date de coupure",
        blocks: [
          {
            type: "text",
            body: "Les poids sont figés à la fin de l'entraînement. Le modèle ignore ce qui a suivi sa **date de coupure**, et ne sait pas lui-même précisément où elle se situe. Pour du récent, il faut **fournir l'information** dans le contexte : recherche, document, résultat d'outil.",
          },
          {
            type: "check",
            question: {
              id: "tokens-et-temperature:c4",
              type: "mcq",
              concept: "coupure",
              prompt: "Ton application doit répondre sur les tarifs du mois. La bonne architecture ?",
              options: [
                { id: "a", text: "Injecter la grille tarifaire à jour dans le contexte à chaque appel" },
                { id: "b", text: "Compter sur ce que le modèle sait déjà" },
              ],
              answer: "a",
              explanation: "Ce qui change souvent doit venir de tes données, pas des poids du modèle.",
            },
          },
        ],
      },
    ],
    summary: [
      "Le modèle tire **le token suivant** dans une distribution, en boucle.",
      "Tout se compte en **tokens** : coût, limites, fenêtre. L'historique est renvoyé à chaque appel.",
      "La **fenêtre** inclut entrée et sortie ; un contexte saturé est moins bien exploité.",
      "**Température basse** pour une seule bonne réponse, plus haute pour la variété. Valide toujours la sortie.",
      "Le récent vient **du contexte**, pas des poids figés.",
    ],
    questions: [
      {
        id: "tokens-et-temperature:q1",
        type: "mcq",
        concept: "tokens",
        prompt: "Qu'est-ce qu'un token ?",
        options: [
          { id: "a", text: "Une unité de texte : mot, morceau de mot ou ponctuation" },
          { id: "b", text: "Une phrase entière" },
          { id: "c", text: "Un caractère, toujours" },
        ],
        answer: "a",
        explanation: "Le découpage dépend du tokenizer du modèle.",
      },
      {
        id: "tokens-et-temperature:q2",
        type: "true_false",
        concept: "fenetre",
        statement: "La réponse générée compte dans la fenêtre de contexte.",
        answer: true,
        explanation: "Entrée et sortie partagent la même limite.",
      },
      {
        id: "tokens-et-temperature:q3",
        type: "match",
        concept: "temperature",
        prompt: "Associe chaque tâche à une température.",
        left: [
          { id: "1", text: "Extraire une date d'un contrat" },
          { id: "2", text: "Proposer des slogans variés" },
        ],
        right: [
          { id: "basse", text: "Basse" },
          { id: "haute", text: "Plus haute" },
        ],
        answer: ["basse", "haute"],
        explanation: "Une seule bonne réponse : stabilité. Créativité : variété.",
      },
      {
        id: "tokens-et-temperature:q4",
        type: "mcq",
        concept: "cout",
        prompt: "Une conversation longue par API devient chère. Pourquoi ?",
        options: [
          { id: "a", text: "Tout l'historique est renvoyé, donc facturé, à chaque appel" },
          { id: "b", text: "Le modèle se fatigue" },
        ],
        answer: "a",
        explanation: "Résumer ou tronquer l'historique réduit le coût.",
      },
      {
        id: "tokens-et-temperature:q5",
        type: "mcq",
        concept: "coupure",
        prompt: "Le modèle affirme qu'une bibliothèque est en version 2. Elle est en version 4. Explication la plus probable ?",
        options: [
          { id: "a", text: "La version 4 est sortie après sa date de coupure" },
          { id: "b", text: "Il ment volontairement" },
        ],
        answer: "a",
        explanation: "Ses connaissances sont figées. Donne-lui la documentation à jour.",
      },
      {
        id: "tokens-et-temperature:q6",
        type: "true_false",
        concept: "temperature",
        statement: "À température 0, on peut se passer de valider la sortie.",
        answer: false,
        explanation: "La variabilité baisse, elle ne garantit ni l'exactitude ni le format.",
      },
    ],
    reviewQuestions: [
      {
        id: "tokens-et-temperature:r1",
        type: "mcq",
        concept: "fenetre",
        prompt: "Où placer un long document dans le prompt, en général ?",
        options: [
          { id: "a", text: "En haut, avec la question à la fin" },
          { id: "b", text: "Après la question" },
        ],
        answer: "a",
        explanation: "Documents d'abord, question ensuite : c'est la disposition recommandée pour les longs contextes.",
      },
      {
        id: "tokens-et-temperature:r2",
        type: "mcq",
        concept: "tokens",
        prompt: "Pour compter précisément des lettres, le plus fiable ?",
        options: [
          { id: "a", text: "Lui faire épeler, ou utiliser du code" },
          { id: "b", text: "Lui demander de faire attention" },
        ],
        answer: "a",
        explanation: "Épeler remet chaque lettre en token ; le code compte exactement.",
      },
    ],
    sources: [GLOSSARY, CONTEXT_WINDOWS, BEST_PRACTICES, MODELS_OVERVIEW],
  },
];
