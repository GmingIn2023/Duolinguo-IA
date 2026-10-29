import type { Lesson } from "../../types";

const BEST_PRACTICES = { title: "Prompting best practices (Be clear and direct, Add context, Give Claude a role, Use examples effectively)", publisher: "Anthropic, documentation Claude", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices", verified: "2026-10-14" };
const GEMINI_PROMPTING = { title: "Prompt design strategies", publisher: "Google, documentation Gemini API", url: "https://ai.google.dev/gemini-api/docs/prompting-strategies", verified: "2026-10-14" };

/** Gecko · chapitre 1 : « Le bon brief » */
export const geckoChapter1: Lesson[] = [
  {
    id: "prompt-de-travail",
    title: "Le brief complet",
    objective: "Briefer l'assistant comme un collègue brillant arrivé ce matin : contexte, tâche, public, critère de réussite.",
    theme: "prompt",
    difficulty: 2,
    format: "atelier",
    durationMin: 6,
    xp: 25,
    skills: ["Écrire un brief de travail complet", "Dire à quoi on reconnaît un bon résultat"],
    sections: [
      {
        id: "collegue",
        title: "Un collègue arrivé ce matin",
        blocks: [
          {
            type: "text",
            body: "Imagine un collègue **très compétent**, arrivé ce matin. Il ne connaît **ni ton projet, ni ton public, ni tes habitudes**. Tout ce que tu ne dis pas, il le devine, et il devine moyen.",
          },
          {
            type: "check",
            question: {
              id: "prompt-de-travail:v2-c1",
              type: "mcq",
              concept: "contexte",
              prompt: "« Fais-moi une présentation sur le recyclage. » Qu'est-ce qui manque le plus ?",
              options: [
                { id: "a", text: "Pour qui, combien de temps, et dans quel but" },
                { id: "b", text: "Une formule de politesse" },
                { id: "c", text: "Un mot-clé en plus" },
              ],
              answer: "a",
              explanation: "Une présentation de 5 minutes pour des CM2 n'a rien à voir avec 20 minutes devant un jury.",
            },
          },
        ],
      },
      {
        id: "blocs",
        title: "Les blocs d'un brief",
        blocks: [
          {
            type: "anatomy",
            title: "Un brief d'études",
            segments: [
              { text: "Je suis en L2 d'économie.", label: "Contexte", detail: "Ta situation : ce que l'assistant ne peut pas deviner." },
              { text: " Prépare 10 questions de révision sur l'inflation,", label: "Tâche", detail: "Un verbe précis et un objet précis." },
              { text: " de difficulté croissante,", label: "Contrainte", detail: "Ce qui doit être respecté." },
              { text: " à partir de mon cours ci-dessous.", label: "Matière", detail: "La source sur laquelle s'appuyer : moins d'inventions." },
              { text: " Réussi si je peux y répondre en 15 minutes.", label: "Critère", detail: "À quoi tu reconnaîtras un bon résultat." },
            ],
            caption: "Touche chaque morceau surligné.",
          },
          { type: "keypoint", body: "**Tâche et contexte** sont indispensables. Le reste sert quand il change la réponse." },
        ],
      },
      {
        id: "role",
        title: "Le rôle : utile, pas magique",
        blocks: [
          {
            type: "text",
            body: "« Tu es un recruteur exigeant » règle **le ton, le vocabulaire et l'angle**. Mais un rôle ne remplace pas le contexte, et ne rend pas les faits **plus fiables**.",
          },
          {
            type: "check",
            question: {
              id: "prompt-de-travail:v2-c2",
              type: "true_false",
              concept: "role",
              statement: "« Tu es un expert en droit » garantit une réponse juridique exacte.",
              answer: false,
              explanation: "Le rôle change la manière de répondre, pas ce que le modèle sait.",
            },
          },
        ],
      },
      {
        id: "raison",
        title: "Donner la raison",
        blocks: [
          {
            type: "compare",
            columns: ["Contrainte seule", "Contrainte et raison"],
            rows: [{ a: "N'utilise pas de jargon.", b: "N'utilise pas de jargon : le texte sera lu par des parents d'élèves." }],
          },
          {
            type: "text",
            body: "Avec la raison, l'assistant **comprend l'intention** et l'applique aussi aux cas que tu n'avais pas prévus.",
          },
        ],
      },
      {
        id: "manque",
        title: "Quand une info manque",
        blocks: [
          {
            type: "check",
            question: {
              id: "prompt-de-travail:v2-c3",
              type: "mcq",
              concept: "manque",
              prompt: "Quelle phrase ajouter pour éviter qu'il invente ?",
              options: [
                { id: "a", text: "« Si une info manque, demande-la-moi au lieu de supposer. »" },
                { id: "b", text: "« Sois créatif. »" },
              ],
              answer: "a",
              explanation: "Tu lui donnes une sortie honnête : poser une question plutôt que combler un trou.",
            },
          },
        ],
      },
      {
        id: "atelier",
        title: "À toi",
        blocks: [
          {
            type: "check",
            question: {
              id: "prompt-de-travail:v2-c4",
              type: "ordering",
              concept: "blocs",
              prompt: "Remets ce brief dans un ordre clair.",
              items: [
                { id: "a", text: "Je gère la newsletter d'une association de quartier." },
                { id: "b", text: "Rédige l'édito de novembre," },
                { id: "c", text: "en 120 mots, ton chaleureux," },
                { id: "d", text: "réussi si on a envie de venir à la fête du 18." },
              ],
              answer: ["a", "b", "c", "d"],
              explanation: "Contexte, tâche, contraintes, critère : l'ordre le plus facile à suivre.",
            },
          },
          { type: "exercise", title: "Ton brief", prompt: "Prends une vraie tâche de ta semaine et écris son brief avec : contexte, tâche, contraintes, critère de réussite.", solution: "Relis-le comme si tu étais le collègue arrivé ce matin : pourrais-tu faire le travail sans poser de question ?", minutes: 4 },
        ],
      },
    ],
    summary: [
      "Briefe comme pour un **collègue brillant arrivé ce matin**.",
      "Indispensables : **tâche et contexte**. Utiles : contraintes, matière, **critère de réussite**.",
      "Le rôle règle le ton, **pas l'exactitude**.",
      "Donne **la raison** de tes contraintes, et dis quoi faire **quand une info manque**.",
    ],
    questions: [
      {
        id: "prompt-de-travail:v2-q1",
        type: "multi",
        concept: "blocs",
        prompt: "Quels éléments sont indispensables à un brief ?",
        options: [
          { id: "a", text: "La tâche" },
          { id: "b", text: "Le contexte" },
          { id: "c", text: "Un rôle" },
          { id: "d", text: "Un exemple" },
        ],
        answer: ["a", "b"],
        explanation: "Rôle et exemple aident parfois. Sans tâche ni contexte, rien ne marche.",
      },
      {
        id: "prompt-de-travail:v2-q2",
        type: "fill_choice",
        concept: "blocs",
        prompt: "Complète le brief.",
        sentence: "« ___ si le jury comprend le projet en 2 minutes. »",
        options: [
          { id: "a", text: "Réussi" },
          { id: "b", text: "Merci" },
        ],
        answer: "a",
        explanation: "Le critère de réussite dit à quoi ressemble un bon résultat.",
      },
      {
        id: "prompt-de-travail:v2-q3",
        type: "true_false",
        concept: "role",
        statement: "Un rôle peut remplacer le contexte.",
        answer: false,
        explanation: "Le rôle donne un angle. Le contexte donne ta situation : les deux sont différents.",
      },
      {
        id: "prompt-de-travail:v2-q4",
        type: "mcq",
        concept: "raison",
        prompt: "Pourquoi expliquer la raison d'une contrainte ?",
        options: [
          { id: "a", text: "Pour qu'il applique l'intention aux cas imprévus" },
          { id: "b", text: "Pour rallonger le prompt" },
        ],
        answer: "a",
        explanation: "Il comprend le but, pas seulement la règle.",
      },
      {
        id: "prompt-de-travail:v2-q5",
        type: "mcq",
        concept: "manque",
        prompt: "Il te manque une info pour le brief. Le mieux ?",
        options: [
          { id: "a", text: "Lui demander de poser des questions avant de répondre" },
          { id: "b", text: "Le laisser deviner" },
        ],
        answer: "a",
        explanation: "Une question coûte moins cher qu'une réponse fausse.",
      },
    ],
    reviewQuestions: [
      {
        id: "prompt-de-travail:v2-r1",
        type: "mcq",
        concept: "blocs",
        prompt: "« À partir de mon cours ci-dessous » sert à…",
        options: [
          { id: "a", text: "donner la matière, pour limiter les inventions" },
          { id: "b", text: "fixer le ton" },
        ],
        answer: "a",
        explanation: "Avec ta source sous les yeux, il invente moins.",
      },
      {
        id: "prompt-de-travail:v2-r2",
        type: "true_false",
        concept: "raison",
        statement: "« Pas de jargon : c'est pour des parents d'élèves » est plus efficace que « pas de jargon ».",
        answer: true,
        explanation: "La raison l'aide à juger ce qui compte comme jargon pour ce public.",
      },
    ],
    sources: [BEST_PRACTICES, GEMINI_PROMPTING],
  },

  {
    id: "exemples-et-format",
    title: "Format et exemples",
    objective: "Obtenir exactement la forme voulue : tableau, liste, longueur, et un exemple à imiter.",
    theme: "prompt",
    difficulty: 2,
    format: "labo",
    durationMin: 5,
    xp: 25,
    skills: ["Imposer un format précis", "Donner des exemples à imiter sans qu'ils soient recopiés"],
    sections: [
      {
        id: "format",
        title: "Dire la forme",
        blocks: [
          {
            type: "text",
            body: "Le format, c'est **la forme de la réponse** : tableau, liste, nombre de mots, titres. Sans consigne, tu reçois souvent un long texte. Avec, tu reçois **ce que tu vas vraiment utiliser**.",
          },
          {
            type: "check",
            question: {
              id: "exemples-et-format:c1",
              type: "match",
              concept: "format",
              prompt: "Quel format pour quel usage ?",
              left: [
                { id: "1", text: "Comparer trois forfaits téléphone" },
                { id: "2", text: "Préparer une réunion" },
                { id: "3", text: "Un post LinkedIn" },
              ],
              right: [
                { id: "tableau", text: "Un tableau avec colonnes prix, data, engagement" },
                { id: "liste", text: "Une liste de 5 points à aborder" },
                { id: "court", text: "80 mots, une accroche, pas de hashtags" },
              ],
              answer: ["tableau", "liste", "court"],
              explanation: "Pense à ce que tu feras de la réponse, et demande cette forme-là.",
            },
          },
        ],
      },
      {
        id: "chiffrer",
        title: "Chiffrer la longueur",
        blocks: [
          {
            type: "compare",
            columns: ["Flou", "Chiffré"],
            rows: [
              { a: "Fais court.", b: "En 3 phrases." },
              { a: "Quelques idées.", b: "5 idées, une ligne chacune." },
            ],
          },
          {
            type: "check",
            question: {
              id: "exemples-et-format:c2",
              type: "true_false",
              concept: "chiffrer",
              statement: "« En 3 phrases » est plus fiable que « fais court ».",
              answer: true,
              explanation: "« Court » veut dire des choses différentes selon les gens. « 3 phrases », non.",
            },
          },
        ],
      },
      {
        id: "few-shot",
        title: "Deux ou trois exemples",
        blocks: [
          {
            type: "text",
            body: "Pour une tâche répétée, montre **deux ou trois exemples** du résultat voulu. On appelle ça le **few-shot**. Varie-les, sinon il recopie leurs points communs.",
          },
          {
            type: "example",
            label: "Few-shot pour classer des avis clients",
            good: true,
            content: "« Livraison rapide, produit conforme » → Positif\n« Toujours pas reçu après 3 semaines » → Négatif\n« Correct, sans plus » → Neutre\nClasse maintenant : « Emballage abîmé mais le produit marche »",
            note: "Trois exemples différents, et la réponse attendue est déjà dans le bon format.",
          },
        ],
      },
      {
        id: "piege",
        title: "Le piège de la copie",
        blocks: [
          {
            type: "check",
            question: {
              id: "exemples-et-format:c3",
              type: "mcq",
              concept: "piege",
              prompt: "Tes 3 exemples de légendes parlent tous de café. Le risque ?",
              options: [
                { id: "a", text: "Que toutes les nouvelles légendes parlent de café" },
                { id: "b", text: "Aucun, l'IA comprend l'intention" },
              ],
              answer: "a",
              explanation: "Varie les sujets, ou précise : « imite le style, pas le sujet ».",
            },
          },
        ],
      },
      {
        id: "structure",
        title: "Une sortie réutilisable",
        blocks: [
          { type: "keypoint", body: "Tu vas coller la réponse ailleurs ? Demande **exactement la structure** de destination : colonnes, ordre, titres." },
          {
            type: "check",
            question: {
              id: "exemples-et-format:c4",
              type: "mcq",
              concept: "format",
              prompt: "Tu veux coller la réponse dans un tableur. Tu demandes…",
              options: [
                { id: "a", text: "un tableau avec les colonnes nom, date, montant" },
                { id: "b", text: "un beau paragraphe" },
              ],
              answer: "a",
              explanation: "Les colonnes nommées se collent directement.",
            },
          },
        ],
      },
    ],
    summary: [
      "Demande **la forme dont tu as besoin** : tableau, liste, longueur.",
      "**Chiffre** la longueur : « 3 phrases » plutôt que « court ».",
      "**Deux ou trois exemples variés** montrent le résultat voulu.",
      "Précise : **le style, pas le sujet**.",
    ],
    questions: [
      {
        id: "exemples-et-format:q1",
        type: "fill_choice",
        concept: "few-shot",
        prompt: "Complète la phrase.",
        sentence: "Donner quelques exemples du résultat voulu s'appelle le ___.",
        options: [
          { id: "a", text: "few-shot" },
          { id: "b", text: "copier-coller" },
          { id: "c", text: "brainstorming" },
        ],
        answer: "a",
        explanation: "« Few-shot » : quelques exemples, en anglais.",
      },
      {
        id: "exemples-et-format:q2",
        type: "mcq",
        concept: "chiffrer",
        prompt: "Quelle consigne de longueur est la plus fiable ?",
        options: [
          { id: "a", text: "« 150 mots maximum »" },
          { id: "b", text: "« pas trop long »" },
        ],
        answer: "a",
        explanation: "Un chiffre ne laisse pas de place à l'interprétation.",
      },
      {
        id: "exemples-et-format:q3",
        type: "true_false",
        concept: "piege",
        statement: "Des exemples trop semblables peuvent être recopiés.",
        answer: true,
        explanation: "Il reprend ce qu'ils ont en commun, y compris ce que tu ne voulais pas.",
      },
      {
        id: "exemples-et-format:q4",
        type: "mcq",
        concept: "format",
        prompt: "Tu prépares un comparatif d'assurances. Le format le plus utile ?",
        options: [
          { id: "a", text: "Un tableau : une ligne par assurance, une colonne par critère" },
          { id: "b", text: "Un texte libre" },
        ],
        answer: "a",
        explanation: "Comparer se fait en lignes et colonnes.",
      },
      {
        id: "exemples-et-format:q5",
        type: "multi",
        concept: "few-shot",
        prompt: "Qu'est-ce qui rend des exemples efficaces ?",
        options: [
          { id: "a", text: "Ils sont variés" },
          { id: "b", text: "Ils sont dans le format attendu" },
          { id: "c", text: "Ils sont très nombreux, une trentaine" },
        ],
        answer: ["a", "b"],
        explanation: "Deux ou trois exemples variés, bien formatés, suffisent souvent.",
      },
    ],
    reviewQuestions: [
      {
        id: "exemples-et-format:r1",
        type: "mcq",
        concept: "piege",
        prompt: "Comment éviter qu'il recopie le sujet de tes exemples ?",
        options: [
          { id: "a", text: "Varier les sujets, ou dire « imite le style, pas le sujet »" },
          { id: "b", text: "Mettre les exemples en majuscules" },
        ],
        answer: "a",
        explanation: "Tu lui dis ce qu'il doit garder, et ce qu'il doit changer.",
      },
    ],
    sources: [BEST_PRACTICES, GEMINI_PROMPTING],
  },
];
