import type { Lesson } from "../../types";

const GOOGLE_ML = { title: "What is Machine Learning?", publisher: "Google for Developers, Machine Learning", url: "https://developers.google.com/machine-learning/intro-to-ml/what-is-ml", verified: "2026-10-14" };
const ANTHROPIC_GLOSSARY = { title: "Glossary (LLM, Pretraining, Tokens, Temperature)", publisher: "Anthropic, documentation Claude", url: "https://platform.claude.com/docs/en/about-claude/glossary", verified: "2026-10-14" };

/** Bird · chapitre 1 : « C'est quoi, l'IA ? » */
export const birdChapter1: Lesson[] = [
  {
    id: "ia-cest-quoi",
    title: "L'IA, c'est quoi ?",
    objective: "Voir la différence entre un programme qui suit des règles et une IA qui apprend avec des exemples.",
    theme: "comprendre",
    difficulty: 1,
    format: "notion",
    durationMin: 4,
    xp: 15,
    skills: ["Distinguer règles et apprentissage", "Reconnaître une IA au quotidien"],
    sections: [
      {
        id: "regles-exemples",
        title: "Des règles ou des exemples",
        blocks: [
          {
            type: "text",
            body: "Un programme classique suit des **règles écrites par un humain**. Une IA, elle, **apprend avec des exemples** : on lui montre des milliers de cas déjà triés, et elle trouve seule ce qui les distingue.",
          },
          { type: "illustration", id: "rules-vs-examples", caption: "À gauche, un humain écrit les règles. À droite, la machine les déduit des exemples." },
          {
            type: "check",
            question: {
              id: "ia-cest-quoi:v2-c1",
              type: "mcq",
              concept: "regles-vs-exemples",
              prompt: "Une calculatrice qui fait « prix × 1,2 », c'est…",
              options: [
                { id: "a", text: "un programme classique : un humain a écrit la règle" },
                { id: "b", text: "une IA, parce qu'elle calcule vite", feedback: "La vitesse ne compte pas. La vraie question : qui a trouvé la méthode ?" },
              ],
              answer: "a",
              explanation: "Personne ne lui a montré d'exemples : elle applique une formule écrite par un humain.",
            },
          },
        ],
      },
      {
        id: "fabrication",
        title: "Comment on la fabrique",
        blocks: [
          {
            type: "flow",
            title: "Quatre étapes",
            nodes: [
              { label: "Rassembler", detail: "On réunit beaucoup d'exemples : des mails triés, des photos avec leur légende, des textes." },
              { label: "Entraîner", detail: "L'IA devine, on mesure son erreur, on corrige un tout petit peu. Et on recommence des millions de fois." },
              { label: "Tester", detail: "On la teste sur des exemples **qu'elle n'a jamais vus**, pour vérifier qu'elle a appris une méthode." },
              { label: "Utiliser", detail: "On la met dans une application. Elle applique ce qu'elle a appris à tes cas à toi." },
            ],
          },
          {
            type: "check",
            question: {
              id: "ia-cest-quoi:v2-c2",
              type: "true_false",
              concept: "qualite-donnees",
              statement: "Avec beaucoup d'exemples, une IA est forcément fiable.",
              answer: false,
              explanation: "Elle copie aussi les défauts de ses exemples. Si ton cas ne ressemble pas à ce qu'elle a vu, elle peut se tromper.",
            },
          },
        ],
      },
      {
        id: "quatre-familles",
        title: "Ce qu'une IA sait faire",
        blocks: [
          {
            type: "text",
            body: "La plupart des IA font une de ces quatre choses : **classer**, **recommander**, **prédire** ou **créer** un contenu nouveau, comme un texte ou une image.",
          },
          {
            type: "check",
            question: {
              id: "ia-cest-quoi:v2-c3",
              type: "match",
              concept: "familles",
              prompt: "Relie chaque exemple à ce que fait l'IA.",
              left: [
                { id: "spam", text: "Le filtre anti-spam" },
                { id: "video", text: "Les vidéos suggérées" },
                { id: "trajet", text: "Le temps de trajet du GPS" },
                { id: "chat", text: "Un chatbot" },
              ],
              right: [
                { id: "classer", text: "Classer" },
                { id: "recommander", text: "Recommander" },
                { id: "predire", text: "Prédire" },
                { id: "creer", text: "Créer" },
              ],
              answer: ["classer", "recommander", "predire", "creer"],
              explanation: "Les chatbots sont la famille la plus récente : ils créent un texte nouveau à chaque réponse.",
            },
          },
        ],
      },
      {
        id: "idees-recues",
        title: "Apprendre n'est pas comprendre",
        blocks: [
          { type: "keypoint", body: "Une IA repère des **régularités**. Elle ne comprend pas le monde comme toi." },
          {
            type: "check",
            question: {
              id: "ia-cest-quoi:v2-c4",
              type: "sort",
              concept: "idees-recues",
              prompt: "Vrai, ou idée reçue ?",
              bins: ["Vrai", "Idée reçue"],
              items: [
                { id: "a", text: "Elle repère des régularités dans les exemples" },
                { id: "b", text: "Elle comprend comme un humain" },
                { id: "c", text: "Elle peut se tromper sur un cas rare" },
                { id: "d", text: "Elle est neutre par nature" },
              ],
              answer: [0, 1, 0, 1],
              explanation: "Elle reproduit ce qu'il y a dans ses exemples, biais compris. Neutre, elle ne l'est jamais par magie.",
            },
          },
        ],
      },
    ],
    summary: [
      "Un programme suit des **règles écrites par un humain**. Une IA **apprend avec des exemples**.",
      "Une IA vaut ce que valent ses exemples : fiable sur ce qui leur ressemble, fragile ailleurs.",
      "Elle classe, recommande, prédit ou crée. Elle ne **comprend** pas comme toi.",
    ],
    questions: [
      {
        id: "ia-cest-quoi:v2-q1",
        type: "mcq",
        concept: "regles-vs-exemples",
        prompt: "Qu'est-ce qui fait d'un logiciel une IA ?",
        options: [
          { id: "a", text: "Il a appris sa méthode à partir d'exemples" },
          { id: "b", text: "Il est très rapide" },
          { id: "c", text: "Il ne se trompe jamais" },
        ],
        answer: "a",
        explanation: "Ce qui compte, c'est d'où vient la méthode : des exemples, pas des règles écrites à la main.",
      },
      {
        id: "ia-cest-quoi:v2-q2",
        type: "true_false",
        concept: "qualite-donnees",
        statement: "On teste une IA sur des exemples qu'elle n'a jamais vus.",
        answer: true,
        explanation: "C'est le seul moyen de vérifier qu'elle a appris une méthode, et pas seulement retenu ses exemples par cœur.",
      },
      {
        id: "ia-cest-quoi:v2-q3",
        type: "fill_choice",
        concept: "familles",
        prompt: "Complète la phrase.",
        sentence: "Quand une appli te propose une série à regarder, l'IA ___.",
        options: [
          { id: "a", text: "recommande" },
          { id: "b", text: "classe" },
          { id: "c", text: "prédit la météo" },
        ],
        answer: "a",
        explanation: "Choisir ce qui a des chances de te plaire, c'est recommander.",
      },
      {
        id: "ia-cest-quoi:v2-q4",
        type: "mcq",
        concept: "idees-recues",
        prompt: "Une IA entraînée sur des photos de chats en plein jour voit un chat la nuit. Le risque ?",
        options: [
          { id: "a", text: "Elle se trompe plus souvent, ce cas ne ressemble pas à ses exemples" },
          { id: "b", text: "Aucun : un chat reste un chat" },
        ],
        answer: "a",
        explanation: "Plus un cas s'éloigne de ses exemples, plus il faut contrôler sa réponse.",
      },
    ],
    reviewQuestions: [
      {
        id: "ia-cest-quoi:v2-r1",
        type: "true_false",
        concept: "regles-vs-exemples",
        statement: "Un correcteur qui applique « si le mot finit par -ez, ajoute un accent » est une IA.",
        answer: false,
        explanation: "C'est une règle écrite à la main : un programme classique.",
      },
      {
        id: "ia-cest-quoi:v2-r2",
        type: "mcq",
        concept: "familles",
        prompt: "Ton téléphone se déverrouille en reconnaissant ton visage. L'IA…",
        options: [
          { id: "a", text: "classe : « c'est toi » ou « ce n'est pas toi »" },
          { id: "b", text: "crée une photo de toi" },
        ],
        answer: "a",
        explanation: "Elle range ce qu'elle voit dans une case. C'est de la classification.",
      },
    ],
    sources: [GOOGLE_ML],
  },

  {
    id: "ia-au-quotidien",
    title: "L'IA autour de toi",
    objective: "Repérer l'IA dans ta journée et savoir quand elle décide quelque chose pour toi.",
    theme: "comprendre",
    difficulty: 1,
    format: "labo",
    durationMin: 4,
    xp: 15,
    skills: ["Repérer l'IA dans les applis du quotidien", "Savoir quand garder la main"],
    sections: [
      {
        id: "matin",
        title: "Une journée ordinaire",
        blocks: [
          {
            type: "text",
            body: "Ton réveil sonne, tu ouvres ton téléphone. En dix minutes, tu as peut-être croisé **cinq IA** sans t'en rendre compte : le tri de tes mails, ton fil d'actualité, le correcteur du clavier…",
          },
          {
            type: "check",
            question: {
              id: "ia-au-quotidien:c1",
              type: "multi",
              concept: "reperer",
              prompt: "Lesquelles utilisent de l'IA ?",
              options: [
                { id: "a", text: "Le clavier qui propose le mot suivant" },
                { id: "b", text: "Le fil d'une appli de vidéos courtes" },
                { id: "c", text: "Le bouton qui allume la lampe" },
                { id: "d", text: "La traduction automatique d'une page" },
              ],
              answer: ["a", "b", "d"],
              explanation: "Prédire un mot, choisir des vidéos, traduire : trois tâches apprises sur des exemples. L'interrupteur, lui, suit une règle simple.",
            },
          },
        ],
      },
      {
        id: "fil",
        title: "Ton fil n'est pas neutre",
        blocks: [
          {
            type: "text",
            body: "Un fil d'actualité est choisi par une IA qui cherche ce qui va **te retenir**. Plus tu regardes un sujet, plus elle t'en montre. Ce n'est pas un reflet du monde, c'est un **reflet de tes clics**.",
          },
          {
            type: "spectrum",
            title: "Qui décide ce que tu vois ?",
            poles: ["Toi", "L'IA"],
            items: [
              { label: "Une recherche précise", position: 20, detail: "Tu choisis les mots. L'IA classe les résultats." },
              { label: "Les vidéos suggérées", position: 80, detail: "Tu n'as rien demandé : elle choisit pour toi." },
              { label: "Un abonnement que tu lis en entier", position: 10, detail: "Tu as choisi la source, tu lis tout." },
            ],
            caption: "Touche chaque exemple.",
          },
        ],
      },
      {
        id: "decide",
        title: "Quand elle décide pour toi",
        blocks: [
          {
            type: "check",
            question: {
              id: "ia-au-quotidien:c2",
              type: "mcq",
              concept: "garder-la-main",
              prompt: "Un mail important est parti dans les spams. Pourquoi ?",
              options: [
                { id: "a", text: "Le filtre l'a jugé ressemblant à du spam : il se trompe parfois" },
                { id: "b", text: "Quelqu'un l'a lu et l'a déplacé" },
              ],
              answer: "a",
              explanation: "Le filtre devine à partir d'exemples. Un mail inhabituel peut tomber du mauvais côté : jette un œil aux spams de temps en temps.",
            },
          },
        ],
      },
      {
        id: "reflexes",
        title: "Garder la main",
        blocks: [
          {
            type: "steps",
            title: "Trois réflexes simples",
            items: [
              { title: "Chercher plutôt que défiler", body: "Une recherche précise te laisse le choix." },
              { title: "Varier tes sources", body: "Ton fil te montre surtout ce que tu regardes déjà." },
              { title: "Vérifier les tris automatiques", body: "Spams, photos, suggestions : l'IA se trompe parfois." },
            ],
          },
          {
            type: "check",
            question: {
              id: "ia-au-quotidien:c3",
              type: "true_false",
              concept: "garder-la-main",
              statement: "Ton fil d'actualité montre ce qui est le plus important dans le monde.",
              answer: false,
              explanation: "Il montre ce qui a le plus de chances de **te** retenir, d'après tes clics.",
            },
          },
        ],
      },
    ],
    summary: [
      "L'IA est déjà partout : clavier, fil, traduction, tri des mails.",
      "Un fil d'actualité reflète **tes clics**, pas le monde.",
      "Les tris automatiques se trompent parfois : **garde la main**.",
    ],
    questions: [
      {
        id: "ia-au-quotidien:q1",
        type: "mcq",
        concept: "reperer",
        prompt: "Laquelle de ces fonctions repose sur l'IA ?",
        options: [
          { id: "a", text: "La reconnaissance de ta voix par l'assistant du téléphone" },
          { id: "b", text: "Le minuteur de la cuisine" },
          { id: "c", text: "Le bouton volume" },
        ],
        answer: "a",
        explanation: "Comprendre une voix s'apprend sur des milliers d'enregistrements.",
      },
      {
        id: "ia-au-quotidien:q2",
        type: "fill_choice",
        concept: "fil",
        prompt: "Complète la phrase.",
        sentence: "Plus tu regardes un sujet, plus ton fil t'en ___.",
        options: [
          { id: "a", text: "montre" },
          { id: "b", text: "cache" },
        ],
        answer: "a",
        explanation: "L'IA du fil apprend de ce qui te retient, et t'en propose davantage.",
      },
      {
        id: "ia-au-quotidien:q3",
        type: "sort",
        concept: "garder-la-main",
        prompt: "Qui choisit ?",
        bins: ["Plutôt toi", "Plutôt l'IA"],
        items: [
          { id: "a", text: "Une recherche avec des mots précis" },
          { id: "b", text: "La prochaine vidéo en lecture auto" },
          { id: "c", text: "Un journal que tu lis en entier" },
          { id: "d", text: "Les publicités affichées" },
        ],
        answer: [0, 1, 0, 1],
        explanation: "Dès que tu ne demandes rien de précis, c'est l'IA qui choisit à ta place.",
      },
      {
        id: "ia-au-quotidien:q4",
        type: "true_false",
        concept: "garder-la-main",
        statement: "Il vaut la peine de vérifier ses spams de temps en temps.",
        answer: true,
        explanation: "Le filtre devine. Un vrai mail peut s'y glisser.",
      },
    ],
    reviewQuestions: [
      {
        id: "ia-au-quotidien:r1",
        type: "mcq",
        concept: "fil",
        prompt: "Ton fil ne te montre que des vidéos de cuisine. Le plus probable ?",
        options: [
          { id: "a", text: "Tu en as beaucoup regardé, l'IA t'en propose plus" },
          { id: "b", text: "Il n'existe que des vidéos de cuisine" },
        ],
        answer: "a",
        explanation: "Le fil amplifie ce qui t'a déjà retenu.",
      },
    ],
    sources: [GOOGLE_ML],
  },

  {
    id: "comment-ecrit-un-chatbot",
    title: "Comment un chatbot écrit",
    objective: "Comprendre qu'un chatbot écrit mot après mot, en choisissant à chaque fois une suite probable.",
    theme: "comprendre",
    difficulty: 1,
    format: "labo",
    durationMin: 5,
    xp: 15,
    skills: ["Expliquer comment un chatbot écrit", "Comprendre pourquoi deux réponses diffèrent"],
    sections: [
      {
        id: "continuer",
        title: "Une machine à continuer",
        blocks: [
          {
            type: "text",
            body: "Un chatbot fait une seule chose : **deviner la suite d'un texte**. Il a lu énormément de textes, alors il sait quelle suite est la plus probable.",
          },
          {
            type: "check",
            question: {
              id: "comment-ecrit-un-chatbot:v2-c1",
              type: "fill_choice",
              concept: "prediction",
              prompt: "À ton tour de deviner, comme lui.",
              sentence: "Il pleut, prends ton ___.",
              options: [
                { id: "a", text: "parapluie" },
                { id: "b", text: "maillot" },
                { id: "c", text: "vélo" },
              ],
              answer: "a",
              explanation: "Tu as choisi la suite la plus probable. C'est exactement ce que fait un chatbot, à chaque mot.",
            },
          },
        ],
      },
      {
        id: "boucle",
        title: "Mot après mot",
        blocks: [
          {
            type: "flow",
            title: "La boucle",
            loop: true,
            nodes: [
              { label: "Lire", detail: "Il lit toute la conversation, ta question comprise." },
              { label: "Calculer", detail: "Il donne une probabilité à chaque suite possible." },
              { label: "Choisir", detail: "Il prend une suite, souvent la plus probable." },
              { label: "Ajouter", detail: "Il l'ajoute à la réponse, puis recommence." },
            ],
            caption: "Touche chaque étape. Il ne revient jamais en arrière.",
          },
          {
            type: "check",
            question: {
              id: "comment-ecrit-un-chatbot:v2-c2",
              type: "true_false",
              concept: "boucle",
              statement: "Un chatbot écrit d'abord un plan, puis rédige.",
              answer: false,
              explanation: "Il enchaîne les morceaux un par un, sans plan à l'avance et sans revenir en arrière.",
            },
          },
        ],
      },
      {
        id: "tokens",
        title: "Des morceaux de mots",
        blocks: [
          {
            type: "anatomy",
            title: "Ce que voit le chatbot",
            segments: [
              { text: "Bon", label: "token", detail: "Un mot courant tient souvent en un seul morceau." },
              { text: "jour", label: "token", detail: "Un mot peut être coupé en plusieurs morceaux." },
              { text: " les", label: "token", detail: "L'espace fait souvent partie du morceau." },
              { text: " amis", label: "token", detail: "Ces morceaux s'appellent des **tokens**." },
            ],
            caption: "Touche chaque morceau surligné.",
          },
          { type: "definition", term: "Token", body: "Un **morceau de texte** : un mot entier ou un bout de mot. C'est l'unité avec laquelle le chatbot travaille." },
        ],
      },
      {
        id: "hasard",
        title: "Une part de hasard",
        blocks: [
          {
            type: "text",
            body: "Le chatbot ne prend pas toujours la suite la plus probable : il y a **un peu de hasard**. C'est pour ça que la même question peut donner **deux réponses différentes**.",
          },
          {
            type: "check",
            question: {
              id: "comment-ecrit-un-chatbot:v2-c3",
              type: "mcq",
              concept: "hasard",
              prompt: "Tu reposes la même question et la réponse change. Pourquoi ?",
              options: [
                { id: "a", text: "Il tire un peu au sort parmi les suites probables" },
                { id: "b", text: "Il a appris de ta première question" },
              ],
              answer: "a",
              explanation: "Le tirage change d'une fois à l'autre. Il n'a rien appris entre les deux.",
            },
          },
        ],
      },
      {
        id: "pour-toi",
        title: "Ce que ça change pour toi",
        blocks: [
          { type: "keypoint", body: "**Probable** ne veut pas dire **vrai**. Un ton sûr de lui ne prouve rien." },
          {
            type: "check",
            question: {
              id: "comment-ecrit-un-chatbot:v2-c4",
              type: "true_false",
              concept: "plausible",
              statement: "Une réponse bien écrite et sûre d'elle est forcément juste.",
              answer: false,
              explanation: "Le chatbot écrit ce qui sonne juste. Le style est le même quand il se trompe.",
            },
          },
        ],
      },
    ],
    summary: [
      "Un chatbot **devine la suite** d'un texte, morceau après morceau.",
      "Ces morceaux s'appellent des **tokens**. Il ne revient jamais en arrière.",
      "Un peu de **hasard** explique que deux réponses diffèrent. Probable n'est pas vrai.",
    ],
    questions: [
      {
        id: "comment-ecrit-un-chatbot:v2-q1",
        type: "mcq",
        concept: "prediction",
        prompt: "Au fond, un chatbot…",
        options: [
          { id: "a", text: "devine la suite la plus probable d'un texte" },
          { id: "b", text: "cherche la réponse dans une liste de réponses toutes faites" },
          { id: "c", text: "réfléchit comme une personne" },
        ],
        answer: "a",
        explanation: "Il continue le texte, mot après mot.",
      },
      {
        id: "comment-ecrit-un-chatbot:v2-q2",
        type: "ordering",
        concept: "boucle",
        prompt: "Remets la boucle dans l'ordre.",
        items: [
          { id: "a", text: "Lire la conversation" },
          { id: "b", text: "Calculer les suites possibles" },
          { id: "c", text: "Choisir une suite" },
          { id: "d", text: "L'ajouter à la réponse" },
        ],
        answer: ["a", "b", "c", "d"],
        explanation: "Puis il recommence, jusqu'à la fin de la réponse.",
      },
      {
        id: "comment-ecrit-un-chatbot:v2-q3",
        type: "fill_choice",
        concept: "tokens",
        prompt: "Complète la phrase.",
        sentence: "Un chatbot travaille avec des morceaux de texte appelés ___.",
        options: [
          { id: "a", text: "tokens" },
          { id: "b", text: "pixels" },
          { id: "c", text: "cookies" },
        ],
        answer: "a",
        explanation: "Un token est un mot ou un morceau de mot.",
      },
      {
        id: "comment-ecrit-un-chatbot:v2-q4",
        type: "true_false",
        concept: "hasard",
        statement: "La même question peut donner deux réponses différentes.",
        answer: true,
        explanation: "À chaque mot, il y a un petit tirage au sort parmi les suites probables.",
      },
    ],
    reviewQuestions: [
      {
        id: "comment-ecrit-un-chatbot:v2-r1",
        type: "mcq",
        concept: "prediction",
        prompt: "Le chatbot répond avec beaucoup d'assurance. Qu'en conclure ?",
        options: [
          { id: "a", text: "Rien sur l'exactitude : le ton est le même quand il se trompe" },
          { id: "b", text: "Qu'il a vérifié sa réponse" },
        ],
        answer: "a",
        explanation: "Il produit ce qui sonne juste. Vérifier, c'est ton travail.",
      },
      {
        id: "comment-ecrit-un-chatbot:v2-r2",
        type: "true_false",
        concept: "boucle",
        statement: "Un chatbot peut revenir corriger un mot qu'il vient d'écrire.",
        answer: false,
        explanation: "Chaque morceau est ajouté pour de bon. Il ne rature pas.",
      },
    ],
    sources: [ANTHROPIC_GLOSSARY],
  },
];
