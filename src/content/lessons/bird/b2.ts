import type { Lesson } from "../../types";

const CONTEXT_WINDOWS = { title: "Context windows", publisher: "Anthropic, documentation Claude", url: "https://platform.claude.com/docs/en/build-with-claude/context-windows", verified: "2026-10-14" };
const MODELS_OVERVIEW = { title: "Models overview (reliable knowledge cutoff, training data cutoff)", publisher: "Anthropic, documentation Claude", url: "https://platform.claude.com/docs/en/about-claude/models/overview", verified: "2026-10-14" };
const MATA = {
  title: "Mata v. Avianca, Inc.",
  publisher: "United States District Court, S.D.N.Y. (juge P. Kevin Castel), Opinion and Order on Sanctions du 22 juin 2023, 678 F. Supp. 3d 443, via CourtListener",
  url: "https://storage.courtlistener.com/recap/gov.uscourts.nysd.575368/gov.uscourts.nysd.575368.54.0.pdf",
  verified: "2026-10-14",
};
const REDUCE_HALLUCINATIONS = { title: "Reduce hallucinations", publisher: "Anthropic, documentation Claude", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations", verified: "2026-10-14" };
const CNIL_DEEPFAKE = { title: "Hypertrucage (deepfake) : comment se protéger et signaler les contenus illicites ?", publisher: "CNIL", url: "https://www.cnil.fr/fr/hypertrucage-deepfake", verified: "2026-10-29" };
const SYNTHID = { title: "SynthID", publisher: "Google DeepMind", url: "https://deepmind.google/technologies/synthid/", verified: "2026-10-29" };

/** Bird · chapitre 2 : « Ce qu'elle sait, ce qu'elle invente » */
export const birdChapter2: Lesson[] = [
  {
    id: "entrainement-et-limites",
    title: "Ce qu'elle sait, et ce qu'elle ignore",
    objective: "Savoir que ses connaissances s'arrêtent à une date, et qu'elle n'a pas de souvenirs entre deux conversations.",
    theme: "comprendre",
    difficulty: 1,
    format: "notion",
    durationMin: 4,
    xp: 15,
    skills: ["Repérer une information peut-être datée", "Donner à l'IA ce qui lui manque"],
    sections: [
      {
        id: "fige",
        title: "Un savoir figé",
        blocks: [
          {
            type: "text",
            body: "Un chatbot apprend **pendant son entraînement**, puis on le fige. Quand tu lui parles, il n'apprend plus rien : il utilise ce qu'il a déjà en tête.",
          },
          {
            type: "check",
            question: {
              id: "entrainement-et-limites:v2-c1",
              type: "true_false",
              concept: "fige",
              statement: "Chaque conversation rend le chatbot un peu plus intelligent.",
              answer: false,
              explanation: "Ses réglages ne bougent plus après l'entraînement. Te répondre ne lui apprend rien.",
            },
          },
        ],
      },
      {
        id: "date",
        title: "Une date de coupure",
        blocks: [
          {
            type: "text",
            body: "Ses connaissances s'arrêtent à une **date de coupure**. Tout ce qui s'est passé après, il ne le sait pas, sauf s'il peut **chercher sur le web**.",
          },
          {
            type: "check",
            question: {
              id: "entrainement-et-limites:v2-c2",
              type: "sort",
              concept: "date",
              prompt: "Où faut-il se méfier d'une réponse datée ?",
              bins: ["Peu de risque", "Peut être dépassé"],
              items: [
                { id: "a", text: "La recette des crêpes" },
                { id: "b", text: "Le prix actuel d'un abonnement" },
                { id: "c", text: "Le résultat du match d'hier" },
                { id: "d", text: "La date de la Révolution française" },
              ],
              answer: [0, 1, 1, 0],
              explanation: "Ce qui change souvent (prix, actualité, résultats) peut avoir bougé depuis sa date de coupure.",
            },
          },
        ],
      },
      {
        id: "memoire",
        title: "Une mémoire de travail",
        blocks: [
          {
            type: "text",
            body: "Pendant une conversation, il relit tout ce qui a été dit : c'est sa **mémoire de travail**. Mais elle a une taille limite, et une **nouvelle conversation repart de zéro**.",
          },
          {
            type: "check",
            question: {
              id: "entrainement-et-limites:v2-c3",
              type: "mcq",
              concept: "memoire",
              prompt: "Tu ouvres une nouvelle conversation et tu dis « reprends mon CV d'hier ». Il…",
              options: [
                { id: "a", text: "ne le voit pas : il faut le recoller" },
                { id: "b", text: "le retrouve tout seul" },
              ],
              answer: "a",
              explanation: "Sans fonction « mémoire » activée, une nouvelle conversation ne contient rien de l'ancienne.",
            },
          },
        ],
      },
      {
        id: "remede",
        title: "Le remède",
        blocks: [
          { type: "keypoint", body: "Il te manque quelque chose ? **Mets-le dans la conversation** : le texte, le document, la date du jour." },
          {
            type: "dialogue",
            turns: [
              { who: "user", text: "Voici le menu de la cantine de cette semaine : [menu]. Quels jours sont végétariens ?" },
              { who: "ai", text: "D'après ton menu : mardi et jeudi." },
            ],
            note: "Il ne connaît pas ce menu. Tu le lui donnes, il peut répondre.",
          },
        ],
      },
    ],
    summary: [
      "Il apprend pendant l'entraînement, puis **il est figé**.",
      "Ses connaissances s'arrêtent à une **date de coupure**.",
      "Une nouvelle conversation repart de zéro : **donne-lui ce qui manque**.",
    ],
    questions: [
      {
        id: "entrainement-et-limites:v2-q1",
        type: "mcq",
        concept: "date",
        prompt: "Tu demandes « Qui a gagné le dernier match de foot ? ». Le risque ?",
        options: [
          { id: "a", text: "Une réponse dépassée, s'il ne peut pas chercher sur le web" },
          { id: "b", text: "Aucun, il est toujours à jour" },
        ],
        answer: "a",
        explanation: "Sans recherche web, il ne connaît que ce qui précède sa date de coupure.",
      },
      {
        id: "entrainement-et-limites:v2-q2",
        type: "true_false",
        concept: "fige",
        statement: "Si tu le corriges, il retiendra la correction pour tous les utilisateurs.",
        answer: false,
        explanation: "Il ne se modifie pas en te parlant. La correction vaut seulement dans ta conversation.",
      },
      {
        id: "entrainement-et-limites:v2-q3",
        type: "fill_choice",
        concept: "memoire",
        prompt: "Complète la phrase.",
        sentence: "Une nouvelle conversation repart de ___.",
        options: [
          { id: "a", text: "zéro" },
          { id: "b", text: "la dernière" },
        ],
        answer: "a",
        explanation: "Par défaut, rien ne passe d'une conversation à l'autre.",
      },
      {
        id: "entrainement-et-limites:v2-q4",
        type: "mcq",
        concept: "remede",
        prompt: "Tu veux qu'il résume une lettre qu'il n'a jamais vue. Tu…",
        options: [
          { id: "a", text: "colles la lettre dans la conversation" },
          { id: "b", text: "lui demandes de la retrouver" },
        ],
        answer: "a",
        explanation: "Donne-lui le texte : il travaille sur ce qui est dans la conversation.",
      },
    ],
    reviewQuestions: [
      {
        id: "entrainement-et-limites:v2-r1",
        type: "true_false",
        concept: "date",
        statement: "Un chatbot sans accès au web peut ignorer une loi votée le mois dernier.",
        answer: true,
        explanation: "Si c'est après sa date de coupure, il ne peut pas le savoir.",
      },
      {
        id: "entrainement-et-limites:v2-r2",
        type: "mcq",
        concept: "remede",
        prompt: "Sa réponse sur ton planning est fausse. Le plus efficace ?",
        options: [
          { id: "a", text: "Lui donner ton vrai planning" },
          { id: "b", text: "Lui dire « réfléchis mieux »" },
        ],
        answer: "a",
        explanation: "Il ne peut pas deviner ce qu'il n'a pas. Donne-lui l'information.",
      },
    ],
    sources: [CONTEXT_WINDOWS, MODELS_OVERVIEW],
  },

  {
    id: "hallucinations",
    title: "Quand l'IA invente",
    objective: "Savoir pourquoi une IA invente parfois, où ça arrive, et le bon réflexe.",
    theme: "comprendre",
    difficulty: 1,
    format: "etude-de-cas",
    durationMin: 5,
    xp: 15,
    skills: ["Reconnaître une hallucination", "Vérifier une info importante"],
    sections: [
      {
        id: "affaire",
        title: "Une vraie affaire",
        blocks: [
          {
            type: "text",
            body: "En 2023, à New York, des avocats ont cité **six jugements** trouvés avec ChatGPT. Le juge les a cherchés : **aucun n'existait**. Les avocats ont été sanctionnés.",
          },
          {
            type: "check",
            question: {
              id: "hallucinations:v2-c1",
              type: "mcq",
              concept: "definition",
              prompt: "Que s'est-il passé, selon toi ?",
              options: [
                { id: "a", text: "L'IA a inventé des jugements qui avaient l'air vrais" },
                { id: "b", text: "Les jugements avaient été effacés d'internet" },
              ],
              answer: "a",
              explanation: "Noms, dates, numéros : tout avait la bonne forme. Rien n'était réel.",
            },
          },
        ],
      },
      {
        id: "pourquoi",
        title: "Pourquoi elle invente",
        blocks: [
          {
            type: "text",
            body: "Quand elle ne sait pas, l'IA ne se tait pas : elle écrit **la suite la plus plausible**. Le résultat a l'air juste, avec le même ton sûr. On appelle ça une **hallucination**.",
          },
          {
            type: "check",
            question: {
              id: "hallucinations:v2-c2",
              type: "true_false",
              concept: "pourquoi",
              statement: "Une IA qui invente le fait exprès pour tromper.",
              answer: false,
              explanation: "Elle n'a pas d'intention. Elle produit ce qui sonne juste, vrai ou pas.",
            },
          },
        ],
      },
      {
        id: "ou",
        title: "Où ça arrive",
        blocks: [
          {
            type: "layers",
            title: "Les terrains à risque",
            layers: [
              { label: "Références et citations", detail: "Livres, articles, jugements : la forme est parfaite, le contenu peut être faux." },
              { label: "Chiffres précis", detail: "Un pourcentage ou une date exacte peuvent être inventés." },
              { label: "Personnes peu connues", detail: "Elle mélange des infos ou en invente." },
              { label: "Santé, argent, droit", detail: "Là où une erreur coûte cher : vérifie toujours." },
            ],
            caption: "Touche chaque ligne.",
          },
        ],
      },
      {
        id: "reflexe",
        title: "Le bon réflexe",
        blocks: [
          {
            type: "mistake",
            title: "Lui demander « tu es sûr ? »",
            why: "Elle répond avec le même mécanisme que l'erreur. Les avocats l'ont fait : elle a confirmé.",
            fix: "**Ouvre la source**, ou retrouve l'info ailleurs.",
          },
          {
            type: "check",
            question: {
              id: "hallucinations:v2-c3",
              type: "mcq",
              concept: "reflexe",
              prompt: "Elle te cite un livre parfait pour ton exposé. Tu…",
              options: [
                { id: "a", text: "cherches le livre pour vérifier qu'il existe" },
                { id: "b", text: "lui demandes si elle est sûre" },
                { id: "c", text: "le cites tel quel" },
              ],
              answer: "a",
              explanation: "Seule la source retrouvée prouve quelque chose.",
            },
          },
        ],
      },
    ],
    summary: [
      "Une **hallucination**, c'est une info inventée qui a l'air vraie.",
      "Risque fort : **références, chiffres, personnes, santé, argent, droit**.",
      "« Tu es sûr ? » ne vérifie rien : **ouvre la source**.",
    ],
    questions: [
      {
        id: "hallucinations:v2-q1",
        type: "fill_choice",
        concept: "definition",
        prompt: "Complète la phrase.",
        sentence: "Une information inventée mais crédible s'appelle une ___.",
        options: [
          { id: "a", text: "hallucination" },
          { id: "b", text: "mise à jour" },
          { id: "c", text: "erreur de frappe" },
        ],
        answer: "a",
        explanation: "C'est le mot utilisé pour les inventions présentées comme des faits.",
      },
      {
        id: "hallucinations:v2-q2",
        type: "true_false",
        concept: "pourquoi",
        statement: "Une IA qui répond avec assurance a forcément raison.",
        answer: false,
        explanation: "Le ton est le même quand elle invente. L'assurance n'est pas une preuve.",
      },
      {
        id: "hallucinations:v2-q3",
        type: "multi",
        concept: "ou",
        prompt: "Où une hallucination est-elle la plus probable ?",
        options: [
          { id: "a", text: "Une référence d'article scientifique" },
          { id: "b", text: "Un chiffre précis" },
          { id: "c", text: "Reformuler ton propre texte" },
        ],
        answer: ["a", "b"],
        explanation: "Reformuler ton texte, c'est travailler sur ce que tu as donné. Inventer une référence ou un chiffre, c'est le vrai risque.",
      },
      {
        id: "hallucinations:v2-q4",
        type: "mcq",
        concept: "reflexe",
        prompt: "Le meilleur réflexe face à une info importante ?",
        options: [
          { id: "a", text: "La retrouver dans une source fiable" },
          { id: "b", text: "Reposer la question jusqu'à avoir la même réponse" },
        ],
        answer: "a",
        explanation: "Une source indépendante tranche. La répétition ne prouve rien.",
      },
    ],
    reviewQuestions: [
      {
        id: "hallucinations:v2-r1",
        type: "mcq",
        concept: "reflexe",
        prompt: "Dans l'affaire des avocats, demander « ces jugements existent ? » à l'IA…",
        options: [
          { id: "a", text: "n'a servi à rien : elle a confirmé" },
          { id: "b", text: "a révélé l'erreur" },
        ],
        answer: "a",
        explanation: "La confirmation vient du même mécanisme que l'invention.",
      },
      {
        id: "hallucinations:v2-r2",
        type: "true_false",
        concept: "ou",
        statement: "Les chiffres précis sont un terrain à risque d'invention.",
        answer: true,
        explanation: "Un pourcentage exact peut être inventé. Vérifie-le s'il compte.",
      },
    ],
    sources: [MATA, REDUCE_HALLUCINATIONS],
  },

  {
    id: "images-et-deepfakes",
    title: "Vraie photo ou fausse ?",
    objective: "Savoir que l'IA fabrique aussi des images et des voix, et avoir trois réflexes avant d'y croire.",
    theme: "confiance",
    difficulty: 1,
    format: "labo",
    durationMin: 4,
    xp: 15,
    skills: ["Se méfier d'une image ou d'une voix trop parfaite", "Vérifier avant de partager"],
    sections: [
      {
        id: "fabrique",
        title: "L'IA fabrique aussi des images",
        blocks: [
          {
            type: "text",
            body: "Une IA peut créer une photo, une vidéo ou **imiter une voix** en quelques secondes. Un faux réaliste s'appelle un **hypertrucage**, ou **deepfake**.",
          },
          {
            type: "check",
            question: {
              id: "images-et-deepfakes:c1",
              type: "true_false",
              concept: "existe",
              statement: "Une IA peut imiter la voix d'un proche.",
              answer: true,
              explanation: "Quelques enregistrements suffisent parfois. C'est utilisé dans des arnaques.",
            },
          },
        ],
      },
      {
        id: "indices",
        title: "Les indices visuels",
        blocks: [
          {
            type: "layers",
            title: "Ce qui peut trahir un faux",
            layers: [
              { label: "Les yeux", detail: "Ils bougent bizarrement, ou clignent peu." },
              { label: "La bouche", detail: "Elle est déformée, ou mal synchronisée avec la voix." },
              { label: "La lumière", detail: "Les ombres sur le visage ne collent pas avec le décor." },
              { label: "L'image", detail: "Des zones floues ou pixelisées, surtout autour du visage." },
            ],
            caption: "Touche chaque indice. Attention : les faux récents n'en montrent parfois aucun.",
          },
        ],
      },
      {
        id: "reflexes",
        title: "Trois réflexes",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Trop choquant ? Méfiance", body: "Les faux sont faits pour être partagés vite." },
              { title: "Chercher la source", body: "Qui l'a publié en premier ? Un média fiable en parle-t-il ?" },
              { title: "Vérifier par un autre canal", body: "Un proche te demande de l'argent ? Rappelle-le, toi." },
            ],
          },
          {
            type: "check",
            question: {
              id: "images-et-deepfakes:c2",
              type: "mcq",
              concept: "reflexes",
              prompt: "Un message vocal de ta sœur te demande 300 € en urgence. Tu…",
              options: [
                { id: "a", text: "l'appelles toi-même pour vérifier" },
                { id: "b", text: "envoies l'argent, c'est sa voix" },
              ],
              answer: "a",
              explanation: "Une voix peut être imitée. Vérifie toujours par un autre canal.",
            },
          },
        ],
      },
      {
        id: "partager",
        title: "Avant de partager",
        blocks: [
          { type: "keypoint", body: "Un doute ? **Ne partage pas.** Signale le contenu sur la plateforme." },
          {
            type: "check",
            question: {
              id: "images-et-deepfakes:c3",
              type: "sort",
              concept: "reflexes",
              prompt: "Bon réflexe, ou pas ?",
              bins: ["Bon réflexe", "À éviter"],
              items: [
                { id: "a", text: "Chercher si un média fiable en parle" },
                { id: "b", text: "Partager « au cas où »" },
                { id: "c", text: "Signaler un faux sur la plateforme" },
                { id: "d", text: "Croire une vidéo parce qu'elle est nette" },
              ],
              answer: [0, 1, 0, 1],
              explanation: "Une image nette peut être fausse. Le doute se règle à la source, pas au partage.",
            },
          },
        ],
      },
    ],
    summary: [
      "L'IA crée des **images, vidéos et voix** réalistes : les **deepfakes**.",
      "Indices possibles : yeux, bouche, lumière, zones floues. Mais pas toujours.",
      "Trop choquant ou urgent ? **Source, autre canal, et pas de partage.**",
    ],
    questions: [
      {
        id: "images-et-deepfakes:q1",
        type: "fill_choice",
        concept: "existe",
        prompt: "Complète la phrase.",
        sentence: "Une vidéo truquée par IA s'appelle un ___.",
        options: [
          { id: "a", text: "deepfake" },
          { id: "b", text: "selfie" },
          { id: "c", text: "podcast" },
        ],
        answer: "a",
        explanation: "En français, on dit aussi hypertrucage.",
      },
      {
        id: "images-et-deepfakes:q2",
        type: "true_false",
        concept: "indices",
        statement: "Si une vidéo ne montre aucun défaut, elle est forcément vraie.",
        answer: false,
        explanation: "Les faux récents peuvent être parfaits. Vérifie la source.",
      },
      {
        id: "images-et-deepfakes:q3",
        type: "mcq",
        concept: "reflexes",
        prompt: "Une photo choquante d'une célébrité circule. Premier réflexe ?",
        options: [
          { id: "a", text: "Chercher qui l'a publiée et si des médias fiables en parlent" },
          { id: "b", text: "La partager pour prévenir tes amis" },
        ],
        answer: "a",
        explanation: "Remonter à la source avant tout. Partager un faux l'aide à se répandre.",
      },
      {
        id: "images-et-deepfakes:q4",
        type: "multi",
        concept: "indices",
        prompt: "Quels détails peuvent trahir un faux ?",
        options: [
          { id: "a", text: "Une bouche mal synchronisée" },
          { id: "b", text: "Des ombres incohérentes" },
          { id: "c", text: "Une vidéo en couleur" },
        ],
        answer: ["a", "b"],
        explanation: "La couleur ne dit rien. Les incohérences de visage et de lumière, si.",
      },
    ],
    reviewQuestions: [
      {
        id: "images-et-deepfakes:r1",
        type: "mcq",
        concept: "reflexes",
        prompt: "Ton chef t'appelle et demande un virement urgent. La voix est la sienne. Tu…",
        options: [
          { id: "a", text: "le rappelles sur son numéro habituel" },
          { id: "b", text: "fais le virement" },
        ],
        answer: "a",
        explanation: "Demande urgente d'argent : on vérifie par un autre canal.",
      },
    ],
    sources: [CNIL_DEEPFAKE, SYNTHID],
  },
];
