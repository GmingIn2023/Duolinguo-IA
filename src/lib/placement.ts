import type { Answer, Question, TrackId } from "@/content/types";
import { gradeAnswer } from "./grading";
import { seededShuffle } from "./shuffle";

export type Goal = "discover" | "practice" | "build";
export const TRACK_FOR_GOAL: Record<Goal, TrackId> = { discover: "bird", practice: "gecko", build: "fox" };
export const isGoal = (v: unknown): v is Goal => v === "discover" || v === "practice" || v === "build";

/** Bands follow lesson difficulty: 1 Découverte … 5 Expert. */
export type Band = 1 | 2 | 3 | 4 | 5;
export type PlacementQuestion = Question & { band: Band };

export const PLACEMENT_LENGTH = 10;
const START_BAND: Band = 2;

const q = (band: Band, question: Question): PlacementQuestion => ({ ...question, band });

/** Several questions per band so two learners (or two attempts) do not get the same test. */
export const PLACEMENT_POOL: PlacementQuestion[] = [
  q(1, {
    id: "p1a",
    type: "mcq",
    prompt: "D'après toi, un chatbot comme ChatGPT ou Claude…",
    options: [
      { id: "a", text: "prédit la suite la plus probable d'un texte" },
      { id: "b", text: "cherche la réponse dans une base de données de réponses" },
      { id: "c", text: "réfléchit exactement comme un humain" },
    ],
    answer: "a",
    explanation: "Le cœur d'un assistant est un modèle de langage qui prédit la suite d'un texte, morceau par morceau.",
  }),
  q(1, {
    id: "p1b",
    type: "true_false",
    statement: "Une IA peut affirmer une information fausse avec beaucoup d'assurance.",
    answer: true,
    explanation: "Le ton assuré ne dit rien de l'exactitude : le modèle produit ce qui est plausible.",
  }),
  q(1, {
    id: "p1c",
    type: "mcq",
    prompt: "Qu'est-ce qu'il vaut mieux ne jamais coller dans un assistant IA grand public ?",
    options: [
      { id: "a", text: "Un mot de passe ou un numéro de carte bancaire" },
      { id: "b", text: "Une recette de cuisine" },
      { id: "c", text: "Un article de presse déjà publié" },
    ],
    answer: "a",
    explanation: "Tes messages partent sur les serveurs de l'éditeur : on n'y met pas de secrets.",
  }),
  q(2, {
    id: "p2a",
    type: "mcq",
    prompt: "Quand on dit qu'une IA « hallucine », ça veut dire…",
    options: [
      { id: "a", text: "qu'elle invente une information fausse mais plausible" },
      { id: "b", text: "qu'elle génère des images étranges" },
      { id: "c", text: "qu'elle plante et ne répond plus" },
    ],
    answer: "a",
    explanation: "Une hallucination est une affirmation inventée, présentée comme un fait.",
  }),
  q(2, {
    id: "p2b",
    type: "mcq",
    prompt: "Tu demandes « Écris un mail à mon propriétaire » et la réponse est banale. Quel ajout l'améliore le plus ?",
    options: [
      { id: "a", text: "Le contexte, l'objectif du mail et le ton voulu" },
      { id: "b", text: "« S'il te plaît, fais de ton mieux »" },
      { id: "c", text: "Reposer exactement la même demande" },
    ],
    answer: "a",
    explanation: "Tout ce que tu ne précises pas est rempli par du générique : contexte, objectif et format changent la réponse.",
  }),
  q(2, {
    id: "p2c",
    type: "written",
    prompt: "En une phrase : pourquoi un assistant peut-il donner deux réponses différentes à la même question ?",
    placeholder: "Parce que…",
    criteria: [{ id: "hasard", label: "Une part de hasard dans le choix de la suite", anyOf: ["hasard", "aléa", "alea", "probab", "tirage", "températ", "temperat", "random", "pioche"] }],
    minCriteria: 1,
    modelAnswer: "Parce que le modèle choisit chaque morceau de texte parmi plusieurs suites probables, avec une part de hasard.",
    explanation: "Le modèle tire sa suite parmi plusieurs options plausibles : le tirage change d'une fois à l'autre.",
  }),
  q(2, {
    id: "p2d",
    type: "true_false",
    statement: "Un modèle de langage connaît forcément les événements de la semaine dernière.",
    answer: false,
    explanation: "Ses connaissances s'arrêtent à la fin de son entraînement, sauf si l'outil lui donne accès à une recherche web.",
  }),
  q(3, {
    id: "p3a",
    type: "mcq",
    prompt: "La « fenêtre de contexte » d'un modèle, c'est…",
    options: [
      { id: "a", text: "la quantité de texte qu'il peut prendre en compte à un instant donné" },
      { id: "b", text: "la date jusqu'à laquelle il a été entraîné" },
      { id: "c", text: "la taille de l'écran recommandée" },
    ],
    answer: "a",
    explanation: "C'est sa mémoire de travail : conversation, documents et réponse doivent y tenir.",
  }),
  q(3, {
    id: "p3b",
    type: "mcq",
    prompt: "Faire du « few-shot » dans un prompt, c'est…",
    options: [
      { id: "a", text: "donner quelques exemples du résultat attendu" },
      { id: "b", text: "poser la question en très peu de mots" },
      { id: "c", text: "limiter le nombre de réponses par jour" },
    ],
    answer: "a",
    explanation: "Quelques exemples montrent le format et le ton mieux qu'une longue description.",
  }),
  q(3, {
    id: "p3c",
    type: "multi",
    prompt: "Une IA te cite une étude à l'appui de sa réponse. Quels réflexes sont utiles ?",
    options: [
      { id: "a", text: "Chercher l'étude et l'ouvrir" },
      { id: "b", text: "Recouper l'affirmation avec une source indépendante" },
      { id: "c", text: "Lui demander si elle est sûre, et la croire si elle dit oui" },
      { id: "d", text: "Faire confiance si la référence a l'air précise" },
    ],
    answer: ["a", "b"],
    explanation: "Une référence précise peut être inventée, et le modèle confirme volontiers ses propres erreurs : seule la source ouverte compte.",
  }),
  q(3, {
    id: "p3d",
    type: "written",
    prompt: "Explique en une phrase ce qu'est un « token ».",
    placeholder: "Un token, c'est…",
    criteria: [
      { id: "morceau", label: "Une unité ou un morceau", anyOf: ["morceau", "unité", "unite", "fragment", "bout", "partie", "découp", "decoup", "sous-mot"] },
      { id: "texte", label: "…de texte ou de mot", anyOf: ["texte", "mot", "caract", "syllab"] },
    ],
    minCriteria: 2,
    modelAnswer: "Un token est l'unité de texte que manipule le modèle : un mot ou un morceau de mot.",
    explanation: "Le modèle ne lit pas des mots entiers mais des tokens, des morceaux de texte.",
  }),
  q(4, {
    id: "p4a",
    type: "mcq",
    prompt: "Avec l'appel d'outils (function calling), qui exécute réellement la fonction ?",
    options: [
      { id: "a", text: "Ton application : le modèle ne fait que demander l'appel avec ses arguments" },
      { id: "b", text: "Le modèle, directement sur les serveurs du fournisseur, pour n'importe quelle fonction" },
      { id: "c", text: "Le navigateur de l'utilisateur, automatiquement" },
    ],
    answer: "a",
    explanation: "Le modèle produit une demande d'appel structurée ; c'est ton code qui l'exécute et renvoie le résultat.",
  }),
  q(4, {
    id: "p4b",
    type: "mcq",
    prompt: "Le RAG (retrieval-augmented generation) consiste à…",
    options: [
      { id: "a", text: "retrouver des passages pertinents et les placer dans le prompt avant de générer" },
      { id: "b", text: "réentraîner le modèle sur tes documents à chaque question" },
      { id: "c", text: "augmenter la température pour obtenir plus d'idées" },
    ],
    answer: "a",
    explanation: "On récupère d'abord les bons passages, puis le modèle répond en s'appuyant dessus.",
  }),
  q(4, {
    id: "p4c",
    type: "mcq",
    prompt: "Tu appelles une API de messages sans état. Comment le modèle connaît-il le début de la conversation ?",
    options: [
      { id: "a", text: "Tu renvoies l'historique des messages à chaque requête" },
      { id: "b", text: "Il le retrouve grâce à ta clé d'API" },
      { id: "c", text: "Il s'en souvient tout seul pendant 24 heures" },
    ],
    answer: "a",
    explanation: "Sans état : chaque requête doit contenir tout ce que le modèle doit prendre en compte.",
  }),
  q(4, {
    id: "p4d",
    type: "mcq",
    prompt: "Tu veux extraire des montants de factures de façon aussi reproductible que possible. Quel réglage ?",
    options: [
      { id: "a", text: "Une température basse" },
      { id: "b", text: "Une température élevée" },
      { id: "c", text: "Aucune limite de tokens en sortie" },
    ],
    answer: "a",
    explanation: "Une température basse réduit la part de hasard : utile quand une seule réponse est correcte.",
  }),
  q(5, {
    id: "p5a",
    type: "mcq",
    prompt: "Dans une recherche par embeddings, deux textes sont jugés proches quand…",
    options: [
      { id: "a", text: "leurs vecteurs sont proches (par exemple une similarité cosinus élevée)" },
      { id: "b", text: "ils partagent exactement les mêmes mots-clés" },
      { id: "c", text: "ils ont la même longueur" },
    ],
    answer: "a",
    explanation: "Un embedding représente le sens par un vecteur ; la proximité des vecteurs mesure la proximité de sens.",
  }),
  q(5, {
    id: "p5b",
    type: "mcq",
    prompt: "Une « injection de prompt indirecte », c'est…",
    options: [
      { id: "a", text: "des instructions cachées dans un contenu que le modèle lit (page web, document, résultat d'outil)" },
      { id: "b", text: "un utilisateur qui écrit un prompt trop long" },
      { id: "c", text: "une requête SQL malveillante envoyée à la base vectorielle" },
    ],
    answer: "a",
    explanation: "Le modèle ne distingue pas bien données et instructions : un contenu lu peut détourner son comportement.",
  }),
  q(5, {
    id: "p5c",
    type: "mcq",
    prompt: "Ton système RAG répond faux alors que le bon passage a bien été retrouvé. Où chercher d'abord ?",
    options: [
      { id: "a", text: "Dans l'étape de génération : prompt, consignes d'ancrage, ordre des passages" },
      { id: "b", text: "Dans le découpage des documents" },
      { id: "c", text: "Dans le modèle d'embedding" },
    ],
    answer: "a",
    explanation: "Si la recherche a fait son travail, l'erreur vient de l'usage du passage : on évalue recherche et génération séparément.",
  }),
  q(5, {
    id: "p5d",
    type: "written",
    prompt: "Pourquoi évaluer un prompt sur un jeu de test plutôt que sur un seul essai ? Réponds en une ou deux phrases.",
    placeholder: "Parce qu'un seul essai…",
    criteria: [
      { id: "variabilite", label: "Les sorties varient ou les cas diffèrent", anyOf: ["hasard", "varia", "aléa", "alea", "chance", "plusieurs cas", "cas limite", "différents cas", "differents cas", "représentat", "representat", "généralis", "generalis"] },
      { id: "mesure", label: "On veut mesurer ou comparer de façon fiable", anyOf: ["mesur", "compar", "régress", "regress", "fiab", "reprodu", "score", "taux", "objecti"] },
    ],
    minCriteria: 1,
    modelAnswer: "Un seul essai peut réussir par chance : un jeu de test couvre des cas variés et permet de mesurer et comparer les versions du prompt sans régression.",
    explanation: "Les sorties varient et les cas diffèrent : seule une mesure sur plusieurs cas dit si un prompt est vraiment meilleur.",
  }),
];

const poolById = new Map(PLACEMENT_POOL.map((p) => [p.id, p]));
export const getPlacementQuestion = (id: string) => poolById.get(id);

const clampBand = (n: number) => Math.min(5, Math.max(1, n)) as Band;

export type PlacementStep = { id: string; correct: boolean };

/**
 * Adaptive staircase: a right answer raises the next question's band, a wrong one (or "je ne sais pas") lowers it.
 * Returns the next question, or null when the test is over.
 */
export function nextPlacementQuestion(history: PlacementStep[], seed: string): PlacementQuestion | null {
  if (history.length >= PLACEMENT_LENGTH) return null;
  const last = history[history.length - 1];
  const lastBand = last ? poolById.get(last.id)!.band : START_BAND;
  const target = last ? clampBand(lastBand + (last.correct ? 1 : -1)) : START_BAND;
  const used = new Set(history.map((h) => h.id));
  const free = seededShuffle(PLACEMENT_POOL.filter((p) => !used.has(p.id)), seed);
  // nearest band with an unused question; on a tie prefer the easier one
  free.sort((a, b) => Math.abs(a.band - target) - Math.abs(b.band - target) || a.band - b.band);
  return free[0] ?? null;
}

/**
 * Level out of 10. Each answer is a piece of evidence: a right answer at band b says "at least b",
 * a wrong one says "below b". The level is twice the average evidence.
 */
export function placementLevel(history: PlacementStep[]): number {
  // no right answer at all is no evidence of any level, however hard the missed questions were
  if (!history.some((h) => h.correct)) return 0;
  const evidence = history.map((h) => {
    const band = poolById.get(h.id)?.band ?? 1;
    return h.correct ? band : band - 1;
  });
  const level = Math.round((evidence.reduce((a, b) => a + b, 0) / evidence.length) * 2);
  const allRight = history.length >= PLACEMENT_LENGTH && history.every((h) => h.correct);
  return allRight ? 10 : Math.min(9, Math.max(0, level));
}

/** Re-grades submitted answers on the server: the client's own verdicts are never trusted. */
export function gradePlacement(answers: { id: string; answer: Answer | null }[]): PlacementStep[] {
  if (!Array.isArray(answers)) return [];
  const seen = new Set<string>();
  return answers.slice(0, PLACEMENT_LENGTH).flatMap((entry) => {
    // forged payloads: skip anything that is not an { id, answer } object
    if (!entry || typeof entry !== "object" || typeof entry.id !== "string") return [];
    const { id, answer } = entry;
    const question = poolById.get(id);
    if (!question || seen.has(id)) return [];
    seen.add(id);
    return [{ id, correct: answer !== null && gradeAnswer(question, answer) }];
  });
}

export const levelName = (level10: number) =>
  level10 >= 9 ? "Expert" : level10 >= 7 ? "Avancé" : level10 >= 5 ? "Intermédiaire" : level10 >= 3 ? "Bases acquises" : "Tout début";

/** The legacy 1-3 placement column, kept in sync for older rows and the signup trigger. */
export const legacyLevel = (level10: number) => (level10 >= 6 ? 3 : level10 >= 4 ? 2 : 1);
export const fromLegacyLevel = (placementLevel: number) => (placementLevel >= 3 ? 6 : placementLevel === 2 ? 4 : 2);
