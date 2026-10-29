import type { Lesson } from "../../types";

const CNIL_IAG = { title: "Les questions-réponses de la CNIL sur l'utilisation d'un système d'IA générative", publisher: "CNIL", url: "https://www.cnil.fr/fr/les-questions-reponses-de-la-cnil-sur-lutilisation-dun-systeme-dia-generative", verified: "2026-10-13" };
const BEST_PRACTICES = { title: "Prompting best practices", publisher: "Anthropic, documentation Claude", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices", verified: "2026-10-14" };

/** Bird · chapitre 6 : le projet */
export const birdChapter6: Lesson[] = [
  {
    id: "mon-assistant-du-quotidien",
    title: "Projet : ton assistant du quotidien",
    objective: "Fabriquer un prompt à trous que tu réutiliseras pour une tâche qui revient souvent.",
    theme: "projets",
    difficulty: 1,
    format: "projet",
    durationMin: 8,
    xp: 30,
    skills: ["Écrire un prompt réutilisable", "Tester et améliorer un prompt"],
    sections: [
      {
        id: "tache",
        title: "Étape 1 : une tâche qui revient",
        blocks: [
          {
            type: "text",
            body: "Choisis une tâche **que tu fais souvent**, sur du texte, et dont tu sais juger le résultat. Une erreur doit pouvoir **se rattraper** facilement.",
          },
          {
            type: "check",
            question: {
              id: "mon-assistant-du-quotidien:v2-c1",
              type: "sort",
              concept: "bonne-tache",
              prompt: "Bon candidat, ou pas ?",
              bins: ["Bon candidat", "Pas pour l'IA"],
              items: [
                { id: "a", text: "Le menu de la semaine" },
                { id: "b", text: "Décider d'un traitement médical" },
                { id: "c", text: "Répondre aux messages du club de sport" },
                { id: "d", text: "Signer un contrat sans le relire" },
              ],
              answer: [0, 1, 0, 1],
              explanation: "Un menu ou un message se corrigent facilement. Une décision médicale ou un contrat, non.",
            },
          },
        ],
      },
      {
        id: "trous",
        title: "Étape 2 : un prompt à trous",
        blocks: [
          {
            type: "anatomy",
            title: "Le fixe et le variable",
            segments: [
              { text: "Je cuisine pour 2 adultes et 1 enfant de 6 ans, sans porc. ", label: "Fixe", detail: "Ce qui ne change jamais : écrit une fois pour toutes." },
              { text: "Propose 5 dîners pour la semaine du ", label: "Fixe", detail: "La tâche, toujours la même." },
              { text: "[date]", label: "Trou", detail: "Ce que tu remplis à chaque fois." },
              { text: ", avec ce qu'il me reste : ", label: "Fixe" },
              { text: "[ingrédients]", label: "Trou", detail: "Deux à quatre trous, pas plus." },
              { text: ". En liste, avec la liste de courses à la fin.", label: "Fixe", detail: "Le format attendu." },
            ],
            caption: "Touche chaque morceau.",
          },
        ],
      },
      {
        id: "tester",
        title: "Étape 3 : trois essais",
        blocks: [
          {
            type: "flow",
            title: "Teste dans trois conversations neuves",
            nodes: [
              { label: "Un cas normal", detail: "Une semaine ordinaire : le résultat te convient-il ?" },
              { label: "Un cas inhabituel", detail: "Un invité végétarien, un frigo presque vide." },
              { label: "Corriger le prompt", detail: "Tu as dû préciser la même chose deux fois ? **Ajoute-la au prompt.**" },
            ],
          },
          { type: "exercise", title: "Essaie avec ton assistant", prompt: "Écris ton prompt à trous pour ta tâche, puis teste-le sur un cas normal et un cas inhabituel.", solution: "Si tu as dû corriger la même chose deux fois, ajoute cette consigne dans la partie fixe du prompt.", minutes: 5 },
        ],
      },
      {
        id: "verifier",
        title: "Étape 4 : ce que tu vérifies",
        blocks: [
          {
            type: "check",
            question: {
              id: "mon-assistant-du-quotidien:v2-c2",
              type: "multi",
              concept: "verifier",
              prompt: "Dans ton menu de la semaine, que vérifier ?",
              options: [
                { id: "a", text: "Les allergies de la famille sont respectées" },
                { id: "b", text: "Les quantités sont réalistes" },
                { id: "c", text: "La police d'écriture" },
              ],
              answer: ["a", "b"],
              explanation: "Vérifie ce qui coûterait cher si c'était faux : ici, les allergies avant tout.",
            },
          },
        ],
      },
      {
        id: "ranger",
        title: "Étape 5 : le garder",
        blocks: [
          { type: "keypoint", body: "Range ton prompt **dans tes notes**, avec un numéro de version. Tu l'améliores à chaque usage." },
          {
            type: "check",
            question: {
              id: "mon-assistant-du-quotidien:v2-c3",
              type: "true_false",
              concept: "ranger",
              statement: "Mieux vaut garder son prompt dans ses notes que le chercher dans l'historique.",
              answer: true,
              explanation: "Tes notes sont faciles à retrouver et à mettre à jour.",
            },
          },
        ],
      },
    ],
    summary: [
      "Une tâche **fréquente**, dont tu sais juger le résultat, où l'erreur se rattrape.",
      "Un prompt à trous : **le fixe une fois**, deux à quatre **trous** à remplir.",
      "Trois essais, puis **tu corriges le prompt**. Et tu le ranges dans tes notes.",
    ],
    questions: [
      {
        id: "mon-assistant-du-quotidien:v2-q1",
        type: "mcq",
        concept: "bonne-tache",
        prompt: "Laquelle est la meilleure tâche pour un prompt réutilisable ?",
        options: [
          { id: "a", text: "Le résumé de la réunion du lundi, chaque semaine" },
          { id: "b", text: "Une décision importante, une seule fois" },
        ],
        answer: "a",
        explanation: "Une tâche qui revient amortit le temps passé à écrire le prompt.",
      },
      {
        id: "mon-assistant-du-quotidien:v2-q2",
        type: "fill_choice",
        concept: "trous",
        prompt: "Complète la phrase.",
        sentence: "Dans un prompt à trous, ce qui change à chaque fois va dans les ___.",
        options: [
          { id: "a", text: "trous" },
          { id: "b", text: "titres" },
        ],
        answer: "a",
        explanation: "Le reste est fixe et écrit une fois pour toutes.",
      },
      {
        id: "mon-assistant-du-quotidien:v2-q3",
        type: "true_false",
        concept: "tester",
        statement: "Si tu corriges deux fois la même chose, il faut l'ajouter au prompt.",
        answer: true,
        explanation: "C'est comme ça que le prompt s'améliore d'une fois sur l'autre.",
      },
      {
        id: "mon-assistant-du-quotidien:v2-q4",
        type: "mcq",
        concept: "verifier",
        prompt: "Ton prompt prépare un message pour les parents de la classe. Tu vérifies surtout…",
        options: [
          { id: "a", text: "les dates, heures et lieux" },
          { id: "b", text: "le nombre de virgules" },
        ],
        answer: "a",
        explanation: "Une mauvaise date fait déplacer des gens pour rien.",
      },
    ],
    reviewQuestions: [
      {
        id: "mon-assistant-du-quotidien:v2-r1",
        type: "mcq",
        concept: "trous",
        prompt: "Combien de trous dans un bon prompt réutilisable ?",
        options: [
          { id: "a", text: "Deux à quatre" },
          { id: "b", text: "Une vingtaine" },
        ],
        answer: "a",
        explanation: "Peu de trous : le prompt reste rapide à remplir.",
      },
    ],
    sources: [BEST_PRACTICES, CNIL_IAG],
  },
];
