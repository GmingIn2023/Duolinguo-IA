import type { Lesson } from "../../types";

const EFFECTIVE_AGENTS = { title: "Building effective agents", publisher: "Anthropic, Engineering", url: "https://www.anthropic.com/engineering/building-effective-agents", verified: "2026-10-29" };

/** Fox · chapitre 4 : composer plusieurs appels de modèle */
export const foxOrchestrer: Lesson[] = [
  {
    id: "orchestrer-des-agents",
    title: "Composer plusieurs modèles",
    objective: "Choisir le bon motif : routage, parallélisation, orchestrateur et exécutants, évaluateur et optimiseur.",
    theme: "agents",
    difficulty: 4,
    format: "comparatif",
    durationMin: 12,
    xp: 45,
    skills: ["Reconnaître les motifs de composition", "Choisir le motif le plus simple qui marche"],
    sections: [
      {
        id: "pourquoi",
        title: "Un appel ne suffit plus",
        blocks: [
          {
            type: "text",
            body: "Un seul appel bien préparé (bon prompt, exemples, documents utiles) règle **beaucoup** de cas. Quand il ne suffit plus, on compose plusieurs appels. Anthropic décrit une poignée de **motifs** récurrents. Les connaître évite de réinventer, et surtout de sur-construire.",
          },
          {
            type: "check",
            question: {
              id: "orchestrer-des-agents:c1",
              type: "mcq",
              concept: "simple",
              prompt: "Par quoi commencer, d'après les recommandations d'Anthropic ?",
              options: [
                { id: "a", text: "La solution la plus simple qui marche, puis ajouter de la complexité si elle améliore le résultat" },
                { id: "b", text: "Un système multi-agents, pour être prêt à tout" },
              ],
              answer: "a",
              explanation: "Plus de composition, c'est plus de coût, de latence et d'erreurs qui se cumulent.",
            },
          },
        ],
      },
      {
        id: "routage",
        title: "Le routage",
        blocks: [
          {
            type: "definition",
            term: "Routage",
            body: "Un premier appel **classe l'entrée**, puis l'envoie vers un traitement spécialisé : un prompt dédié, un outil, ou un modèle plus petit pour les cas simples.",
          },
          {
            type: "example",
            label: "Support client",
            good: true,
            content: "Classer : remboursement / question technique / autre.\n→ Remboursement : prompt avec la politique de remboursement.\n→ Technique : prompt avec la documentation produit.\n→ Autre : petit modèle, réponse générique et proposition de contact.",
            note: "Chaque branche a un prompt court et précis, au lieu d'un prompt géant qui essaie de tout couvrir.",
          },
        ],
      },
      {
        id: "parallele",
        title: "La parallélisation",
        blocks: [
          {
            type: "text",
            body: "Deux variantes. **Découper** : des sous-tâches indépendantes tournent en parallèle (un appel vérifie la conformité, un autre rédige). **Voter** : la même tâche tourne plusieurs fois, et le code agrège les réponses, utile quand une seule erreur coûte cher.",
          },
          {
            type: "check",
            question: {
              id: "orchestrer-des-agents:c2",
              type: "mcq",
              concept: "parallele",
              prompt: "Tu veux repérer du code vulnérable avec plus de fiabilité. Quel motif ?",
              options: [
                { id: "a", text: "Voter : plusieurs analyses du même code, puis agrégation" },
                { id: "b", text: "Routage vers un seul prompt" },
              ],
              answer: "a",
              explanation: "Plusieurs passages indépendants réduisent le risque de rater un problème.",
            },
          },
        ],
      },
      {
        id: "orchestrateur",
        title: "Orchestrateur et exécutants",
        blocks: [
          {
            type: "flow",
            nodes: [
              { label: "Orchestrateur", detail: "Un modèle lit la tâche et décide **à la volée** des sous-tâches nécessaires." },
              { label: "Exécutants", detail: "D'autres appels traitent chaque sous-tâche, chacun avec un contexte réduit." },
              { label: "Synthèse", detail: "L'orchestrateur assemble les résultats." },
            ],
          },
          {
            type: "text",
            body: "La différence avec la parallélisation : les sous-tâches **ne sont pas connues à l'avance**. Exemple : une modification de code qui touche un nombre de fichiers impossible à prévoir.",
          },
        ],
      },
      {
        id: "evaluateur",
        title: "Évaluateur et optimiseur",
        blocks: [
          {
            type: "text",
            body: "Un appel produit, un autre **évalue selon des critères écrits** et renvoie un retour, en boucle. Utile quand les critères sont clairs et qu'un retour améliore vraiment le résultat : une traduction nuancée, une recherche à affiner.",
          },
          {
            type: "mistake",
            title: "Une boucle sans fin, ou sans critère",
            why: "Sans critère précis, l'évaluateur approuve tout ou critique tout. Sans limite, la boucle tourne et la facture monte.",
            fix: "Écris les critères, fixe un nombre maximal de tours, et garde la meilleure version si la limite tombe.",
          },
        ],
      },
      {
        id: "choisir",
        title: "Choisir le motif",
        blocks: [
          {
            type: "check",
            question: {
              id: "orchestrer-des-agents:c3",
              type: "match",
              concept: "choisir",
              prompt: "Associe chaque situation à son motif.",
              left: [
                { id: "1", text: "Des demandes de types très différents" },
                { id: "2", text: "Un nombre de sous-tâches imprévisible" },
                { id: "3", text: "Un texte à améliorer selon des critères précis" },
              ],
              right: [
                { id: "routage", text: "Routage" },
                { id: "orchestrateur", text: "Orchestrateur et exécutants" },
                { id: "evaluateur", text: "Évaluateur et optimiseur" },
              ],
              answer: ["routage", "orchestrateur", "evaluateur"],
              explanation: "Le motif découle de la structure de la tâche.",
            },
          },
          { type: "keypoint", body: "Ces motifs sont des briques : combine-les **seulement** si une mesure montre que le résultat s'améliore." },
        ],
      },
    ],
    summary: [
      "Commence par **un appel bien préparé**. Compose seulement si ça améliore le résultat.",
      "**Routage** : classer, puis traitement spécialisé.",
      "**Parallélisation** : découper en sous-tâches indépendantes, ou voter.",
      "**Orchestrateur** : sous-tâches décidées à la volée, puis synthèse.",
      "**Évaluateur** : critères écrits, boucle bornée.",
    ],
    questions: [
      {
        id: "orchestrer-des-agents:q1",
        type: "mcq",
        concept: "parallele",
        prompt: "Quelle est la différence entre « découper » et « orchestrateur » ?",
        options: [
          { id: "a", text: "Découper : sous-tâches connues d'avance. Orchestrateur : décidées à la volée" },
          { id: "b", text: "Aucune" },
        ],
        answer: "a",
        explanation: "C'est la prévisibilité des sous-tâches qui sépare les deux.",
      },
      {
        id: "orchestrer-des-agents:q2",
        type: "true_false",
        concept: "simple",
        statement: "Un système à plusieurs agents est presque toujours plus fiable qu'un seul appel.",
        answer: false,
        explanation: "Chaque étape ajoute coût, latence et risques d'erreurs cumulées.",
      },
      {
        id: "orchestrer-des-agents:q3",
        type: "mcq",
        concept: "routage",
        prompt: "Pourquoi router les questions simples vers un petit modèle ?",
        options: [
          { id: "a", text: "Pour réduire le coût et la latence sans perdre en qualité sur ces cas" },
          { id: "b", text: "Parce que les petits modèles sont plus exacts" },
        ],
        answer: "a",
        explanation: "Le grand modèle reste réservé aux cas qui en ont besoin.",
      },
      {
        id: "orchestrer-des-agents:q4",
        type: "multi",
        concept: "evaluateur",
        prompt: "Qu'est-ce qui rend une boucle évaluateur-optimiseur fiable ?",
        options: [
          { id: "a", text: "Des critères écrits" },
          { id: "b", text: "Un nombre maximal de tours" },
          { id: "c", text: "Laisser tourner jusqu'à la perfection" },
        ],
        answer: ["a", "b"],
        explanation: "Sans critères ni limite, la boucle n'a ni direction ni fin.",
      },
      {
        id: "orchestrer-des-agents:q5",
        type: "ordering",
        concept: "choisir",
        prompt: "Du plus simple au plus complexe :",
        items: [
          { id: "a", text: "Un appel avec bon prompt et documents" },
          { id: "b", text: "Un enchaînement fixe de prompts" },
          { id: "c", text: "Un orchestrateur qui délègue à la volée" },
        ],
        answer: ["a", "b", "c"],
        explanation: "On ne monte d'un cran que si le cran précédent ne suffit pas.",
      },
      {
        id: "orchestrer-des-agents:q6",
        type: "fill_choice",
        concept: "parallele",
        prompt: "Complète la phrase.",
        sentence: "Faire tourner la même tâche plusieurs fois puis agréger s'appelle le ___.",
        options: [
          { id: "a", text: "vote" },
          { id: "b", text: "routage" },
        ],
        answer: "a",
        explanation: "Une variante de la parallélisation.",
      },
    ],
    reviewQuestions: [
      {
        id: "orchestrer-des-agents:r1",
        type: "mcq",
        concept: "choisir",
        prompt: "Traduire un contrat en respectant un glossaire, avec relecture selon des critères. Motif ?",
        options: [
          { id: "a", text: "Évaluateur et optimiseur" },
          { id: "b", text: "Routage" },
        ],
        answer: "a",
        explanation: "Critères clairs, retour utile : la boucle évaluateur-optimiseur s'y prête.",
      },
    ],
    sources: [EFFECTIVE_AGENTS],
  },
];
