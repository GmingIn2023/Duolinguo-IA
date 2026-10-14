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
    summary: "Assistant généraliste d'OpenAI. Dès l'offre gratuite : recherche web, envoi de fichiers et d'images, analyse de données et création d'images, avec des limites d'usage propres à chaque fonction.",
    goodFor: ["Rédiger et reformuler", "Chercher une info à jour sur le web", "Analyser un fichier ou un tableau"],
    watchOut: [
      "Sur les offres personnelles, tes conversations peuvent servir à entraîner les modèles : désactive « Improve the model for everyone » dans Settings › Data controls (le libellé peut être traduit dans ton interface).",
      "Même après ce réglage, donner un pouce haut ou bas peut transmettre la conversation entière pour entraîner les modèles.",
      "Un « Temporary chat » n'apparaît pas dans l'historique et ne sert pas à l'entraînement tant qu'il reste temporaire.",
      "Fichiers, images, voix et analyse de données ont des limites d'usage séparées, plus strictes sur l'offre gratuite que sur les offres payantes.",
    ],
    lastVerified: "2026-10-13",
    reviewEveryDays: 7,
    sources: [
      "https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt",
      "https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance",
      "https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq",
    ],
  },
  claude: {
    id: "claude",
    name: "Claude",
    maker: "Anthropic (États-Unis)",
    summary: "Assistant généraliste d'Anthropic. L'offre gratuite inclut la recherche web, la création de fichiers et l'exécution de code ; les offres payantes ajoutent surtout plus d'usage, d'autres modèles, les projets et Claude Code.",
    goodFor: ["Rédiger et reformuler", "Travailler à partir de fichiers joints", "Écrire ou relire du code"],
    watchOut: [
      "Les limites d'utilisation dépendent de l'offre choisie, et les fichiers joints comptent dans cet usage.",
      "Le réglage « Model Improvement » (paramètres de confidentialité) décide si tes conversations servent à améliorer Claude. Les conversations Incognito n'y servent pas.",
      "Donner un pouce haut ou bas enregistre la conversation entière, qui peut alors servir à l'entraînement ; une conversation signalée pour un contrôle de sécurité peut aussi être utilisée.",
    ],
    lastVerified: "2026-10-13",
    reviewEveryDays: 7,
    sources: [
      "https://privacy.claude.com/en/articles/10023580-is-my-data-used-for-model-training",
      "https://claude.com/pricing",
      "https://support.claude.com/en/articles/8325606-what-is-claude-pro",
    ],
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    maker: "Google (États-Unis)",
    summary: "L'assistant de Google. Il peut se connecter à d'autres services Google (Gmail ou Agenda, par exemple), s'appuyer sur la recherche Google, et existe en application mobile.",
    goodFor: ["Agir dans tes services Google connectés (résumer des e-mails, par exemple)", "Analyser des documents, photos ou vidéos que tu envoies", "Partir d'une recherche Google"],
    watchOut: [
      "Avec le réglage « Keep Activity » activé, tes conversations sont conservées et une partie est relue par des humains : Google demande de ne pas y mettre d'informations confidentielles.",
      "Même avec ce réglage désactivé, les conversations restent conservées quelques jours ; celles qui ont été relues par des humains le sont beaucoup plus longtemps.",
      "Les applications connectées disponibles varient selon le pays, la langue, l'appareil et le type de compte.",
    ],
    lastVerified: "2026-10-13",
    reviewEveryDays: 7,
    sources: [
      "https://support.google.com/gemini/answer/13594961",
      "https://support.google.com/gemini/answer/13695044",
      "https://support.google.com/gemini/answer/14903178",
    ],
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    maker: "DeepSeek (Chine)",
    summary: "Éditeur chinois d'un assistant en ligne et de modèles dont certains (la série R1) sont publiés avec leurs poids en libre téléchargement (open-weight), sous licence MIT.",
    goodFor: ["Raisonnement, maths et code (les points que l'éditeur met en avant)", "Utiliser un modèle téléchargeable sur sa propre machine"],
    watchOut: [
      "Selon sa politique de confidentialité, les données du service en ligne sont collectées et stockées en Chine, et peuvent servir à entraîner ses modèles (droit de refus prévu, à exercer par e-mail auprès de l'éditeur).",
      "Le 30 janvier 2025, l'autorité italienne de protection des données a ordonné en urgence la limitation du traitement des données des utilisateurs italiens : évite de mettre des informations sensibles dans le service en ligne.",
    ],
    lastVerified: "2026-10-13",
    reviewEveryDays: 7,
    sources: [
      "https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html",
      "https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/10097450",
      "https://github.com/deepseek-ai/DeepSeek-R1",
    ],
  },
  perplexity: {
    id: "perplexity",
    name: "Perplexity",
    maker: "Perplexity AI (États-Unis)",
    summary: "Un « moteur de réponse » : il cherche sur le web et rédige une réponse accompagnée de citations numérotées qui renvoient vers les sources.",
    goodFor: ["Chercher une info récente", "Obtenir des liens vers les sources", "Avoir un point de départ sourcé pour une recherche"],
    watchOut: [
      "Une source citée peut être peu fiable ou mal résumée : l'éditeur lui-même invite à revérifier les sources. Ouvre toujours les liens.",
      "Le résumé peut mélanger des informations venant de sources différentes.",
    ],
    lastVerified: "2026-10-13",
    reviewEveryDays: 7,
    sources: [
      "https://www.perplexity.ai/help-center/en/articles/10352895-how-does-perplexity-work",
      "https://www.perplexity.ai/help-center/en/articles/10354917-what-is-an-answer-engine-and-how-does-perplexity-work-as-one",
    ],
  },
};

export function staleTools(now = new Date()) {
  return Object.values(TOOLS).filter(
    (t) => (now.getTime() - Date.parse(t.lastVerified)) / 86_400_000 > t.reviewEveryDays,
  );
}
