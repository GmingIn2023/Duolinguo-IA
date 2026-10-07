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
    summary: "L'un des assistants conversationnels les plus utilisés. Polyvalent : rédaction, analyse de fichiers, images, voix et recherche web selon l'offre.",
    goodFor: ["Rédiger et reformuler", "Brainstormer des idées", "Analyser un fichier ou un tableau"],
    watchOut: [
      "Par défaut, tes conversations peuvent servir à entraîner les modèles : désactive « Améliorer le modèle pour tout le monde » dans Paramètres › Contrôle des données.",
      "Même après ce réglage, donner un pouce haut ou bas peut transmettre la conversation entière pour améliorer les modèles.",
      "Les fonctions disponibles changent entre l'offre gratuite et les offres payantes.",
    ],
    lastVerified: "2026-10-04",
    reviewEveryDays: 7,
    sources: ["https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt", "https://openai.com/policies/how-your-data-is-used-to-improve-model-performance/"],
  },
  claude: {
    id: "claude",
    name: "Claude",
    maker: "Anthropic (États-Unis)",
    summary: "Assistant apprécié pour la rédaction nuancée, l'analyse de longs documents et la programmation.",
    goodFor: ["Travailler sur des documents longs", "Rédaction soignée et nuancée", "Écrire ou relire du code"],
    watchOut: [
      "Les limites d'utilisation dépendent de l'offre choisie.",
      "Le réglage « Model Improvement » (Paramètres › Confidentialité) décide si tes conversations servent à améliorer Claude. Les conversations Incognito n'y servent jamais.",
    ],
    lastVerified: "2026-10-04",
    reviewEveryDays: 7,
    sources: ["https://privacy.claude.com/en/articles/10023580-is-my-data-used-for-model-training"],
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    maker: "Google (États-Unis)",
    summary: "L'assistant de Google, intégré à Gmail, Docs, Android et à la recherche Google.",
    goodFor: ["Tâches dans Gmail, Docs ou Drive", "Comprendre des images ou des vidéos", "Partir d'une recherche Google"],
    watchOut: [
      "Avec le réglage « Keep Activity » activé, tes conversations sont conservées et une partie est relue par des humains : Google demande de ne pas y mettre d'informations confidentielles.",
      "Les intégrations disponibles varient selon le pays et le type de compte.",
    ],
    lastVerified: "2026-10-04",
    reviewEveryDays: 7,
    sources: ["https://support.google.com/gemini/answer/13594961"],
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    maker: "DeepSeek (Chine)",
    summary: "Modèles performants en raisonnement, maths et code, dont certains sont publiés en libre téléchargement (open-weight).",
    goodFor: ["Raisonnement, maths et code", "Utiliser un modèle téléchargeable sur sa propre machine"],
    watchOut: [
      "Selon sa politique de confidentialité, les données sont collectées et stockées en Chine, et peuvent servir à entraîner ses modèles (refus possible).",
      "En janvier 2025, l'autorité italienne de protection des données a ordonné le blocage de l'application : évite d'y mettre des informations sensibles.",
    ],
    lastVerified: "2026-10-04",
    reviewEveryDays: 7,
    sources: ["https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html", "https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/10097450"],
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
    sources: ["https://www.perplexity.ai/help-center/en/articles/10352895-how-does-perplexity-work"],
  },
};

export function staleTools(now = new Date()) {
  return Object.values(TOOLS).filter(
    (t) => (now.getTime() - Date.parse(t.lastVerified)) / 86_400_000 > t.reviewEveryDays,
  );
}
