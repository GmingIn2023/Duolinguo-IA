import type { Lesson } from "../../types";

const RGPD = { title: "Règlement général sur la protection des données (UE) 2016/679, articles 4 (définitions) et 9 (catégories particulières)", publisher: "EUR-Lex, Journal officiel de l'Union européenne", url: "https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32016R0679", verified: "2026-10-14" };
const ANTHROPIC_TRAINING = { title: "Is my data used for model training?", publisher: "Anthropic (centre d'aide)", url: "https://privacy.claude.com/en/articles/10023580-is-my-data-used-for-model-training", verified: "2026-10-14" };
const GEMINI_PRIVACY = { title: "Gemini Apps Privacy Hub : activité et relecture humaine", publisher: "Google (aide Gemini)", url: "https://support.google.com/gemini/answer/13594961", verified: "2026-10-14" };
const LATERAL_READING = { title: "Teaching Lateral Reading", publisher: "Digital Inquiry Group, Civic Online Reasoning", url: "https://cor.inquirygroup.org/curriculum/collections/teaching-lateral-reading/", verified: "2026-10-14" };
const REDUCE_HALLUCINATIONS = { title: "Reduce hallucinations", publisher: "Anthropic (documentation)", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations", verified: "2026-10-14" };

/** Bird · chapitre 4 : « Rester prudent » */
export const birdChapter4: Lesson[] = [
  {
    id: "vie-privee",
    title: "Ce que tu lui confies",
    objective: "Savoir ce qui ne se colle jamais dans un chatbot, et comment demander de l'aide sans tout dévoiler.",
    theme: "confiance",
    difficulty: 1,
    format: "atelier",
    durationMin: 5,
    xp: 15,
    skills: ["Repérer une donnée sensible", "Anonymiser avant d'envoyer"],
    sections: [
      {
        id: "ou-part",
        title: "Où part ton message",
        blocks: [
          {
            type: "text",
            body: "Ton message part sur **les serveurs de l'entreprise** qui fait le chatbot. Il peut y être **gardé**, parfois relu, parfois utilisé pour entraîner l'IA, selon l'outil et tes réglages.",
          },
          {
            type: "check",
            question: {
              id: "vie-privee:v2-c1",
              type: "true_false",
              concept: "serveurs",
              statement: "Ce que j'écris à un chatbot reste uniquement sur mon téléphone.",
              answer: false,
              explanation: "Le message est traité sur les serveurs de l'éditeur. Écris en sachant qu'il sort de chez toi.",
            },
          },
        ],
      },
      {
        id: "jamais",
        title: "Ce qui ne part jamais",
        blocks: [
          {
            type: "check",
            question: {
              id: "vie-privee:v2-c2",
              type: "sort",
              concept: "sensible",
              prompt: "Tu peux l'écrire, ou jamais ?",
              bins: ["Ça va", "Jamais"],
              items: [
                { id: "a", text: "Ton mot de passe" },
                { id: "b", text: "« Comment cuire des pâtes al dente ? »" },
                { id: "c", text: "Ton numéro de carte bancaire" },
                { id: "d", text: "Le diagnostic médical de ton voisin, avec son nom" },
                { id: "e", text: "Un texte que tu as écrit, sans nom" },
              ],
              answer: [1, 0, 1, 1, 0],
              explanation: "Codes, banque, santé, infos privées d'autres personnes : jamais. Une question générale : aucun souci.",
            },
          },
        ],
      },
      {
        id: "anonymiser",
        title: "Garder l'aide, retirer les noms",
        blocks: [
          {
            type: "compare",
            columns: ["Avant", "Après"],
            rows: [
              { a: "Ma collègue Sophie Martin a oublié la réunion avec le client Dupont SA.", b: "Une collègue a oublié une réunion avec un client." },
            ],
          },
          {
            type: "text",
            body: "Remplace les **noms**, retire les **numéros**, garde **la situation**. L'aide que tu reçois reste la même.",
          },
        ],
      },
      {
        id: "reglages",
        title: "Les réglages à chercher",
        blocks: [
          {
            type: "layers",
            title: "Dans les paramètres de ton outil",
            layers: [
              { label: "Entraînement", detail: "Tu peux souvent refuser que tes conversations servent à entraîner l'IA." },
              { label: "Historique", detail: "Combien de temps les conversations sont gardées, et comment les supprimer." },
              { label: "Mode temporaire", detail: "Une conversation qui n'est pas gardée dans ton historique." },
            ],
            caption: "Les noms changent selon l'outil. Touche chaque ligne.",
          },
          {
            type: "check",
            question: {
              id: "vie-privee:v2-c3",
              type: "mcq",
              concept: "anonymiser",
              prompt: "Tu veux de l'aide pour répondre au mail de ton propriétaire. Le mieux ?",
              options: [
                { id: "a", text: "Coller le mail en retirant noms et adresse" },
                { id: "b", text: "Coller le mail tel quel, avec ton adresse" },
              ],
              answer: "a",
              explanation: "L'IA n'a pas besoin des noms pour t'aider à répondre.",
            },
          },
        ],
      },
    ],
    summary: [
      "Ton message part sur **les serveurs de l'éditeur**.",
      "Jamais : **mots de passe, banque, santé, infos privées d'autrui**.",
      "**Retire les noms** avant d'envoyer : l'aide reste la même.",
    ],
    questions: [
      {
        id: "vie-privee:v2-q1",
        type: "multi",
        concept: "sensible",
        prompt: "Qu'est-ce qui ne doit jamais aller dans un chatbot grand public ?",
        options: [
          { id: "a", text: "Le code reçu par SMS de ta banque" },
          { id: "b", text: "Une question sur la météo" },
          { id: "c", text: "Ton numéro de passeport" },
        ],
        answer: ["a", "c"],
        explanation: "Les codes et les numéros d'identité restent avec toi.",
      },
      {
        id: "vie-privee:v2-q2",
        type: "true_false",
        concept: "serveurs",
        statement: "Selon les réglages, une conversation peut servir à entraîner l'IA.",
        answer: true,
        explanation: "D'où l'intérêt de regarder les réglages de ton outil.",
      },
      {
        id: "vie-privee:v2-q3",
        type: "mcq",
        concept: "anonymiser",
        prompt: "« Mon fils Lucas, 9 ans, à l'école Jean-Moulin, a des difficultés en lecture. » Version prudente ?",
        options: [
          { id: "a", text: "« Mon enfant de 9 ans a des difficultés en lecture. »" },
          { id: "b", text: "La même chose, c'est plus précis" },
        ],
        answer: "a",
        explanation: "Le prénom et l'école n'aident pas l'IA. L'âge et la difficulté, si.",
      },
      {
        id: "vie-privee:v2-q4",
        type: "fill_choice",
        concept: "reglages",
        prompt: "Complète la phrase.",
        sentence: "Un mode ___ évite de garder la conversation dans ton historique.",
        options: [
          { id: "a", text: "temporaire" },
          { id: "b", text: "sombre" },
        ],
        answer: "a",
        explanation: "Le nom exact change selon l'outil : cherche-le dans les paramètres.",
      },
    ],
    reviewQuestions: [
      {
        id: "vie-privee:v2-r1",
        type: "true_false",
        concept: "sensible",
        statement: "On peut coller le dossier médical d'un proche sans son accord.",
        answer: false,
        explanation: "Ce sont des données de santé sur une autre personne : jamais sans son accord, et jamais dans un outil grand public.",
      },
      {
        id: "vie-privee:v2-r2",
        type: "mcq",
        concept: "anonymiser",
        prompt: "Anonymiser, c'est…",
        options: [
          { id: "a", text: "retirer ce qui permet de reconnaître quelqu'un" },
          { id: "b", text: "écrire en majuscules" },
        ],
        answer: "a",
        explanation: "Noms, adresses, numéros : on les remplace ou on les retire.",
      },
    ],
    sources: [RGPD, ANTHROPIC_TRAINING, GEMINI_PRIVACY],
  },

  {
    id: "verifier-sources",
    title: "Vérifier une info",
    objective: "Vérifier une info importante en trois gestes : la source, une deuxième source, et le bon niveau d'effort.",
    theme: "confiance",
    difficulty: 1,
    format: "atelier",
    durationMin: 5,
    xp: 15,
    skills: ["Retrouver la source d'une info", "Recouper avec une autre source"],
    sections: [
      {
        id: "quoi",
        title: "Quoi vérifier",
        blocks: [
          {
            type: "text",
            body: "Tu ne vérifies pas tout. Tu vérifies **ce qui est précis** : chiffres, dates, noms, citations, références. Et ce qui **compte pour toi**.",
          },
          {
            type: "check",
            question: {
              id: "verifier-sources:v2-c1",
              type: "multi",
              concept: "quoi",
              prompt: "Dans cette réponse, que vérifier ?",
              options: [
                { id: "a", text: "« 37 % des Français font du vélo chaque semaine »" },
                { id: "b", text: "« Le vélo est agréable au printemps »" },
                { id: "c", text: "« Selon une étude de 2022 de l'université de Lyon… »" },
              ],
              answer: ["a", "c"],
              explanation: "Un chiffre et une étude citée sont vérifiables, et peuvent être inventés. Une opinion, non.",
            },
          },
        ],
      },
      {
        id: "trois-gestes",
        title: "Trois gestes",
        blocks: [
          {
            type: "flow",
            nodes: [
              { label: "Demander la source", detail: "« D'où vient ce chiffre ? Donne le lien. »" },
              { label: "L'ouvrir", detail: "Le lien existe-t-il ? Dit-il vraiment ça ? Une référence peut être inventée." },
              { label: "Recouper", detail: "Retrouve l'info dans une **deuxième source** sérieuse, qui ne copie pas la première." },
            ],
            caption: "Touche chaque geste.",
          },
          {
            type: "check",
            question: {
              id: "verifier-sources:v2-c2",
              type: "true_false",
              concept: "ouvrir",
              statement: "Si l'IA donne un lien, l'info est vérifiée.",
              answer: false,
              explanation: "Il faut l'ouvrir : le lien peut ne pas exister, ou dire autre chose.",
            },
          },
        ],
      },
      {
        id: "a-cote",
        title: "Lire à côté",
        blocks: [
          {
            type: "text",
            body: "Avant de croire un site inconnu, ouvre un autre onglet et cherche **ce qu'on dit de lui**. Les vérificateurs pros font exactement ça.",
          },
          {
            type: "check",
            question: {
              id: "verifier-sources:v2-c3",
              type: "mcq",
              concept: "a-cote",
              prompt: "Un site inconnu confirme l'info. Tu…",
              options: [
                { id: "a", text: "cherches ce que d'autres disent de ce site" },
                { id: "b", text: "lis tout le site pour voir s'il a l'air sérieux" },
              ],
              answer: "a",
              explanation: "Un site peut avoir l'air très sérieux. Ce qu'en disent les autres est plus fiable.",
            },
          },
        ],
      },
      {
        id: "effort",
        title: "Le bon niveau d'effort",
        blocks: [
          {
            type: "spectrum",
            poles: ["Pas besoin", "Vérifie tout"],
            items: [
              { label: "Reformuler ton mail", position: 5, detail: "Tu as tout sous les yeux." },
              { label: "Une idée de recette", position: 25, detail: "Une erreur ne coûte pas cher." },
              { label: "Un horaire de train", position: 65, detail: "Vérifie sur le site officiel." },
              { label: "Un médicament, un contrat", position: 95, detail: "Santé, argent, droit : toujours vérifier." },
            ],
            caption: "Touche chaque exemple.",
          },
        ],
      },
    ],
    summary: [
      "Vérifie **ce qui est précis** et ce qui **compte**.",
      "**Ouvre la source**, puis **recoupe** avec une deuxième.",
      "Santé, argent, droit : **toujours**. Une recette : pas besoin.",
    ],
    questions: [
      {
        id: "verifier-sources:v2-q1",
        type: "ordering",
        concept: "trois-gestes",
        prompt: "Remets les gestes dans l'ordre.",
        items: [
          { id: "a", text: "Demander la source" },
          { id: "b", text: "L'ouvrir" },
          { id: "c", text: "Recouper avec une autre source" },
        ],
        answer: ["a", "b", "c"],
        explanation: "Source, lecture, recoupement : trois gestes, une minute.",
      },
      {
        id: "verifier-sources:v2-q2",
        type: "true_false",
        concept: "ouvrir",
        statement: "Une référence avec auteur et date peut être inventée.",
        answer: true,
        explanation: "La forme peut être parfaite et le contenu faux.",
      },
      {
        id: "verifier-sources:v2-q3",
        type: "mcq",
        concept: "effort",
        prompt: "Laquelle mérite une vraie vérification ?",
        options: [
          { id: "a", text: "La dose d'un médicament" },
          { id: "b", text: "Un synonyme de « joli »" },
        ],
        answer: "a",
        explanation: "La santé fait partie de ce qu'on vérifie toujours.",
      },
      {
        id: "verifier-sources:v2-q4",
        type: "fill_choice",
        concept: "a-cote",
        prompt: "Complète la phrase.",
        sentence: "Pour juger un site inconnu, cherche ce que ___ disent de lui.",
        options: [
          { id: "a", text: "les autres" },
          { id: "b", text: "ses propres pages" },
        ],
        answer: "a",
        explanation: "C'est la lecture « à côté ».",
      },
    ],
    reviewQuestions: [
      {
        id: "verifier-sources:v2-r1",
        type: "mcq",
        concept: "trois-gestes",
        prompt: "Recouper, c'est…",
        options: [
          { id: "a", text: "retrouver l'info dans une autre source sérieuse" },
          { id: "b", text: "reposer la question à l'IA" },
        ],
        answer: "a",
        explanation: "Une deuxième source indépendante, pas le même outil.",
      },
    ],
    sources: [LATERAL_READING, REDUCE_HALLUCINATIONS],
  },
];
