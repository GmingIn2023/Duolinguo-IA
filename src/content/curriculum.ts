import type { Difficulty, Theme, ThemeId, Track, TrackId } from "./types";

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

/**
 * Three independent tracks. A lesson belongs to exactly one track (checked by content.test.ts) and a
 * track is a straight path: chapters in order, lessons in order inside a chapter. The placement test of
 * a track validates whole chapters; the last chapter is the track's project.
 */
export const TRACKS: Record<TrackId, Track> = {
  bird: {
    id: "bird",
    animal: "Bird",
    name: "Découvrir",
    audience: "Débutant complet",
    pitch: "Comprendre ce qu'est l'IA, lui parler clairement, garder le contrôle.",
    chapters: [
      { id: "b1", name: "C'est quoi, l'IA ?", blurb: "Ce qu'elle fait, et comment elle écrit.", lessons: ["ia-cest-quoi", "ia-au-quotidien", "comment-ecrit-un-chatbot"] },
      { id: "b2", name: "Ce qu'elle sait, ce qu'elle invente", blurb: "Ses connaissances et ses erreurs.", lessons: ["entrainement-et-limites", "hallucinations", "images-et-deepfakes"] },
      { id: "b3", name: "Bien lui parler", blurb: "Demander clairement, puis corriger.", lessons: ["premier-prompt", "ameliorer-une-reponse", "montrer-un-exemple"] },
      { id: "b4", name: "Rester prudent", blurb: "Tes données et les sources.", lessons: ["vie-privee", "verifier-sources"] },
      { id: "b5", name: "Les bons outils", blurb: "Quel assistant pour quoi.", lessons: ["panorama-outils", "choisir-le-bon-outil", "parler-et-montrer"] },
      { id: "b6", name: "Ton assistant", blurb: "L'IA dans ta vraie vie.", lessons: ["mon-assistant-du-quotidien"], project: true },
    ],
  },
  gecko: {
    id: "gecko",
    animal: "Gecko",
    name: "Pratiquer",
    audience: "Études et travail",
    pitch: "Faire de l'IA un vrai outil pour étudier et travailler.",
    chapters: [
      { id: "g1", name: "Le bon brief", blurb: "Contexte, objectif, format.", lessons: ["prompt-de-travail"] },
      { id: "g2", name: "Étudier", blurb: "Un tuteur, pas un copieur.", lessons: ["tuteur-pas-copieur", "reviser-avec-ia"] },
      { id: "g3", name: "Écrire et résumer", blurb: "Rédiger mieux, plus vite.", lessons: ["rediger-resumer"] },
      { id: "g4", name: "Vérifier et protéger", blurb: "Relire, garder tes données.", lessons: ["relire-ia", "donnees-confidentielles"] },
      { id: "g5", name: "Organiser et automatiser", blurb: "Découper, enchaîner, déléguer.", lessons: ["decouper-une-tache", "automatiser-sans-coder"] },
      { id: "g6", name: "Ton projet", blurb: "Un assistant de révision sur mesure.", lessons: ["projet-assistant-de-revision"], project: true },
    ],
  },
  fox: {
    id: "fox",
    animal: "Fox",
    name: "Construire",
    audience: "Technique et avancé",
    pitch: "API, agents, RAG, MCP, code : concevoir de vrais systèmes.",
    chapters: [
      { id: "f1", name: "Sous le capot", blurb: "Modèles, raisonnement, prompts structurés.", lessons: ["modeles-et-raisonnement", "prompts-avances"] },
      { id: "f2", name: "Mesurer", blurb: "Évaluer avant de croire.", lessons: ["evaluer-un-modele"] },
      { id: "f3", name: "API", blurb: "Appeler un modèle par programme.", lessons: ["api-cest-quoi", "sorties-structurees-et-outils", "cadrer-un-projet-ia"] },
      { id: "f4", name: "Agents et MCP", blurb: "Des modèles qui agissent, avec des garde-fous.", lessons: ["agents-cest-quoi", "concevoir-un-agent", "mcp"] },
      { id: "f5", name: "RAG", blurb: "Répondre à partir de tes documents.", lessons: ["embeddings-et-recherche", "rag"] },
      { id: "f6", name: "Coder avec l'IA", blurb: "Générer, relire, déboguer.", lessons: ["coder-avec-ia", "deboguer-et-relire-code"] },
      { id: "f7", name: "Ton projet", blurb: "Un assistant documentaire de bout en bout.", lessons: ["projet-bot-documentaire"], project: true },
    ],
  },
};

export const TRACK_IDS = Object.keys(TRACKS) as TrackId[];

export const isTrackId = (v: unknown): v is TrackId => typeof v === "string" && v in TRACKS;
export const isThemeId = (v: unknown): v is ThemeId => typeof v === "string" && v in THEMES;
