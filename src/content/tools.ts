import type { ToolFact, ToolId } from "./types";

/**
 * Time-sensitive facts about AI tools. This is the ONLY place tool-specific claims live:
 * lessons reference tools by id. Run `npm run content:check` (also weekly in CI) to list
 * entries whose `lastVerified` is older than `reviewEveryDays`.
 */
export const TOOLS: Record<ToolId, ToolFact> = {
  chatgpt: {
    id: "chatgpt",
    name: "ChatGPT",
    maker: "OpenAI (États-Unis)",
    summary: "L'assistant conversationnel le plus utilisé. Polyvalent : rédaction, analyse de fichiers, images, voix et recherche web selon l'offre.",
    goodFor: ["Rédiger et reformuler", "Brainstormer des idées", "Analyser un fichier ou un tableau"],
    watchOut: [
      "Vérifie dans les paramètres si tes conversations servent à entraîner les modèles.",
      "Les fonctions disponibles changent entre l'offre gratuite et les offres payantes.",
    ],
    lastVerified: "2026-10-04",
    reviewEveryDays: 7,
    sources: ["https://openai.com/chatgpt", "https://help.openai.com"],
  },
  claude: {
    id: "claude",
    name: "Claude",
    maker: "Anthropic (États-Unis)",
    summary: "Assistant apprécié pour la rédaction nuancée, l'analyse de longs documents et la programmation.",
    goodFor: ["Travailler sur des documents longs", "Rédaction soignée et nuancée", "Écrire ou relire du code"],
    watchOut: [
      "Les limites d'utilisation dépendent de l'offre choisie.",
      "Vérifie les réglages de confidentialité de ton compte avant d'y mettre des données sensibles.",
    ],
    lastVerified: "2026-10-04",
    reviewEveryDays: 7,
    sources: ["https://www.anthropic.com/claude", "https://support.anthropic.com"],
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    maker: "Google (États-Unis)",
    summary: "L'assistant de Google, intégré à Gmail, Docs, Android et à la recherche Google.",
    goodFor: ["Tâches dans Gmail, Docs ou Drive", "Comprendre des images ou des vidéos", "Partir d'une recherche Google"],
    watchOut: [
      "Regarde les paramètres « Activité dans les applications Gemini » pour savoir ce qui est conservé.",
      "Les intégrations disponibles varient selon le pays et le type de compte.",
    ],
    lastVerified: "2026-10-04",
    reviewEveryDays: 7,
    sources: ["https://gemini.google.com", "https://support.google.com/gemini"],
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    maker: "DeepSeek (Chine)",
    summary: "Modèles performants en raisonnement, maths et code, dont certains sont publiés en libre téléchargement (open-weight).",
    goodFor: ["Raisonnement, maths et code", "Utiliser un modèle téléchargeable sur sa propre machine"],
    watchOut: [
      "Selon sa politique de confidentialité, les données de l'application sont stockées en Chine.",
      "Plusieurs autorités européennes de protection des données ont émis des réserves en 2025 : évite d'y mettre des informations sensibles.",
    ],
    lastVerified: "2026-10-04",
    reviewEveryDays: 7,
    sources: ["https://www.deepseek.com", "https://chat.deepseek.com"],
  },
  perplexity: {
    id: "perplexity",
    name: "Perplexity",
    maker: "Perplexity AI (États-Unis)",
    summary: "Un « moteur de réponse » : il cherche sur le web et cite ses sources sous forme de liens numérotés.",
    goodFor: ["Chercher une info récente", "Obtenir des liens vers les sources", "Comparer plusieurs points de vue"],
    watchOut: [
      "Une source citée peut être peu fiable ou mal résumée : ouvre toujours les liens.",
      "Le résumé peut mélanger des informations venant de sources différentes.",
    ],
    lastVerified: "2026-10-04",
    reviewEveryDays: 7,
    sources: ["https://www.perplexity.ai"],
  },
};

export function staleTools(now = new Date()) {
  return Object.values(TOOLS).filter(
    (t) => (now.getTime() - Date.parse(t.lastVerified)) / 86_400_000 > t.reviewEveryDays,
  );
}
