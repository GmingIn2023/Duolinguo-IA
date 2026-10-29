import type { Answer, Question, TrackId } from "@/content/types";
import { gradeAnswer } from "./grading";
import type { Placement } from "./path";
import { testedChapters } from "./placementRules";
import { seededShuffle } from "./shuffle";

export { TRACK_FOR_GOAL, isGoal, type Goal } from "./goals";
export { NEXT_TRACK, PREVIOUS_TRACK, levelName, placementVerdict, testedChapters, type Verdict } from "./placementRules";

/**
 * One placement test per track: a few questions every track shares, then one question per chapter of the
 * track, in chapter order. A right chapter question validates that chapter. Fixed order, so the learner
 * can go back and change an answer until the end.
 */
export type PlacementQuestion = Question & { chapter?: string };

export const PLACEMENT_LENGTH = 10;
/** Shared questions always sit at this position (0-based): the "two answers" question. */
const SPECIAL_AT = 2;

const common = (q: Question): PlacementQuestion => q;
const ch = (chapter: string, q: Question): PlacementQuestion => ({ ...q, chapter });

const TWO_ANSWERS: PlacementQuestion = {
  id: "c-deux",
  type: "mcq",
  visual: {
    kind: "two-answers",
    ask: "Complète : « Le week-end, j'aime… »",
    answers: ["… lire au soleil.", "… cuisiner pour mes amis."],
    bars: [
      { label: "lire", p: 34 },
      { label: "cuisiner", p: 27 },
      { label: "dormir", p: 18 },
      { label: "courir", p: 9 },
    ],
  },
  prompt: "Même question, deux réponses. Pourquoi ?",
  options: [
    { id: "a", text: "À chaque mot, elle tire au sort parmi les suites probables" },
    { id: "b", text: "Elle s'est trompée la première fois" },
    { id: "c", text: "Elle a appris quelque chose entre les deux" },
  ],
  answer: "a",
  explanation: "Le modèle pioche chaque mot parmi plusieurs suites plausibles. Le tirage change d'une fois à l'autre, donc la réponse aussi.",
};

/** Questions every track shares: everyday AI literacy, neither trivial nor technical. */
export const COMMON_POOL: PlacementQuestion[] = [
  common({
    id: "c-predit",
    type: "mcq",
    prompt: "Au fond, un chatbot comme ChatGPT…",
    options: [
      { id: "a", text: "prédit la suite la plus probable d'un texte" },
      { id: "b", text: "cherche la réponse dans une base de réponses toutes faites" },
      { id: "c", text: "réfléchit exactement comme un humain" },
    ],
    answer: "a",
    explanation: "Un assistant repose sur un modèle de langage : il prédit la suite d'un texte, morceau par morceau.",
  }),
  common({
    id: "c-assurance",
    type: "true_false",
    statement: "Une IA peut affirmer une chose fausse avec beaucoup d'assurance.",
    answer: true,
    explanation: "Le ton assuré ne dit rien de l'exactitude : le modèle produit ce qui sonne plausible.",
  }),
  common({
    id: "c-secret",
    type: "mcq",
    prompt: "Qu'est-ce qu'il vaut mieux ne jamais coller dans un assistant grand public ?",
    options: [
      { id: "a", text: "Un mot de passe ou un numéro de carte" },
      { id: "b", text: "Une recette de cuisine" },
      { id: "c", text: "Un article de presse déjà publié" },
    ],
    answer: "a",
    explanation: "Tes messages partent sur les serveurs de l'éditeur : on n'y met pas de secrets.",
  }),
  common({
    id: "c-mail",
    type: "mcq",
    prompt: "Tu demandes « Écris un mail à mon propriétaire » et la réponse est fade. Qu'est-ce qui l'améliore le plus ?",
    options: [
      { id: "a", text: "Donner le contexte, le but du mail et le ton voulu" },
      { id: "b", text: "Ajouter « fais de ton mieux, s'il te plaît »" },
      { id: "c", text: "Reposer exactement la même demande" },
    ],
    answer: "a",
    explanation: "Ce que tu ne précises pas, le modèle le remplit avec du générique.",
  }),
  common({
    id: "c-actu",
    type: "true_false",
    statement: "Un assistant connaît forcément l'actualité de la semaine dernière.",
    answer: false,
    explanation: "Ses connaissances s'arrêtent à la fin de son entraînement, sauf s'il a accès à une recherche web.",
  }),
  common({
    id: "c-etude",
    type: "mcq",
    prompt: "Une IA te cite une étude très précise. Le bon réflexe ?",
    options: [
      { id: "a", text: "Retrouver l'étude et l'ouvrir" },
      { id: "b", text: "Lui demander si elle est sûre" },
      { id: "c", text: "La croire, la référence a l'air sérieuse" },
    ],
    answer: "a",
    explanation: "Une référence précise peut être inventée. Seule la source ouverte compte.",
  }),
  common({
    id: "c-hallucine",
    type: "fill_choice",
    prompt: "Complète la phrase.",
    sentence: "Quand une IA invente une info fausse mais crédible, on dit qu'elle ___.",
    options: [
      { id: "a", text: "hallucine" },
      { id: "b", text: "bugue" },
      { id: "c", text: "ment exprès" },
    ],
    answer: "a",
    explanation: "On parle d'hallucination : une affirmation inventée, présentée comme un fait. Ce n'est pas un mensonge volontaire.",
  }),
];

/** Two forms per chapter, so a retake is not the same test. Chapter ids come from the curriculum. */
export const CHAPTER_POOL: PlacementQuestion[] = [
  // Bird · Découvrir
  ch("b1", {
    id: "b1a",
    type: "mcq",
    prompt: "Laquelle de ces choses utilise de l'IA ?",
    options: [
      { id: "a", text: "Les vidéos que YouTube te suggère" },
      { id: "b", text: "Une calculatrice de poche" },
      { id: "c", text: "Un interrupteur de lampe" },
    ],
    answer: "a",
    explanation: "Les suggestions sont calculées par un modèle qui apprend de ce que regardent les gens.",
  }),
  ch("b1", {
    id: "b1b",
    type: "true_false",
    statement: "Un chatbot écrit sa réponse morceau par morceau, en choisissant à chaque fois une suite probable.",
    answer: true,
    explanation: "C'est exactement ça : il ne rédige pas un plan d'abord, il enchaîne les morceaux les plus probables.",
  }),
  ch("b2", {
    id: "b2a",
    type: "mcq",
    prompt: "D'où viennent les connaissances d'un chatbot ?",
    options: [
      { id: "a", text: "D'énormément de textes lus pendant son entraînement" },
      { id: "b", text: "D'une encyclopédie qu'il ouvre à chaque question" },
      { id: "c", text: "De ses propres expériences" },
    ],
    answer: "a",
    explanation: "Il a appris des régularités dans une masse de textes. Il ne consulte pas une encyclopédie en direct.",
  }),
  ch("b2", {
    id: "b2b",
    type: "true_false",
    statement: "Si une IA donne un titre de livre et son auteur, c'est que le livre existe.",
    answer: false,
    explanation: "Un titre et un auteur peuvent être inventés de toutes pièces. Il faut vérifier.",
  }),
  ch("b3", {
    id: "b3a",
    type: "mcq",
    prompt: "Quelle demande donnera la réponse la plus utile ?",
    options: [
      { id: "a", text: "« 3 idées de dîner végétarien, prêtes en 20 minutes, pour 2 personnes »" },
      { id: "b", text: "« Idées dîner »" },
      { id: "c", text: "« Aide-moi pour ce soir »" },
    ],
    answer: "a",
    explanation: "Le nombre, le type de plat, le temps et le nombre de personnes : chaque détail rend la réponse plus utile.",
  }),
  ch("b3", {
    id: "b3b",
    type: "mcq",
    prompt: "La réponse ne te convient pas. Le plus efficace ?",
    options: [
      { id: "a", text: "Dire ce qui ne va pas et ce que tu veux à la place" },
      { id: "b", text: "Recommencer une conversation avec la même phrase" },
      { id: "c", text: "Répondre « non »" },
    ],
    answer: "a",
    explanation: "Une consigne précise (« plus court », « sans viande ») corrige la réponse en un seul message.",
  }),
  ch("b4", {
    id: "b4a",
    type: "sort",
    prompt: "Range chaque info.",
    bins: ["Tu peux la partager", "Garde-la pour toi"],
    items: [
      { id: "a", text: "Une recette de cuisine" },
      { id: "b", text: "Le code reçu par SMS de ta banque" },
      { id: "c", text: "Une question sur l'histoire de France" },
      { id: "d", text: "Ton numéro de sécurité sociale" },
    ],
    answer: [0, 1, 0, 1],
    explanation: "Les codes et numéros personnels ne vont jamais dans un chatbot. Une question générale, aucun problème.",
  }),
  ch("b4", {
    id: "b4b",
    type: "mcq",
    prompt: "Pour vérifier une info donnée par une IA, le mieux est de…",
    options: [
      { id: "a", text: "la retrouver dans une source fiable" },
      { id: "b", text: "reposer la question à la même IA" },
      { id: "c", text: "regarder si la réponse est longue et détaillée" },
    ],
    answer: "a",
    explanation: "La même IA peut répéter son erreur. Une source fiable et indépendante, elle, tranche.",
  }),
  ch("b5", {
    id: "b5a",
    type: "mcq",
    prompt: "Tu veux une info récente, avec ses sources. Quel outil choisir ?",
    options: [
      { id: "a", text: "Un assistant qui cherche sur le web et cite ses sources" },
      { id: "b", text: "Un générateur d'images" },
      { id: "c", text: "N'importe quel chatbot, sans accès au web" },
    ],
    answer: "a",
    explanation: "Sans recherche web, un assistant ne connaît pas l'actualité récente.",
  }),
  ch("b5", {
    id: "b5b",
    type: "true_false",
    statement: "Tous les assistants IA se valent : le choix de l'outil ne change rien.",
    answer: false,
    explanation: "Recherche web, images, confidentialité, limites gratuites : les outils diffèrent vraiment.",
  }),

  // Gecko · Pratiquer
  ch("g1", {
    id: "g1a",
    type: "multi",
    prompt: "Qu'est-ce qui rend un brief solide ?",
    options: [
      { id: "a", text: "Le contexte" },
      { id: "b", text: "Le format attendu" },
      { id: "c", text: "Le public visé" },
      { id: "d", text: "Des formules de politesse" },
    ],
    answer: ["a", "b", "c"],
    explanation: "Contexte, format et public changent la réponse. La politesse ne la change presque pas.",
  }),
  ch("g1", {
    id: "g1b",
    type: "mcq",
    prompt: "Donner un exemple du résultat attendu dans ta demande sert surtout à…",
    options: [
      { id: "a", text: "montrer le format et le ton voulus" },
      { id: "b", text: "raccourcir la réponse" },
      { id: "c", text: "empêcher toute erreur" },
    ],
    answer: "a",
    explanation: "Un exemple montre mieux qu'une longue description. Il ne garantit pas l'exactitude.",
  }),
  ch("g2", {
    id: "g2a",
    type: "mcq",
    prompt: "Pour réviser un chapitre avec l'IA, quelle méthode marche le mieux ?",
    options: [
      { id: "a", text: "Lui demander de t'interroger et de corriger tes réponses" },
      { id: "b", text: "Lui faire résumer le chapitre et relire le résumé" },
      { id: "c", text: "Copier ses réponses dans tes fiches" },
    ],
    answer: "a",
    explanation: "Se faire interroger oblige à retrouver l'info de mémoire : c'est ce qui fait retenir.",
  }),
  ch("g2", {
    id: "g2b",
    type: "true_false",
    statement: "Faire rédiger un devoir par l'IA fait autant apprendre que l'écrire soi-même.",
    answer: false,
    explanation: "On apprend en produisant. Utilise l'IA pour expliquer, questionner, relire.",
  }),
  ch("g3", {
    id: "g3a",
    type: "mcq",
    prompt: "Tu fais résumer un rapport de 30 pages. Quel est le principal risque ?",
    options: [
      { id: "a", text: "Que le résumé oublie ou déforme un point important" },
      { id: "b", text: "Que le résumé soit trop court" },
      { id: "c", text: "Qu'il arrive en anglais" },
    ],
    answer: "a",
    explanation: "Un résumé peut sembler complet et lisser un détail clé. Vérifie les points qui comptent pour toi.",
  }),
  ch("g3", {
    id: "g3b",
    type: "mcq",
    prompt: "Pour qu'un mail rédigé avec l'IA te ressemble, le plus utile ?",
    options: [
      { id: "a", text: "Lui donner un ou deux de tes anciens mails en exemple" },
      { id: "b", text: "Lui demander d'être « naturel »" },
      { id: "c", text: "Lui demander un texte plus long" },
    ],
    answer: "a",
    explanation: "Tes propres textes montrent ton style bien mieux qu'un adjectif.",
  }),
  ch("g4", {
    id: "g4a",
    type: "mcq",
    prompt: "Tu veux faire analyser un contrat client confidentiel. Premier réflexe ?",
    options: [
      { id: "a", text: "Vérifier ce que l'outil fait des données, et anonymiser" },
      { id: "b", text: "Coller le contrat tel quel, c'est plus rapide" },
      { id: "c", text: "Demander à l'IA si le contrat est confidentiel" },
    ],
    answer: "a",
    explanation: "Avant de coller un document sensible : les règles de ton organisation, l'outil autorisé, des noms masqués.",
  }),
  ch("g4", {
    id: "g4b",
    type: "multi",
    prompt: "Avant d'envoyer un texte écrit avec l'IA, que relire en priorité ?",
    options: [
      { id: "a", text: "Les chiffres et les noms" },
      { id: "b", text: "Les affirmations factuelles" },
      { id: "c", text: "La police d'écriture" },
      { id: "d", text: "Le nombre de paragraphes" },
    ],
    answer: ["a", "b"],
    explanation: "Les erreurs coûteuses se cachent dans les faits, les chiffres et les noms.",
  }),
  ch("g5", {
    id: "g5a",
    type: "ordering",
    prompt: "Remets dans l'ordre pour mener une tâche longue avec l'IA.",
    items: [
      { id: "a", text: "Découper la tâche en étapes" },
      { id: "b", text: "Traiter une étape à la fois" },
      { id: "c", text: "Vérifier chaque résultat" },
      { id: "d", text: "Assembler le tout" },
    ],
    answer: ["a", "b", "c", "d"],
    explanation: "Petites étapes vérifiées, puis assemblage : chaque erreur reste petite et visible.",
  }),
  ch("g5", {
    id: "g5b",
    type: "mcq",
    prompt: "Un « agent » IA, c'est…",
    options: [
      { id: "a", text: "un modèle qui enchaîne des actions avec des outils pour atteindre un but" },
      { id: "b", text: "un chatbot plus poli que les autres" },
      { id: "c", text: "une personne qui surveille l'IA" },
    ],
    answer: "a",
    explanation: "Un agent agit en boucle : il choisit une action, regarde le résultat, recommence.",
  }),

  // Fox · Construire
  ch("f1", {
    id: "f1a",
    type: "mcq",
    prompt: "La « fenêtre de contexte » d'un modèle, c'est…",
    options: [
      { id: "a", text: "la quantité de texte qu'il peut prendre en compte d'un coup" },
      { id: "b", text: "la date de fin de son entraînement" },
      { id: "c", text: "la taille d'écran recommandée" },
    ],
    answer: "a",
    explanation: "Conversation, documents et réponse doivent tenir dans cette mémoire de travail.",
  }),
  ch("f1", {
    id: "f1b",
    type: "mcq",
    prompt: "Pour extraire des montants de factures de façon reproductible, quelle température ?",
    options: [
      { id: "a", text: "Basse" },
      { id: "b", text: "Élevée" },
      { id: "c", text: "Peu importe" },
    ],
    answer: "a",
    explanation: "Une température basse réduit la part de hasard : utile quand une seule réponse est correcte.",
  }),
  ch("f2", {
    id: "f2a",
    type: "mcq",
    prompt: "Pourquoi tester un prompt sur un jeu d'exemples plutôt que sur un seul essai ?",
    options: [
      { id: "a", text: "Un essai peut réussir par chance, plusieurs cas mesurent vraiment" },
      { id: "b", text: "Ça coûte moins cher" },
      { id: "c", text: "Le modèle apprend de ces exemples" },
    ],
    answer: "a",
    explanation: "Les sorties varient et les cas diffèrent : seule une mesure sur plusieurs cas compare deux prompts.",
  }),
  ch("f2", {
    id: "f2b",
    type: "true_false",
    statement: "Un nouveau prompt qui fait mieux sur 3 exemples choisis à la main est forcément meilleur.",
    answer: false,
    explanation: "Trois cas triés ne représentent pas l'usage réel. Il faut un jeu de test varié, et le garder.",
  }),
  ch("f3", {
    id: "f3a",
    type: "mcq",
    prompt: "Avec l'appel d'outils (function calling), qui exécute la fonction ?",
    options: [
      { id: "a", text: "Ton application : le modèle ne fait que demander l'appel" },
      { id: "b", text: "Le modèle, sur les serveurs du fournisseur" },
      { id: "c", text: "Le navigateur de l'utilisateur" },
    ],
    answer: "a",
    explanation: "Le modèle produit une demande structurée. Ton code l'exécute et renvoie le résultat.",
  }),
  ch("f3", {
    id: "f3b",
    type: "mcq",
    prompt: "API sans état : comment le modèle connaît-il le début de la conversation ?",
    options: [
      { id: "a", text: "Tu renvoies l'historique à chaque requête" },
      { id: "b", text: "Il le retrouve grâce à ta clé d'API" },
      { id: "c", text: "Il s'en souvient pendant 24 heures" },
    ],
    answer: "a",
    explanation: "Sans état : chaque requête contient tout ce que le modèle doit prendre en compte.",
  }),
  ch("f4", {
    id: "f4a",
    type: "mcq",
    prompt: "MCP sert surtout à…",
    options: [
      { id: "a", text: "brancher des outils et des données à un assistant, de façon standard" },
      { id: "b", text: "compresser un modèle" },
      { id: "c", text: "entraîner un modèle sur tes fichiers" },
    ],
    answer: "a",
    explanation: "MCP est un protocole : un serveur expose des outils et des données, l'assistant s'y connecte.",
  }),
  ch("f4", {
    id: "f4b",
    type: "mcq",
    prompt: "Une « injection de prompt indirecte », c'est…",
    options: [
      { id: "a", text: "des instructions cachées dans un contenu que le modèle lit" },
      { id: "b", text: "un prompt trop long" },
      { id: "c", text: "une requête SQL malveillante" },
    ],
    answer: "a",
    explanation: "Une page web ou un document peut contenir des consignes que le modèle suivra comme les tiennes.",
  }),
  ch("f5", {
    id: "f5a",
    type: "mcq",
    prompt: "Le RAG consiste à…",
    options: [
      { id: "a", text: "retrouver les bons passages et les placer dans le prompt avant de répondre" },
      { id: "b", text: "réentraîner le modèle à chaque question" },
      { id: "c", text: "monter la température pour plus d'idées" },
    ],
    answer: "a",
    explanation: "Recherche d'abord, génération ensuite, appuyée sur les passages retrouvés.",
  }),
  ch("f5", {
    id: "f5b",
    type: "mcq",
    prompt: "Pour une recherche par embeddings, deux textes sont proches quand…",
    options: [
      { id: "a", text: "leurs vecteurs sont proches" },
      { id: "b", text: "ils partagent les mêmes mots-clés" },
      { id: "c", text: "ils ont la même longueur" },
    ],
    answer: "a",
    explanation: "Un embedding représente le sens par un vecteur : des vecteurs proches, des sens proches.",
  }),
  ch("f6", {
    id: "f6a",
    type: "mcq",
    prompt: "Le code généré par l'IA passe les tests du premier coup. Tu…",
    options: [
      { id: "a", text: "le relis quand même : cas limites, sécurité, lisibilité" },
      { id: "b", text: "le fusionnes tout de suite" },
      { id: "c", text: "demandes à l'IA s'il est bon" },
    ],
    answer: "a",
    explanation: "Les tests ne couvrent que ce qu'ils testent. Tu restes responsable du code que tu fusionnes.",
  }),
  ch("f6", {
    id: "f6b",
    type: "mcq",
    prompt: "Pour faire corriger un bug par l'IA, le plus utile à lui donner ?",
    options: [
      { id: "a", text: "Le message d'erreur exact, le code concerné et le résultat attendu" },
      { id: "b", text: "« Ça marche pas »" },
      { id: "c", text: "Tout le dépôt, sans explication" },
    ],
    answer: "a",
    explanation: "Erreur, code et attendu : le modèle peut raisonner sur le vrai problème.",
  }),
];

const ALL = [TWO_ANSWERS, ...COMMON_POOL, ...CHAPTER_POOL];
const byId = new Map(ALL.map((q) => [q.id, q]));
export const getPlacementQuestion = (id: string) => byId.get(id);


/** The 10 questions of a track's test, in order. The seed varies the forms between attempts. */
export function placementTest(track: TrackId, seed: string): PlacementQuestion[] {
  const chapters = testedChapters(track);
  const shared = seededShuffle(COMMON_POOL, `${seed}:common`).slice(0, PLACEMENT_LENGTH - chapters.length - 1);
  shared.splice(SPECIAL_AT, 0, TWO_ANSWERS);
  const perChapter = chapters.map((c) => {
    const forms = CHAPTER_POOL.filter((q) => q.chapter === c);
    return seededShuffle(forms, `${seed}:${c}`)[0];
  });
  return [...shared, ...perChapter];
}

export type PlacementAnswer = { id: string; answer: Answer | null };

/**
 * Grades a test on the server: the browser's verdicts are never trusted. Only questions that belong to
 * this track's test count, each once, at most one per chapter and 10 in all.
 */
export function gradePlacement(track: TrackId, answers: unknown): Placement {
  const chapters = new Set(testedChapters(track));
  const sharedMax = PLACEMENT_LENGTH - chapters.size;
  const seen = new Set<string>();
  const seenChapters = new Set<string>();
  let shared = 0;
  let score = 0;
  const validated: string[] = [];
  for (const entry of Array.isArray(answers) ? answers.slice(0, PLACEMENT_LENGTH * 2) : []) {
    if (!entry || typeof entry !== "object" || typeof (entry as PlacementAnswer).id !== "string") continue;
    const { id, answer } = entry as PlacementAnswer;
    const q = byId.get(id);
    if (!q || seen.has(id)) continue;
    if (q.chapter) {
      if (!chapters.has(q.chapter) || seenChapters.has(q.chapter)) continue;
      seenChapters.add(q.chapter);
    } else {
      if (shared >= sharedMax) continue;
      shared++;
    }
    seen.add(id);
    const right = answer !== null && answer !== undefined && safeGrade(q, answer);
    if (right) {
      score++;
      if (q.chapter) validated.push(q.chapter);
    }
  }
  return { score, chapters: testedChapters(track).filter((c) => validated.includes(c)), at: new Date().toISOString() };
}

function safeGrade(q: Question, answer: Answer): boolean {
  try {
    return gradeAnswer(q, answer);
  } catch {
    return false;
  }
}

/** The legacy 1-3 placement column, kept in sync for older rows and the signup trigger. */
export const legacyLevel = (score: number) => (score >= 6 ? 3 : score >= 4 ? 2 : 1);
