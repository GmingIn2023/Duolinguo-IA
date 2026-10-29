import type { Lesson } from "../../types";

const CNIL_IAG = { title: "Les questions-réponses de la CNIL sur l'utilisation d'un système d'IA générative", publisher: "CNIL", url: "https://www.cnil.fr/fr/les-questions-reponses-de-la-cnil-sur-lutilisation-dun-systeme-dia-generative", verified: "2026-10-13" };
const VISION = { title: "Vision (Limitations)", publisher: "Anthropic, documentation Claude", url: "https://platform.claude.com/docs/en/build-with-claude/vision", verified: "2026-10-29" };

/** Bird · chapitre 5 : « Les bons outils » */
export const birdChapter5: Lesson[] = [
  {
    id: "panorama-outils",
    title: "Les assistants connus",
    objective: "Reconnaître les grandes familles d'assistants et savoir où trouver des infos fiables sur chacun.",
    theme: "outils",
    difficulty: 1,
    format: "comparatif",
    durationMin: 5,
    xp: 15,
    skills: ["Reconnaître les familles d'assistants", "Trouver l'info officielle sur un outil"],
    sections: [
      {
        id: "familles",
        title: "Des familles, pas des noms",
        blocks: [
          {
            type: "text",
            body: "Les noms changent vite. Retiens plutôt **quatre familles** : l'assistant **généraliste**, le **moteur de réponse** avec sources, l'assistant **intégré** à tes outils, et le modèle **à télécharger**.",
          },
          {
            type: "layers",
            title: "Les quatre familles",
            layers: [
              { label: "Généraliste", detail: "Rédiger, expliquer, discuter. Exemples : ChatGPT, Claude." },
              { label: "Moteur de réponse", detail: "Il cherche sur le web et cite ses sources. Exemple : Perplexity." },
              { label: "Intégré", detail: "Dans ta messagerie ou ton traitement de texte. Exemple : Gemini dans les services Google." },
              { label: "À télécharger", detail: "Un modèle qu'on peut faire tourner sur sa machine. Exemple : certains modèles DeepSeek." },
            ],
            caption: "Touche chaque famille.",
          },
        ],
      },
      {
        id: "fiches",
        title: "Cinq outils, en bref",
        blocks: [
          { type: "tools", toolIds: ["chatgpt", "claude", "gemini", "perplexity", "deepseek"] },
          {
            type: "check",
            question: {
              id: "panorama-outils:v2-c1",
              type: "mcq",
              concept: "familles",
              prompt: "Tu veux une réponse avec des liens vers les sources. Quelle famille ?",
              options: [
                { id: "a", text: "Un moteur de réponse" },
                { id: "b", text: "Un modèle à télécharger" },
              ],
              answer: "a",
              explanation: "Le moteur de réponse cherche sur le web et numérote ses sources.",
            },
          },
        ],
      },
      {
        id: "vieillit",
        title: "Ces infos vieillissent vite",
        blocks: [
          {
            type: "text",
            body: "Prix, fonctions, limites : tout change **en quelques mois**. Les fiches ci-dessus sont **datées**. Pour une info sûre, va sur la **page officielle** de l'outil.",
          },
          {
            type: "check",
            question: {
              id: "panorama-outils:v2-c2",
              type: "mcq",
              concept: "source-officielle",
              prompt: "Tu veux savoir ce qu'un assistant fait de tes données. Tu…",
              options: [
                { id: "a", text: "lis sa page officielle sur la confidentialité" },
                { id: "b", text: "lui poses la question directement" },
              ],
              answer: "a",
              explanation: "L'assistant peut se tromper sur lui-même. La page officielle fait foi.",
            },
          },
        ],
      },
      {
        id: "un-suffit",
        title: "Un outil suffit pour commencer",
        blocks: [
          { type: "keypoint", body: "Mieux vaut **un outil bien maîtrisé** que cinq survolés." },
          {
            type: "check",
            question: {
              id: "panorama-outils:v2-c3",
              type: "true_false",
              concept: "un-suffit",
              statement: "Pour bien débuter, il faut tester tous les assistants.",
              answer: false,
              explanation: "Commence avec un généraliste. Tu ajouteras un outil quand une tâche le demandera.",
            },
          },
        ],
      },
    ],
    summary: [
      "Quatre familles : **généraliste, moteur de réponse, intégré, à télécharger**.",
      "Les infos sur les outils **vieillissent vite** : vérifie la page officielle.",
      "**Un outil bien maîtrisé** vaut mieux que cinq survolés.",
    ],
    questions: [
      {
        id: "panorama-outils:v2-q1",
        type: "match",
        concept: "familles",
        prompt: "Relie chaque besoin à la famille.",
        left: [
          { id: "1", text: "Une info récente avec ses sources" },
          { id: "2", text: "Rédiger un texte" },
          { id: "3", text: "Résumer tes mails dans ta messagerie" },
        ],
        right: [
          { id: "moteur", text: "Moteur de réponse" },
          { id: "generaliste", text: "Généraliste" },
          { id: "integre", text: "Intégré" },
        ],
        answer: ["moteur", "generaliste", "integre"],
        explanation: "Chaque famille a son terrain de jeu.",
      },
      {
        id: "panorama-outils:v2-q2",
        type: "true_false",
        concept: "source-officielle",
        statement: "Le prix d'un abonnement peut changer en quelques mois.",
        answer: true,
        explanation: "D'où les fiches datées et le réflexe de la page officielle.",
      },
      {
        id: "panorama-outils:v2-q3",
        type: "fill_choice",
        concept: "familles",
        prompt: "Complète la phrase.",
        sentence: "Un moteur de réponse ___ ses sources.",
        options: [
          { id: "a", text: "cite" },
          { id: "b", text: "cache" },
        ],
        answer: "a",
        explanation: "Il donne des liens numérotés. Ouvre-les quand même.",
      },
      {
        id: "panorama-outils:v2-q4",
        type: "mcq",
        concept: "un-suffit",
        prompt: "Pour débuter, le plus simple ?",
        options: [
          { id: "a", text: "Un assistant généraliste, bien pris en main" },
          { id: "b", text: "Cinq outils en même temps" },
        ],
        answer: "a",
        explanation: "Tu progresses plus vite en maîtrisant un outil.",
      },
    ],
    reviewQuestions: [
      {
        id: "panorama-outils:v2-r1",
        type: "mcq",
        concept: "familles",
        prompt: "Un modèle qu'on fait tourner sur son ordinateur, c'est…",
        options: [
          { id: "a", text: "un modèle à télécharger" },
          { id: "b", text: "un moteur de réponse" },
        ],
        answer: "a",
        explanation: "Il fonctionne sans envoyer tes données à un service en ligne.",
      },
    ],
    sources: [CNIL_IAG],
    volatile: { toolIds: ["chatgpt", "claude", "gemini", "perplexity", "deepseek"] },
  },

  {
    id: "choisir-le-bon-outil",
    title: "Le bon outil pour la tâche",
    objective: "Partir de ta tâche pour choisir l'outil, avec quatre questions simples.",
    theme: "outils",
    difficulty: 1,
    format: "atelier",
    durationMin: 4,
    xp: 15,
    skills: ["Choisir un outil à partir de la tâche"],
    sections: [
      {
        id: "tache",
        title: "La tâche d'abord",
        blocks: [
          {
            type: "text",
            body: "Ne te demande pas « quel est le meilleur outil ? ». Demande-toi **« de quoi ma tâche a besoin ? »**. Quatre questions suffisent.",
          },
          {
            type: "steps",
            items: [
              { title: "Une info récente ?", body: "Il faut un outil qui cherche sur le web." },
              { title: "Un long document ?", body: "Il faut un outil qui lit les fichiers." },
              { title: "Des données sensibles ?", body: "Anonymise, ou utilise l'outil autorisé." },
              { title: "Une image ou ta voix ?", body: "Il faut un outil qui les accepte." },
            ],
          },
        ],
      },
      {
        id: "cas1",
        title: "Cas 1",
        blocks: [
          {
            type: "check",
            question: {
              id: "choisir-le-bon-outil:v2-c1",
              type: "mcq",
              concept: "recent",
              prompt: "Tu cherches les horaires d'ouverture de la piscine cette semaine.",
              options: [
                { id: "a", text: "Un outil qui cherche sur le web, puis le site de la piscine" },
                { id: "b", text: "Un chatbot sans accès au web" },
              ],
              answer: "a",
              explanation: "Une info récente demande le web. Et le site officiel reste la meilleure source.",
            },
          },
        ],
      },
      {
        id: "cas2",
        title: "Cas 2",
        blocks: [
          {
            type: "check",
            question: {
              id: "choisir-le-bon-outil:v2-c2",
              type: "mcq",
              concept: "sensible",
              prompt: "Tu veux de l'aide sur un courrier qui contient ton numéro fiscal.",
              options: [
                { id: "a", text: "Retirer le numéro avant de coller le courrier" },
                { id: "b", text: "Le coller tel quel dans n'importe quel chatbot" },
              ],
              answer: "a",
              explanation: "Données sensibles : on les retire d'abord. L'aide reste la même.",
            },
          },
        ],
      },
      {
        id: "cas3",
        title: "Cas 3",
        blocks: [
          {
            type: "check",
            question: {
              id: "choisir-le-bon-outil:v2-c3",
              type: "true_false",
              concept: "payant",
              statement: "Un outil payant protège forcément mieux tes données.",
              answer: false,
              explanation: "Payer donne surtout plus d'usage. La protection dépend des réglages et de l'offre : lis la page officielle.",
            },
          },
          { type: "keypoint", body: "Garde **un outil principal**, et un second seulement si une tâche le demande." },
        ],
      },
    ],
    summary: [
      "Pars de **ta tâche**, pas de l'outil.",
      "Quatre questions : **récent ? long document ? sensible ? image ou voix ?**",
      "Payant ne veut pas dire **plus confidentiel** : vérifie les réglages.",
    ],
    questions: [
      {
        id: "choisir-le-bon-outil:v2-q1",
        type: "match",
        concept: "recent",
        prompt: "Relie la tâche à ce dont elle a besoin.",
        left: [
          { id: "1", text: "Le résultat des élections d'hier" },
          { id: "2", text: "Résumer un rapport de 40 pages" },
          { id: "3", text: "Traduire un panneau en photo" },
        ],
        right: [
          { id: "web", text: "Recherche web" },
          { id: "fichier", text: "Lecture de fichiers" },
          { id: "image", text: "Accepter une image" },
        ],
        answer: ["web", "fichier", "image"],
        explanation: "La tâche dit de quoi tu as besoin.",
      },
      {
        id: "choisir-le-bon-outil:v2-q2",
        type: "true_false",
        concept: "payant",
        statement: "Le plus cher est toujours le meilleur choix.",
        answer: false,
        explanation: "Le meilleur outil est celui qui fait ce dont ta tâche a besoin.",
      },
      {
        id: "choisir-le-bon-outil:v2-q3",
        type: "mcq",
        concept: "sensible",
        prompt: "Ton travail a choisi un outil IA officiel. Pour un document interne, tu…",
        options: [
          { id: "a", text: "utilises l'outil officiel du travail" },
          { id: "b", text: "utilises ton compte perso, plus pratique" },
        ],
        answer: "a",
        explanation: "L'outil choisi par ton employeur est encadré pour ces documents.",
      },
      {
        id: "choisir-le-bon-outil:v2-q4",
        type: "fill_choice",
        concept: "recent",
        prompt: "Complète la phrase.",
        sentence: "Pour une info récente, il faut un outil qui ___.",
        options: [
          { id: "a", text: "cherche sur le web" },
          { id: "b", text: "parle plusieurs langues" },
        ],
        answer: "a",
        explanation: "Sans web, il s'arrête à sa date de coupure.",
      },
    ],
    reviewQuestions: [
      {
        id: "choisir-le-bon-outil:v2-r1",
        type: "mcq",
        concept: "sensible",
        prompt: "Le premier réflexe avec un document sensible ?",
        options: [
          { id: "a", text: "Retirer ce qui est sensible, ou utiliser l'outil autorisé" },
          { id: "b", text: "Choisir l'outil le plus connu" },
        ],
        answer: "a",
        explanation: "La sensibilité des données décide avant tout le reste.",
      },
    ],
    sources: [CNIL_IAG],
  },

  {
    id: "parler-et-montrer",
    title: "Photo, voix : parler autrement",
    objective: "Utiliser une photo ou ta voix avec un assistant, et connaître leurs limites.",
    theme: "outils",
    difficulty: 1,
    format: "labo",
    durationMin: 4,
    xp: 15,
    skills: ["Demander de l'aide avec une photo", "Repérer les limites de la lecture d'image"],
    sections: [
      {
        id: "photo",
        title: "Montrer une photo",
        blocks: [
          {
            type: "text",
            body: "Beaucoup d'assistants acceptent **une photo** : ton frigo pour une recette, un panneau à traduire, un exercice à expliquer. Tu montres au lieu de décrire.",
          },
          {
            type: "check",
            question: {
              id: "parler-et-montrer:c1",
              type: "multi",
              concept: "usages",
              prompt: "Quelles demandes marchent bien avec une photo ?",
              options: [
                { id: "a", text: "« Que puis-je cuisiner avec ça ? » (photo du frigo)" },
                { id: "b", text: "« Traduis ce menu » (photo du menu)" },
                { id: "c", text: "« Qui est cette personne ? » (photo d'un inconnu)" },
              ],
              answer: ["a", "b"],
              explanation: "Identifier des inconnus pose problème, et beaucoup d'assistants refusent de le faire.",
            },
          },
        ],
      },
      {
        id: "limites",
        title: "Ses limites",
        blocks: [
          {
            type: "layers",
            title: "Là où elle se trompe",
            layers: [
              { label: "Photo floue ou de travers", detail: "Elle peut mal lire, ou inventer ce qu'elle ne voit pas bien." },
              { label: "Compter des objets", detail: "Le nombre donné est souvent approximatif." },
              { label: "Tout petits détails", detail: "Un texte minuscule peut être mal lu." },
            ],
            caption: "Touche chaque ligne.",
          },
          {
            type: "check",
            question: {
              id: "parler-et-montrer:c2",
              type: "true_false",
              concept: "limites",
              statement: "Sur une photo floue, l'IA peut inventer un détail.",
              answer: true,
              explanation: "Comme pour le texte, elle complète ce qu'elle ne voit pas bien. Prends une photo nette.",
            },
          },
        ],
      },
      {
        id: "prudence",
        title: "Ce qu'on ne photographie pas",
        blocks: [
          { type: "keypoint", body: "Une photo, ce sont **des données** : pas de carte d'identité, pas de carte bancaire, pas d'ordonnance." },
          {
            type: "check",
            question: {
              id: "parler-et-montrer:c3",
              type: "sort",
              concept: "prudence",
              prompt: "Tu peux l'envoyer, ou pas ?",
              bins: ["Ça va", "Évite"],
              items: [
                { id: "a", text: "Une plante dont tu cherches le nom" },
                { id: "b", text: "Ta carte d'identité" },
                { id: "c", text: "Une étiquette de vêtement à traduire" },
                { id: "d", text: "Ton relevé bancaire" },
              ],
              answer: [0, 1, 0, 1],
              explanation: "Les mêmes règles que pour le texte : rien d'identifiant ni de bancaire.",
            },
          },
        ],
      },
      {
        id: "voix",
        title: "Parler au lieu d'écrire",
        blocks: [
          {
            type: "text",
            body: "Tu peux aussi **dicter** ta demande. Pratique en marchant ou en cuisinant. Pense juste à **relire** ce qu'il a compris avant d'envoyer.",
          },
          {
            type: "check",
            question: {
              id: "parler-et-montrer:c4",
              type: "mcq",
              concept: "voix",
              prompt: "Tu dictes « ajoute du sel » et il écrit « ajoute du ciel ». Le bon réflexe ?",
              options: [
                { id: "a", text: "Relire et corriger avant d'envoyer" },
                { id: "b", text: "Envoyer, il comprendra" },
              ],
              answer: "a",
              explanation: "La dictée se trompe parfois. Un coup d'œil évite une réponse à côté.",
            },
          },
        ],
      },
    ],
    summary: [
      "Une **photo** remplace une longue description : frigo, menu, exercice.",
      "Photo floue ou détail minuscule : **elle peut se tromper ou inventer**.",
      "Pas de **papiers d'identité ni de banque** en photo. Relis tes dictées.",
    ],
    questions: [
      {
        id: "parler-et-montrer:q1",
        type: "mcq",
        concept: "usages",
        prompt: "Tu es en voyage et ne comprends pas un panneau. Le plus simple ?",
        options: [
          { id: "a", text: "Le prendre en photo et demander une traduction" },
          { id: "b", text: "Recopier chaque lettre à la main" },
        ],
        answer: "a",
        explanation: "Montrer est plus rapide et évite les fautes de recopie.",
      },
      {
        id: "parler-et-montrer:q2",
        type: "true_false",
        concept: "limites",
        statement: "Quand l'IA compte 47 bonbons sur une photo, le nombre est forcément exact.",
        answer: false,
        explanation: "Compter beaucoup de petits objets donne souvent un nombre approximatif.",
      },
      {
        id: "parler-et-montrer:q3",
        type: "multi",
        concept: "prudence",
        prompt: "Qu'est-ce qu'on évite de photographier pour un assistant ?",
        options: [
          { id: "a", text: "Une carte bancaire" },
          { id: "b", text: "Une ordonnance à ton nom" },
          { id: "c", text: "Un plat que tu veux refaire" },
        ],
        answer: ["a", "b"],
        explanation: "Banque et santé restent privées, en texte comme en photo.",
      },
      {
        id: "parler-et-montrer:q4",
        type: "fill_choice",
        concept: "voix",
        prompt: "Complète la phrase.",
        sentence: "Après une dictée, ___ avant d'envoyer.",
        options: [
          { id: "a", text: "relis" },
          { id: "b", text: "ajoute des emojis" },
        ],
        answer: "a",
        explanation: "La dictée peut mal comprendre un mot.",
      },
    ],
    reviewQuestions: [
      {
        id: "parler-et-montrer:r1",
        type: "mcq",
        concept: "limites",
        prompt: "Pour que l'IA lise bien un document en photo…",
        options: [
          { id: "a", text: "prends une photo nette et droite" },
          { id: "b", text: "prends-la de loin pour tout avoir" },
        ],
        answer: "a",
        explanation: "Une image nette réduit les erreurs de lecture.",
      },
    ],
    sources: [VISION, CNIL_IAG],
  },
];
