import type { Lesson } from "../../types";

const CONTEXTUAL_RETRIEVAL = { title: "Introducing Contextual Retrieval", publisher: "Anthropic, blog d'ingénierie", url: "https://www.anthropic.com/engineering/contextual-retrieval", verified: "2026-10-14" };
const LEWIS = { title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (Lewis et al., 2020)", publisher: "arXiv", url: "https://arxiv.org/abs/2005.11401", verified: "2026-10-14" };
const REDUCE_HALLUCINATIONS = { title: "Reduce hallucinations (Use direct quotes for factual grounding)", publisher: "Anthropic, documentation Claude", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations", verified: "2026-10-14" };

/** Fox · chapitre 5 : mesurer un RAG, étage par étage */
export const foxEvaluerRag: Lesson[] = [
  {
    id: "evaluer-un-rag",
    title: "Évaluer un RAG",
    objective: "Mesurer séparément la recherche et la génération, et repérer quel étage casse.",
    theme: "rag",
    difficulty: 4,
    format: "labo",
    durationMin: 12,
    xp: 45,
    skills: ["Mesurer le rappel de la recherche", "Mesurer la fidélité des réponses", "Construire un jeu de test RAG"],
    sections: [
      {
        id: "deux-etages",
        title: "Deux étages, deux mesures",
        blocks: [
          {
            type: "text",
            body: "Un RAG peut échouer à deux endroits : la **recherche** ne ramène pas le bon passage, ou la **génération** l'utilise mal. Une seule note globale mélange les deux et ne dit pas quoi réparer. On mesure donc **chaque étage séparément**.",
          },
          {
            type: "flow",
            nodes: [
              { label: "Question", detail: "Tirée de l'usage réel, avec le ou les passages qui contiennent la réponse." },
              { label: "Recherche", detail: "Le bon passage est-il dans les k premiers résultats ?" },
              { label: "Génération", detail: "La réponse est-elle juste, et appuyée sur les passages fournis ?" },
            ],
          },
        ],
      },
      {
        id: "jeu",
        title: "Le jeu de test",
        blocks: [
          {
            type: "text",
            body: "Chaque cas contient une **question réelle**, l'**identifiant du passage attendu** et la **réponse attendue**. Ajoute des questions **sans réponse dans la base** : le bon comportement est alors de le dire, pas d'inventer.",
          },
          {
            type: "code",
            lang: "json",
            code: "[\n  { \"question\": \"Plafond d'un repas en déplacement ?\", \"passage\": \"frais-2026#repas\", \"attendu\": \"25 € par repas\" },\n  { \"question\": \"Combien de jours de télétravail ?\", \"passage\": \"teletravail#jours\", \"attendu\": \"3 jours par semaine\" },\n  { \"question\": \"Le parking est-il remboursé ?\", \"passage\": null, \"attendu\": \"L'information n'est pas dans les documents\" }\n]",
            caption: "Trois cas, dont un sans réponse dans la base (valeurs fictives).",
          },
        ],
      },
      {
        id: "rappel",
        title: "Mesurer la recherche",
        blocks: [
          {
            type: "definition",
            term: "Rappel à k (recall@k)",
            body: "La proportion de questions pour lesquelles le passage attendu figure dans les **k premiers** résultats. Anthropic mesure par exemple ses gains de recherche sur les 20 premiers morceaux récupérés.",
          },
          {
            type: "check",
            question: {
              id: "evaluer-un-rag:c1",
              type: "mcq",
              concept: "rappel",
              prompt: "Sur 50 questions, le bon passage est dans le top 5 pour 41 d'entre elles. Le rappel à 5 vaut…",
              options: [
                { id: "a", text: "82 %" },
                { id: "b", text: "41 %" },
                { id: "c", text: "5 %" },
              ],
              answer: "a",
              explanation: "41 sur 50, soit 0,82. Les 9 autres questions ne pouvaient pas recevoir une bonne réponse fondée sur le bon passage.",
            },
          },
        ],
      },
      {
        id: "fidelite",
        title: "Mesurer la génération",
        blocks: [
          {
            type: "text",
            body: "Deux critères. **Exactitude** : la réponse correspond-elle à l'attendu ? **Fidélité** : chaque affirmation est-elle appuyée par un passage fourni ? Une réponse peut être juste par chance, en puisant dans les connaissances du modèle. Elle reste alors **non fidèle**, et fragile.",
          },
          {
            type: "spectrum",
            title: "Comment noter la fidélité",
            poles: ["Rapide", "Fiable"],
            items: [
              { label: "Vérifier que les citations existent dans les passages", position: 15, detail: "Du code suffit : la citation est-elle une sous-chaîne d'un passage ?" },
              { label: "Un juge LLM qui confronte chaque phrase aux passages", position: 55, detail: "Utile à grande échelle, à calibrer sur un échantillon noté par des humains." },
              { label: "Relecture humaine", position: 95 },
            ],
            caption: "Touche chaque méthode.",
          },
        ],
      },
      {
        id: "diagnostic",
        title: "Lire les résultats",
        blocks: [
          {
            type: "check",
            question: {
              id: "evaluer-un-rag:c2",
              type: "match",
              concept: "diagnostic",
              prompt: "Associe chaque constat à l'étage à réparer.",
              left: [
                { id: "1", text: "Rappel bas, réponses fausses" },
                { id: "2", text: "Rappel haut, réponses fausses" },
                { id: "3", text: "Réponse inventée sur une question sans réponse dans la base" },
              ],
              right: [
                { id: "recherche", text: "La recherche (découpage, index, requête)" },
                { id: "generation", text: "La génération (prompt, ordre des passages)" },
                { id: "abstention", text: "La consigne « dis-le si l'information manque »" },
              ],
              answer: ["recherche", "generation", "abstention"],
              explanation: "Chaque mesure pointe vers un étage précis : c'est tout l'intérêt de les séparer.",
            },
          },
        ],
      },
      {
        id: "regression",
        title: "Rejouer à chaque changement",
        blocks: [
          {
            type: "text",
            body: "Nouveau découpage, nouveau modèle d'embedding, nouveau prompt : **rejoue tout le jeu**. Un gain de rappel peut s'accompagner d'une baisse de fidélité. Garde un tableau par version : rappel à k, exactitude, fidélité, taux d'abstention correcte.",
          },
          {
            type: "mistake",
            title: "Évaluer seulement sur des questions faciles",
            why: "On écrit les questions en regardant les documents : elles reprennent leurs mots, et la recherche paraît excellente.",
            fix: "Pioche dans des **questions réelles** (anonymisées), reformulées comme les gens les posent, avec des cas sans réponse.",
          },
          { type: "keypoint", body: "Un RAG s'améliore **étage par étage**, mesures à l'appui." },
        ],
      },
    ],
    summary: [
      "Deux étages, deux mesures : **recherche** et **génération**.",
      "Jeu de test : question réelle, **passage attendu**, réponse attendue, et des cas **sans réponse**.",
      "**Rappel à k** pour la recherche ; **exactitude et fidélité** pour la génération.",
      "Rejoue **tout le jeu** à chaque changement, avec un tableau par version.",
    ],
    questions: [
      {
        id: "evaluer-un-rag:q1",
        type: "mcq",
        concept: "deux-etages",
        prompt: "Pourquoi évaluer recherche et génération séparément ?",
        options: [
          { id: "a", text: "Pour savoir quel étage réparer" },
          { id: "b", text: "Pour doubler le nombre de chiffres" },
        ],
        answer: "a",
        explanation: "Une note globale ne dit pas d'où vient l'erreur.",
      },
      {
        id: "evaluer-un-rag:q2",
        type: "true_false",
        concept: "fidelite",
        statement: "Une réponse exacte est forcément fidèle aux passages fournis.",
        answer: false,
        explanation: "Elle peut venir des connaissances du modèle, sans appui dans les passages.",
      },
      {
        id: "evaluer-un-rag:q3",
        type: "fill_choice",
        concept: "rappel",
        prompt: "Complète la phrase.",
        sentence: "La part des questions dont le bon passage est dans les k premiers résultats s'appelle le ___ à k.",
        options: [
          { id: "a", text: "rappel" },
          { id: "b", text: "coût" },
        ],
        answer: "a",
        explanation: "Recall@k en anglais.",
      },
      {
        id: "evaluer-un-rag:q4",
        type: "multi",
        concept: "jeu",
        prompt: "Que contient un bon cas de test RAG ?",
        options: [
          { id: "a", text: "Une question réelle" },
          { id: "b", text: "L'identifiant du passage attendu" },
          { id: "c", text: "La réponse attendue" },
          { id: "d", text: "Le prix du modèle" },
        ],
        answer: ["a", "b", "c"],
        explanation: "Sans passage attendu, impossible de mesurer la recherche.",
      },
      {
        id: "evaluer-un-rag:q5",
        type: "mcq",
        concept: "diagnostic",
        prompt: "Rappel à 10 de 95 %, mais beaucoup de réponses fausses. Où chercher ?",
        options: [
          { id: "a", text: "Dans la génération : prompt, ordre et nombre de passages" },
          { id: "b", text: "Dans l'index vectoriel" },
        ],
        answer: "a",
        explanation: "Les bons passages arrivent : c'est leur usage qui pèche.",
      },
      {
        id: "evaluer-un-rag:q6",
        type: "true_false",
        concept: "jeu",
        statement: "Il faut inclure des questions dont la réponse n'est pas dans la base.",
        answer: true,
        explanation: "Elles vérifient que le système sait dire « je ne sais pas ».",
      },
    ],
    reviewQuestions: [
      {
        id: "evaluer-un-rag:r1",
        type: "mcq",
        concept: "fidelite",
        prompt: "La façon la plus rapide de contrôler une citation ?",
        options: [
          { id: "a", text: "Vérifier par du code qu'elle figure mot pour mot dans un passage" },
          { id: "b", text: "Demander au modèle si elle est exacte" },
        ],
        answer: "a",
        explanation: "Une sous-chaîne se vérifie sans modèle, sans ambiguïté.",
      },
    ],
    sources: [CONTEXTUAL_RETRIEVAL, LEWIS, REDUCE_HALLUCINATIONS],
  },
];
