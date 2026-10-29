import type { Lesson } from "../../types";

const PROJECTS = { title: "What are projects?", publisher: "Anthropic, centre d'aide Claude", url: "https://support.claude.com/en/articles/9517075-what-are-projects", verified: "2026-10-14" };
const PROMPT_OVERVIEW = { title: "Prompt engineering overview", publisher: "Anthropic, documentation Claude", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview", verified: "2026-10-14" };

/** Gecko · chapitre 6 : le projet */
export const geckoChapter6: Lesson[] = [
  {
    id: "projet-assistant-de-revision",
    title: "Projet : un assistant sur mesure",
    objective: "Créer un assistant personnalisé pour tes études ou ton travail : instructions permanentes, cas de test, mode d'emploi.",
    theme: "projets",
    difficulty: 3,
    format: "projet",
    durationMin: 18,
    xp: 60,
    skills: ["Écrire des instructions permanentes", "Tester un assistant sur des cas prévus", "Documenter ses limites"],
    sections: [
      {
        id: "principe",
        title: "Étape 1 : le principe",
        blocks: [
          {
            type: "text",
            body: "Un assistant personnalisé, ce sont des **instructions permanentes** (le « prompt système »), parfois avec **tes documents**, appliquées à chaque nouvelle conversation. Les noms varient : projet, GPT, Gem.",
          },
          { type: "tools", toolIds: ["claude", "chatgpt", "gemini"] },
          {
            type: "check",
            question: {
              id: "projet-assistant-de-revision:v2-c1",
              type: "true_false",
              concept: "principe",
              statement: "Les instructions d'un assistant personnalisé s'appliquent à chaque nouvelle conversation.",
              answer: true,
              explanation: "C'est tout l'intérêt : tu ne les réécris plus à chaque fois.",
            },
          },
        ],
      },
      {
        id: "cadrage",
        title: "Étape 2 : le cadrage",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Pour qui ?", body: "Toi en L1 de droit, ton équipe support…" },
              { title: "Pour faire quoi ?", body: "Interroger sur le cours, préparer des réponses types…" },
              { title: "À partir de quoi ?", body: "Tes cours, la FAQ interne, rien d'autre." },
              { title: "Quel risque ?", body: "Inventer une règle, répondre hors sujet, donner la solution." },
            ],
          },
        ],
      },
      {
        id: "prompt-systeme",
        title: "Étape 3 : les instructions",
        blocks: [
          {
            type: "anatomy",
            title: "Un prompt système en six parties",
            segments: [
              { text: "Tu es un tuteur de droit des contrats pour un étudiant de L1.", label: "Rôle" },
              { text: " Appuie-toi uniquement sur les cours joints.", label: "Source", detail: "Moins d'inventions." },
              { text: " Pose une question à la fois, attends ma réponse, corrige.", label: "Déroulement" },
              { text: " Ne donne jamais la solution d'un exercice noté : propose un indice à la place.", label: "Règle et alternative", detail: "Chaque interdit vient avec une alternative." },
              { text: " Corrections en 3 lignes maximum.", label: "Format" },
              { text: " Exemple : « Presque ! Relis l'article 1103. »", label: "Exemple" },
            ],
            caption: "Touche chaque partie.",
          },
        ],
      },
      {
        id: "cas-test",
        title: "Étape 4 : cinq cas de test",
        blocks: [
          {
            type: "text",
            body: "Avant de tester, écris **cinq cas** avec le **comportement attendu**. Dont **deux pièges** tirés de tes risques : « donne-moi la réponse de l'exercice 3 », une question hors de tes cours.",
          },
          {
            type: "check",
            question: {
              id: "projet-assistant-de-revision:v2-c2",
              type: "mcq",
              concept: "cas-test",
              prompt: "Cas piège : « Donne-moi la solution du devoir noté. » Comportement attendu ?",
              options: [
                { id: "a", text: "Il refuse et propose un indice" },
                { id: "b", text: "Il donne la solution" },
              ],
              answer: "a",
              explanation: "Tu écris l'attendu avant de tester : sinon tu juges au feeling.",
            },
          },
        ],
      },
      {
        id: "iterer",
        title: "Étape 5 : itérer proprement",
        blocks: [
          { type: "keypoint", body: "Change **une seule chose** à la fois, relance **tous les cas**, note la version." },
          {
            type: "check",
            question: {
              id: "projet-assistant-de-revision:v2-c3",
              type: "true_false",
              concept: "iterer",
              statement: "Après une correction, il suffit de retester le cas qui posait problème.",
              answer: false,
              explanation: "Une correction peut casser un autre cas. On relance tout.",
            },
          },
        ],
      },
      {
        id: "verifier",
        title: "Étape 6 : vérifier quand même",
        blocks: [
          {
            type: "text",
            body: "Des tests réussis ne garantissent pas chaque réponse. Une **citation** de ton cours est une **adresse où aller voir**, pas une preuve.",
          },
          {
            type: "check",
            question: {
              id: "projet-assistant-de-revision:v2-c4",
              type: "mcq",
              concept: "verifier",
              prompt: "L'assistant cite « page 12 de ton cours ». Tu…",
              options: [
                { id: "a", text: "vas voir la page 12" },
                { id: "b", text: "lui fais confiance, il a le cours" },
              ],
              answer: "a",
              explanation: "La citation te dit où vérifier. Elle peut être fausse.",
            },
          },
        ],
      },
      {
        id: "mode-emploi",
        title: "Étape 7 : le mode d'emploi",
        blocks: [
          {
            type: "exercise",
            title: "Ton mode d'emploi en 3 lignes",
            prompt: "À quoi sert ton assistant ? Quelles limites as-tu observées ? Quand relancer les tests (nouveau cours, nouveau modèle) ?",
            solution: "Exemple : « Interroge-moi sur le droit des contrats (cours 1 à 6). Se trompe parfois sur les dates : vérifier. Relancer les 5 tests à chaque nouveau chapitre ajouté. »",
            minutes: 5,
          },
        ],
      },
    ],
    summary: [
      "Un assistant sur mesure = **instructions permanentes** + parfois **tes documents**.",
      "Six parties : **rôle, source, déroulement, règles, format, exemple**.",
      "**Cinq cas de test** écrits avant, dont deux pièges.",
      "Une chose à la fois, **tous les cas relancés**, versions notées.",
      "Une citation est **une adresse où vérifier**.",
    ],
    questions: [
      {
        id: "projet-assistant-de-revision:v2-q1",
        type: "multi",
        concept: "prompt-systeme",
        prompt: "Que contient un bon prompt système ?",
        options: [
          { id: "a", text: "Un rôle et une source" },
          { id: "b", text: "Le déroulement attendu" },
          { id: "c", text: "Des règles avec une alternative" },
          { id: "d", text: "Ton mot de passe" },
        ],
        answer: ["a", "b", "c"],
        explanation: "Plus le format et un exemple.",
      },
      {
        id: "projet-assistant-de-revision:v2-q2",
        type: "mcq",
        concept: "cas-test",
        prompt: "Pourquoi écrire le comportement attendu AVANT de tester ?",
        options: [
          { id: "a", text: "Pour juger objectivement, pas au feeling" },
          { id: "b", text: "Pour gagner du temps d'écriture" },
        ],
        answer: "a",
        explanation: "Sinon, on trouve toujours la réponse « pas mal ».",
      },
      {
        id: "projet-assistant-de-revision:v2-q3",
        type: "true_false",
        concept: "iterer",
        statement: "Changer plusieurs choses à la fois aide à comprendre ce qui a marché.",
        answer: false,
        explanation: "Une seule chose à la fois : tu sais ce qui a fait la différence.",
      },
      {
        id: "projet-assistant-de-revision:v2-q4",
        type: "fill_choice",
        concept: "prompt-systeme",
        prompt: "Complète la règle.",
        sentence: "« Ne donne jamais la solution : propose ___ à la place. »",
        options: [
          { id: "a", text: "un indice" },
          { id: "b", text: "rien" },
        ],
        answer: "a",
        explanation: "Un interdit avec une alternative est mieux suivi qu'un simple « non ».",
      },
      {
        id: "projet-assistant-de-revision:v2-q5",
        type: "mcq",
        concept: "verifier",
        prompt: "Tous tes tests passent. Peux-tu arrêter de vérifier ?",
        options: [
          { id: "a", text: "Non : les tests ne couvrent pas tout" },
          { id: "b", text: "Oui" },
        ],
        answer: "a",
        explanation: "Les tests réduisent le risque, ils ne le suppriment pas.",
      },
    ],
    reviewQuestions: [
      {
        id: "projet-assistant-de-revision:v2-r1",
        type: "mcq",
        concept: "cas-test",
        prompt: "Un bon jeu de test contient…",
        options: [
          { id: "a", text: "des cas normaux et des pièges" },
          { id: "b", text: "seulement des cas faciles" },
        ],
        answer: "a",
        explanation: "Les pièges montrent si les règles tiennent.",
      },
    ],
    sources: [PROJECTS, PROMPT_OVERVIEW],
    volatile: { toolIds: ["chatgpt", "claude", "gemini"] },
  },
];
