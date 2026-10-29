import type { Lesson } from "../../types";

const BEST_PRACTICES = { title: "Prompting best practices (Be clear and direct, Add context, Use examples effectively)", publisher: "Anthropic, documentation Claude", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices", verified: "2026-10-14" };
const GEMINI_PROMPTING = { title: "Prompt design strategies", publisher: "Google, documentation Gemini API", url: "https://ai.google.dev/gemini-api/docs/prompting-strategies", verified: "2026-10-14" };

/** Bird · chapitre 3 : « Bien lui parler » */
export const birdChapter3: Lesson[] = [
  {
    id: "premier-prompt",
    title: "Ton premier vrai prompt",
    objective: "Écrire une demande claire avec quatre ingrédients : contexte, tâche, format, contraintes.",
    theme: "prompt",
    difficulty: 1,
    format: "atelier",
    durationMin: 5,
    xp: 15,
    skills: ["Écrire une demande claire", "Donner contexte, tâche, format et contraintes"],
    sections: [
      {
        id: "vague",
        title: "Vague donne banal",
        blocks: [
          {
            type: "text",
            body: "Une demande vague laisse mille réponses possibles. L'IA choisit alors **la plus moyenne**. Plus tu précises, plus la réponse est **faite pour toi**.",
          },
          {
            type: "check",
            question: {
              id: "premier-prompt:v2-c1",
              type: "mcq",
              concept: "precision",
              prompt: "Laquelle donnera la réponse la plus utile ?",
              options: [
                { id: "a", text: "« Idées de cadeau »" },
                { id: "b", text: "« 5 idées de cadeau pour ma mère, 60 ans, qui aime le jardin, moins de 40 € »" },
              ],
              answer: "b",
              explanation: "Pour qui, quel goût, quel budget : chaque détail élimine des réponses inutiles.",
            },
          },
        ],
      },
      {
        id: "ingredients",
        title: "Quatre ingrédients",
        blocks: [
          {
            type: "anatomy",
            title: "Un prompt en quatre morceaux",
            segments: [
              { text: "Je prépare un pique-nique pour 6 amis, dont 2 végétariens.", label: "Contexte", detail: "Pour qui, et dans quelle situation." },
              { text: " Propose un menu", label: "Tâche", detail: "Un verbe clair : propose, résume, corrige, compare." },
              { text: " sous forme de liste de courses,", label: "Format", detail: "Liste, tableau, trois phrases, un mail…" },
              { text: " facile à transporter et sans cuisson.", label: "Contraintes", detail: "Ce qui doit être respecté." },
            ],
            caption: "Touche chaque morceau surligné.",
          },
        ],
      },
      {
        id: "a-toi",
        title: "À toi de jouer",
        blocks: [
          {
            type: "check",
            question: {
              id: "premier-prompt:v2-c2",
              type: "match",
              concept: "ingredients",
              prompt: "Relie chaque morceau à son ingrédient.",
              left: [
                { id: "1", text: "« Je suis en 3e et je révise le brevet »" },
                { id: "2", text: "« Explique-moi la photosynthèse »" },
                { id: "3", text: "« en 5 points courts »" },
                { id: "4", text: "« sans mots compliqués »" },
              ],
              right: [
                { id: "contexte", text: "Contexte" },
                { id: "tache", text: "Tâche" },
                { id: "format", text: "Format" },
                { id: "contraintes", text: "Contraintes" },
              ],
              answer: ["contexte", "tache", "format", "contraintes"],
              explanation: "Tu viens d'assembler un prompt complet, en une phrase.",
            },
          },
        ],
      },
      {
        id: "phrases",
        title: "Des phrases, pas des mots-clés",
        blocks: [
          {
            type: "compare",
            columns: ["Mots-clés", "Une vraie phrase"],
            rows: [{ a: "recette poulet rapide", b: "Une recette de poulet en 20 minutes, avec ce que j'ai : riz, poivrons, crème." }],
          },
          { type: "keypoint", body: "Écris comme à **quelqu'un qui ne connaît rien de ta situation**." },
        ],
      },
      {
        id: "brouillon",
        title: "Un brouillon, pas un verdict",
        blocks: [
          {
            type: "check",
            question: {
              id: "premier-prompt:v2-c3",
              type: "true_false",
              concept: "brouillon",
              statement: "Si la première réponse ne va pas, il faut tout recommencer.",
              answer: false,
              explanation: "La première réponse est un brouillon : dis ce que tu veux changer, dans la même conversation.",
            },
          },
        ],
      },
    ],
    summary: [
      "Vague donne une réponse **moyenne**. Précis donne une réponse **pour toi**.",
      "Quatre ingrédients : **contexte, tâche, format, contraintes**.",
      "La première réponse est un **brouillon** : précise et continue.",
    ],
    questions: [
      {
        id: "premier-prompt:v2-q1",
        type: "multi",
        concept: "ingredients",
        prompt: "Quels ingrédients rendent une demande claire ?",
        options: [
          { id: "a", text: "Le contexte" },
          { id: "b", text: "Le format voulu" },
          { id: "c", text: "Des formules de politesse" },
          { id: "d", text: "Les contraintes" },
        ],
        answer: ["a", "b", "d"],
        explanation: "La politesse ne gêne pas, mais elle ne change presque rien à la réponse.",
      },
      {
        id: "premier-prompt:v2-q2",
        type: "fill_choice",
        concept: "ingredients",
        prompt: "Complète le prompt.",
        sentence: "« Résume cet article ___ » : c'est le format.",
        options: [
          { id: "a", text: "en 3 phrases" },
          { id: "b", text: "s'il te plaît" },
        ],
        answer: "a",
        explanation: "« En 3 phrases » dit quelle forme doit avoir la réponse.",
      },
      {
        id: "premier-prompt:v2-q3",
        type: "mcq",
        concept: "precision",
        prompt: "Pourquoi « Écris un poème » donne un poème banal ?",
        options: [
          { id: "a", text: "Sans précision, l'IA choisit la réponse la plus moyenne" },
          { id: "b", text: "L'IA n'aime pas la poésie" },
        ],
        answer: "a",
        explanation: "Pour qui, sur quoi, quel ton ? Sans ça, elle fait du générique.",
      },
      {
        id: "premier-prompt:v2-q4",
        type: "true_false",
        concept: "brouillon",
        statement: "On peut améliorer une réponse en continuant la même conversation.",
        answer: true,
        explanation: "Elle relit tout l'échange : dis-lui simplement ce qu'il faut changer.",
      },
    ],
    reviewQuestions: [
      {
        id: "premier-prompt:v2-r1",
        type: "mcq",
        concept: "ingredients",
        prompt: "« Pour un enfant de 8 ans » est…",
        options: [
          { id: "a", text: "du contexte" },
          { id: "b", text: "la tâche" },
        ],
        answer: "a",
        explanation: "Il dit pour qui est la réponse : c'est du contexte.",
      },
      {
        id: "premier-prompt:v2-r2",
        type: "true_false",
        concept: "precision",
        statement: "Plus une demande est précise, plus la réponse est adaptée.",
        answer: true,
        explanation: "Chaque détail utile retire des réponses à côté.",
      },
    ],
    sources: [BEST_PRACTICES, GEMINI_PROMPTING],
  },

  {
    id: "ameliorer-une-reponse",
    title: "Corriger une réponse",
    objective: "Dire précisément ce qui ne va pas pour obtenir une meilleure réponse en un message.",
    theme: "prompt",
    difficulty: 1,
    format: "labo",
    durationMin: 4,
    xp: 15,
    skills: ["Nommer le défaut d'une réponse", "Relancer avec une consigne précise"],
    sections: [
      {
        id: "nommer",
        title: "D'abord, nommer le défaut",
        blocks: [
          {
            type: "text",
            body: "« Refais » ne dit rien. Dis **ce qui ne va pas** : trop long, trop général, mauvais ton, hors sujet. Chaque défaut a **son remède**.",
          },
          {
            type: "check",
            question: {
              id: "ameliorer-une-reponse:v2-c1",
              type: "match",
              concept: "remede",
              prompt: "Relie le défaut à la bonne relance.",
              left: [
                { id: "long", text: "Trop long" },
                { id: "general", text: "Trop général" },
                { id: "ton", text: "Trop formel" },
              ],
              right: [
                { id: "a", text: "« Garde 3 phrases »" },
                { id: "b", text: "« Adapte à une famille de 4 avec un petit budget »" },
                { id: "c", text: "« Plus simple, comme à un ami »" },
              ],
              answer: ["a", "b", "c"],
              explanation: "Une relance précise corrige en un seul message.",
            },
          },
        ],
      },
      {
        id: "exemple",
        title: "Un échange réel",
        blocks: [
          {
            type: "dialogue",
            turns: [
              { who: "user", text: "Donne-moi des idées de sortie ce week-end." },
              { who: "ai", text: "Musée, cinéma, randonnée, restaurant, parc d'attractions…" },
              { who: "user", text: "Trop général. On est 2 avec un bébé, sans voiture, à Lyon, budget 20 €." },
              { who: "ai", text: "Parc de la Tête d'Or, balade sur les quais du Rhône, bibliothèque avec espace bébé…" },
            ],
            note: "Le défaut nommé (« trop général ») et les infos ajoutées font toute la différence.",
          },
        ],
      },
      {
        id: "pieges",
        title: "Les relances qui ne marchent pas",
        blocks: [
          {
            type: "check",
            question: {
              id: "ameliorer-une-reponse:v2-c2",
              type: "sort",
              concept: "relance",
              prompt: "Utile, ou pas ?",
              bins: ["Relance utile", "N'aide pas"],
              items: [
                { id: "a", text: "« Plus court, 3 points maximum »" },
                { id: "b", text: "« Refais »" },
                { id: "c", text: "« Sans viande, et pour 4 »" },
                { id: "d", text: "« Tu es sûr ? »" },
              ],
              answer: [0, 1, 0, 1],
              explanation: "Une bonne relance apporte une information. « Refais » et « Tu es sûr ? » n'en apportent aucune.",
            },
          },
        ],
      },
      {
        id: "repartir",
        title: "Quand repartir de zéro",
        blocks: [
          { type: "keypoint", body: "La conversation part dans tous les sens ? **Ouvre une nouvelle conversation** avec une demande complète." },
          {
            type: "check",
            question: {
              id: "ameliorer-une-reponse:v2-c3",
              type: "true_false",
              concept: "repartir",
              statement: "Après dix messages hors sujet, une nouvelle conversation peut aider.",
              answer: true,
              explanation: "L'IA relit tout. Un échange brouillon pèse sur les réponses suivantes.",
            },
          },
        ],
      },
    ],
    summary: [
      "Nomme le défaut : **trop long, trop général, mauvais ton, hors sujet**.",
      "Une bonne relance **apporte une information**. « Refais » n'en apporte pas.",
      "Conversation embrouillée ? **Repars de zéro** avec une demande complète.",
    ],
    questions: [
      {
        id: "ameliorer-une-reponse:v2-q1",
        type: "mcq",
        concept: "relance",
        prompt: "La réponse est bien, mais trop longue. Tu écris…",
        options: [
          { id: "a", text: "« Garde l'essentiel en 5 lignes »" },
          { id: "b", text: "« Non »" },
          { id: "c", text: "« Refais mieux »" },
        ],
        answer: "a",
        explanation: "Tu dis le défaut et le résultat voulu.",
      },
      {
        id: "ameliorer-une-reponse:v2-q2",
        type: "true_false",
        concept: "relance",
        statement: "« Tu es sûr ? » est une bonne façon de vérifier une réponse.",
        answer: false,
        explanation: "L'IA répond avec le même mécanisme. Pour vérifier, il faut une source.",
      },
      {
        id: "ameliorer-une-reponse:v2-q3",
        type: "fill_choice",
        concept: "remede",
        prompt: "Complète la relance.",
        sentence: "Réponse trop générale ? Ajoute ___.",
        options: [
          { id: "a", text: "des infos sur ta situation" },
          { id: "b", text: "un point d'exclamation" },
        ],
        answer: "a",
        explanation: "Ta situation, c'est ce qui rend la réponse spécifique.",
      },
      {
        id: "ameliorer-une-reponse:v2-q4",
        type: "mcq",
        concept: "repartir",
        prompt: "Quand ouvrir une nouvelle conversation ?",
        options: [
          { id: "a", text: "Quand l'échange est parti dans tous les sens" },
          { id: "b", text: "À chaque nouveau message" },
        ],
        answer: "a",
        explanation: "Sinon, continuer la même conversation est plus efficace.",
      },
    ],
    reviewQuestions: [
      {
        id: "ameliorer-une-reponse:v2-r1",
        type: "sort",
        concept: "relance",
        prompt: "Range chaque relance.",
        bins: ["Utile", "Inutile"],
        items: [
          { id: "a", text: "« Plus simple, pour un ado »" },
          { id: "b", text: "« Encore »" },
        ],
        answer: [0, 1],
        explanation: "La relance utile dit quoi changer.",
      },
    ],
    sources: [BEST_PRACTICES, GEMINI_PROMPTING],
  },

  {
    id: "montrer-un-exemple",
    title: "Montrer ce que tu veux",
    objective: "Donner un exemple ou un ton à imiter pour obtenir le style voulu du premier coup.",
    theme: "prompt",
    difficulty: 1,
    format: "atelier",
    durationMin: 4,
    xp: 15,
    skills: ["Donner un exemple à imiter", "Demander plusieurs versions"],
    sections: [
      {
        id: "montrer",
        title: "Montrer plutôt qu'expliquer",
        blocks: [
          {
            type: "text",
            body: "Décrire un style, c'est difficile. **Montrer un exemple**, c'est facile. L'IA imite alors **le ton et la forme** de ce que tu lui donnes.",
          },
          {
            type: "example",
            label: "Un exemple dans le prompt",
            good: true,
            content: "Écris une légende pour ma photo de randonnée, dans ce style :\n« Trois heures de montée, une vue, zéro regret. »",
            note: "Phrase courte, rythme en trois temps : l'IA va reprendre cette forme.",
          },
          {
            type: "check",
            question: {
              id: "montrer-un-exemple:c1",
              type: "true_false",
              concept: "montrer",
              statement: "Un exemple aide l'IA à comprendre le ton voulu.",
              answer: true,
              explanation: "Un exemple montre d'un coup le ton, la longueur et la forme.",
            },
          },
        ],
      },
      {
        id: "copier",
        title: "Ce qu'elle copie",
        blocks: [
          {
            type: "check",
            question: {
              id: "montrer-un-exemple:c2",
              type: "mcq",
              concept: "piege",
              prompt: "Ton exemple parle de randonnée. Tu demandes une légende de plage. Le risque ?",
              options: [
                { id: "a", text: "Qu'elle reprenne aussi des mots de randonnée" },
                { id: "b", text: "Aucun" },
              ],
              answer: "a",
              explanation: "Précise ce qu'il faut garder : « garde le style, pas le sujet ».",
            },
          },
          { type: "keypoint", body: "Dis ce qu'il faut garder : **le style, pas le sujet**." },
        ],
      },
      {
        id: "versions",
        title: "Demander plusieurs versions",
        blocks: [
          {
            type: "text",
            body: "Tu ne sais pas ce que tu veux ? Demande **trois versions différentes** : une drôle, une sobre, une poétique. Puis choisis.",
          },
          {
            type: "spectrum",
            title: "Trois tons pour la même légende",
            poles: ["Sobre", "Drôle"],
            items: [
              { label: "« Sommet atteint. »", position: 10 },
              { label: "« Trois heures de montée, zéro regret. »", position: 50 },
              { label: "« Mes jambes ne me parlent plus. »", position: 90 },
            ],
            caption: "Touche chaque version.",
          },
        ],
      },
      {
        id: "role",
        title: "Donner un rôle",
        blocks: [
          {
            type: "check",
            question: {
              id: "montrer-un-exemple:c3",
              type: "mcq",
              concept: "role",
              prompt: "« Tu es un prof de maths patient. Explique-moi les fractions. » Le rôle sert à…",
              options: [
                { id: "a", text: "régler le ton et le niveau d'explication" },
                { id: "b", text: "rendre l'IA plus intelligente" },
              ],
              answer: "a",
              explanation: "Un rôle oriente le style. Il ne rajoute pas de connaissances.",
            },
          },
        ],
      },
    ],
    summary: [
      "**Montre un exemple** : l'IA imite son ton et sa forme.",
      "Dis ce qu'il faut garder : **le style, pas le sujet**.",
      "Pas sûr ? Demande **trois versions** et choisis.",
    ],
    questions: [
      {
        id: "montrer-un-exemple:q1",
        type: "mcq",
        concept: "montrer",
        prompt: "Tu veux un mail dans ton style habituel. Le plus efficace ?",
        options: [
          { id: "a", text: "Coller un de tes anciens mails en exemple" },
          { id: "b", text: "Écrire « fais naturel »" },
        ],
        answer: "a",
        explanation: "Ton vrai mail montre ton style mieux qu'un adjectif.",
      },
      {
        id: "montrer-un-exemple:q2",
        type: "true_false",
        concept: "piege",
        statement: "L'IA peut recopier le sujet de ton exemple sans que tu le veuilles.",
        answer: true,
        explanation: "D'où la précision : « garde le style, pas le sujet ».",
      },
      {
        id: "montrer-un-exemple:q3",
        type: "fill_choice",
        concept: "role",
        prompt: "Complète la phrase.",
        sentence: "« Tu es un coach sportif bienveillant » donne un ___ à l'IA.",
        options: [
          { id: "a", text: "rôle" },
          { id: "b", text: "mot de passe" },
        ],
        answer: "a",
        explanation: "Le rôle règle le ton de la réponse.",
      },
      {
        id: "montrer-un-exemple:q4",
        type: "mcq",
        concept: "versions",
        prompt: "Tu hésites sur le ton d'une invitation. Tu demandes…",
        options: [
          { id: "a", text: "trois versions avec des tons différents" },
          { id: "b", text: "la meilleure version possible" },
        ],
        answer: "a",
        explanation: "Comparer plusieurs versions t'aide à savoir ce que tu veux.",
      },
    ],
    reviewQuestions: [
      {
        id: "montrer-un-exemple:r1",
        type: "true_false",
        concept: "role",
        statement: "Dire « tu es un expert » rend les réponses forcément exactes.",
        answer: false,
        explanation: "Le rôle change le ton, pas ce que l'IA sait.",
      },
    ],
    sources: [BEST_PRACTICES, GEMINI_PROMPTING],
  },
];
