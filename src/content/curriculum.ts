import type { Difficulty, MapNode, Theme, ThemeId, Track, TrackId } from "./types";

export const THEMES: Record<ThemeId, Theme> = {
  comprendre: { id: "comprendre", name: "Comprendre l'IA", short: "Comprendre", pitch: "Ce qu'est un modèle, comment il écrit, ce qu'il sait et ignore." },
  prompt: { id: "prompt", name: "Écrire des prompts", short: "Prompts", pitch: "Du premier message utile aux prompts structurés." },
  confiance: { id: "confiance", name: "Vérifier et protéger", short: "Confiance", pitch: "Vérifier, relire, évaluer, protéger ses données." },
  outils: { id: "outils", name: "Utiliser les outils", short: "Outils", pitch: "Choisir un assistant et s'en servir pour étudier ou travailler." },
  workflows: { id: "workflows", name: "Workflows", short: "Workflows", pitch: "Découper une tâche, enchaîner, automatiser." },
  agents: { id: "agents", name: "Agents IA", short: "Agents", pitch: "Des modèles qui agissent en boucle, avec des garde-fous." },
  dev: { id: "dev", name: "Coder avec l'IA", short: "Code", pitch: "Spécifier, générer, relire et déboguer du code." },
  api: { id: "api", name: "API et MCP", short: "API · MCP", pitch: "Appeler un modèle par programme et lui brancher des outils." },
  rag: { id: "rag", name: "RAG et données", short: "RAG", pitch: "Faire répondre un modèle à partir de tes documents." },
  projets: { id: "projets", name: "Projets", short: "Projets", pitch: "Construire quelque chose de complet, de bout en bout." },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: "Découverte",
  2: "Bases",
  3: "Intermédiaire",
  4: "Avancé",
  5: "Expert",
};

const lesson = (id: string, unit: string, col: number, lane: number, kind: MapNode["kind"] = "lesson"): MapNode => ({
  id,
  kind,
  lessonId: id,
  unit,
  col,
  lane,
});

const checkpoint = (id: string, title: string, unit: string, col: number, lane: number, covers: string[]): MapNode => ({
  id,
  kind: "checkpoint",
  title,
  covers,
  unit,
  col,
  lane,
  after: covers,
});

/**
 * Each track is a board: columns run left to right, lanes fan out where the path forks.
 * Every track is closed under prerequisites (checked by content.test.ts), so the shared
 * foundations open each board and the placement test lets a learner step over what they know.
 */
export const TRACKS: Record<TrackId, Track> = {
  bird: {
    id: "bird",
    animal: "Bird",
    name: "Découvrir",
    audience: "Débutant complet",
    pitch: "Comprendre ce qu'est l'IA, lui parler clairement, garder le contrôle de tes données.",
    units: [
      { id: "b-comprendre", name: "Comprendre", blurb: "Ce qu'est une IA et comment un chatbot écrit." },
      { id: "b-parler", name: "Parler et vérifier", blurb: "Deux chemins : mieux demander, rester prudent." },
      { id: "b-outils", name: "Les outils", blurb: "Choisir le bon assistant pour la bonne tâche." },
      { id: "b-projet", name: "Ton projet", blurb: "Un assistant utile dans ta vraie vie." },
    ],
    nodes: [
      lesson("ia-cest-quoi", "b-comprendre", 0, 0),
      lesson("comment-ecrit-un-chatbot", "b-comprendre", 1, 0),
      lesson("entrainement-et-limites", "b-comprendre", 2, -1),
      lesson("hallucinations", "b-comprendre", 2, 1),
      checkpoint("bird-cp-1", "Bilan : comprendre", "b-comprendre", 3, 0, ["ia-cest-quoi", "comment-ecrit-un-chatbot", "entrainement-et-limites", "hallucinations"]),
      lesson("premier-prompt", "b-parler", 4, -1),
      lesson("ameliorer-une-reponse", "b-parler", 5, -1),
      lesson("vie-privee", "b-parler", 4, 1),
      lesson("verifier-sources", "b-parler", 5, 1),
      checkpoint("bird-cp-2", "Bilan : parler et vérifier", "b-parler", 6, 0, ["premier-prompt", "ameliorer-une-reponse", "vie-privee", "verifier-sources"]),
      lesson("panorama-outils", "b-outils", 7, 0),
      lesson("choisir-le-bon-outil", "b-outils", 8, -1),
      lesson("decouper-une-tache", "b-outils", 8, 1),
      lesson("mon-assistant-du-quotidien", "b-projet", 9, 0, "finale"),
    ],
  },
  gecko: {
    id: "gecko",
    animal: "Gecko",
    name: "Pratiquer",
    audience: "Études et travail",
    pitch: "Faire de l'IA un vrai outil : briefer, vérifier, étudier, rédiger, automatiser.",
    units: [
      { id: "g-bases", name: "Bases communes", blurb: "Comment le modèle écrit, ce qu'il sait, quand il invente." },
      { id: "g-prompt", name: "Prompts", blurb: "Du brief complet aux prompts structurés." },
      { id: "g-usages", name: "Étudier ou travailler", blurb: "Deux branches : choisis la tienne, ou fais les deux." },
      { id: "g-confiance", name: "Vérifier et relire", blurb: "Ne rien signer que tu n'as pas contrôlé." },
      { id: "g-workflows", name: "Outils et workflows", blurb: "Choisir, découper, automatiser, déléguer à un agent." },
      { id: "g-projet", name: "Ton projet", blurb: "Un assistant sur mesure, cadré et testé." },
    ],
    nodes: [
      lesson("comment-ecrit-un-chatbot", "g-bases", 0, 0),
      lesson("entrainement-et-limites", "g-bases", 1, -1),
      lesson("hallucinations", "g-bases", 1, 1),
      lesson("premier-prompt", "g-bases", 2, 0),
      checkpoint("gecko-cp-1", "Bilan : bases", "g-bases", 3, 0, ["comment-ecrit-un-chatbot", "entrainement-et-limites", "hallucinations", "premier-prompt"]),
      lesson("prompt-de-travail", "g-prompt", 4, -1),
      lesson("ameliorer-une-reponse", "g-prompt", 4, 1),
      lesson("prompts-avances", "g-prompt", 5, 0),
      lesson("tuteur-pas-copieur", "g-usages", 6, -2),
      lesson("reviser-avec-ia", "g-usages", 7, -2),
      lesson("rediger-resumer", "g-usages", 6, 0),
      lesson("vie-privee", "g-usages", 6, 2),
      lesson("donnees-confidentielles", "g-usages", 7, 2),
      lesson("verifier-sources", "g-confiance", 8, -1),
      lesson("relire-ia", "g-confiance", 8, 1),
      checkpoint("gecko-cp-2", "Bilan : prompts et confiance", "g-confiance", 9, 0, ["prompt-de-travail", "ameliorer-une-reponse", "prompts-avances", "verifier-sources", "relire-ia"]),
      lesson("panorama-outils", "g-workflows", 10, -1),
      lesson("choisir-le-bon-outil", "g-workflows", 11, -1),
      lesson("decouper-une-tache", "g-workflows", 10, 1),
      lesson("automatiser-sans-coder", "g-workflows", 11, 1),
      lesson("agents-cest-quoi", "g-workflows", 11, 2),
      lesson("cadrer-un-projet-ia", "g-projet", 12, 0),
      lesson("projet-assistant-de-revision", "g-projet", 13, 0, "finale"),
    ],
  },
  fox: {
    id: "fox",
    animal: "Fox",
    name: "Construire",
    audience: "Technique et avancé",
    pitch: "API, agents, RAG, MCP, code : comprendre la mécanique et concevoir de vrais systèmes.",
    units: [
      { id: "f-bases", name: "Bases communes", blurb: "Le socle, que le test de niveau peut te faire passer." },
      { id: "f-modeles", name: "Modèles et évaluation", blurb: "Choisir un modèle, structurer un prompt, mesurer." },
      { id: "f-api", name: "API", blurb: "Appeler un modèle par programme, sorties structurées, outils." },
      { id: "f-branches", name: "Trois branches", blurb: "Agents et MCP, RAG, code : dans l'ordre que tu veux." },
      { id: "f-projet", name: "Ton projet", blurb: "Un assistant documentaire conçu de bout en bout." },
    ],
    nodes: [
      lesson("comment-ecrit-un-chatbot", "f-bases", 0, 0),
      lesson("entrainement-et-limites", "f-bases", 1, -1),
      lesson("hallucinations", "f-bases", 1, 1),
      lesson("premier-prompt", "f-bases", 2, 0),
      lesson("prompt-de-travail", "f-bases", 3, -1),
      lesson("ameliorer-une-reponse", "f-bases", 3, 1),
      lesson("relire-ia", "f-bases", 2, 2),
      checkpoint("fox-cp-1", "Bilan : bases", "f-bases", 4, 0, ["comment-ecrit-un-chatbot", "entrainement-et-limites", "hallucinations", "prompt-de-travail", "ameliorer-une-reponse", "relire-ia"]),
      lesson("modeles-et-raisonnement", "f-modeles", 5, -2),
      lesson("prompts-avances", "f-modeles", 5, 0),
      lesson("decouper-une-tache", "f-modeles", 5, 2),
      lesson("evaluer-un-modele", "f-modeles", 6, 0),
      lesson("api-cest-quoi", "f-api", 7, -1),
      lesson("sorties-structurees-et-outils", "f-api", 8, -1),
      lesson("cadrer-un-projet-ia", "f-api", 7, 1),
      checkpoint("fox-cp-2", "Bilan : modèles et API", "f-api", 9, 0, ["modeles-et-raisonnement", "prompts-avances", "evaluer-un-modele", "api-cest-quoi", "sorties-structurees-et-outils"]),
      lesson("agents-cest-quoi", "f-branches", 10, -2),
      lesson("concevoir-un-agent", "f-branches", 11, -2),
      lesson("mcp", "f-branches", 12, -2),
      lesson("embeddings-et-recherche", "f-branches", 10, 0),
      lesson("rag", "f-branches", 11, 0),
      lesson("coder-avec-ia", "f-branches", 10, 2),
      lesson("deboguer-et-relire-code", "f-branches", 11, 2),
      lesson("automatiser-sans-coder", "f-branches", 12, 2),
      lesson("projet-bot-documentaire", "f-projet", 13, 0, "finale"),
    ],
  },
};

export const TRACK_IDS = Object.keys(TRACKS) as TrackId[];

export const isTrackId = (v: unknown): v is TrackId => typeof v === "string" && v in TRACKS;
export const isThemeId = (v: unknown): v is ThemeId => typeof v === "string" && v in THEMES;
