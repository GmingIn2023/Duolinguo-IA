import type { Lesson } from "../../types";

const BEST_PRACTICES = { title: "Prompting best practices (Be clear and direct, Use examples effectively, Long context prompting)", publisher: "Anthropic, documentation Claude", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices", verified: "2026-10-14" };
const CNIL_IAG = { title: "Les questions-réponses de la CNIL sur l'utilisation d'un système d'IA générative", publisher: "CNIL", url: "https://www.cnil.fr/fr/les-questions-reponses-de-la-cnil-sur-lutilisation-dun-systeme-dia-generative", verified: "2026-10-13" };
const REDUCE_HALLUCINATIONS = { title: "Reduce hallucinations (Use direct quotes for factual grounding)", publisher: "Anthropic, documentation Claude", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations", verified: "2026-10-14" };

/** Gecko · chapitre 3 : « Écrire et résumer » */
export const geckoChapter3: Lesson[] = [
  {
    id: "rediger-resumer",
    title: "Rédiger avec tes idées",
    objective: "Faire mettre en forme TES idées, dans TON style, et relire ce qui part sous ton nom.",
    theme: "outils",
    difficulty: 2,
    format: "atelier",
    durationMin: 6,
    xp: 25,
    skills: ["Faire rédiger à partir de ses idées", "Garder son style"],
    sections: [
      {
        id: "idees",
        title: "Tes idées d'abord",
        blocks: [
          {
            type: "text",
            body: "Donne **tes idées en vrac**, puis demande de les mettre en forme. Ajoute : « **n'ajoute aucune idée** ». L'assistant écrit, mais **c'est toi qui décides du fond**.",
          },
          {
            type: "check",
            question: {
              id: "rediger-resumer:v2-c1",
              type: "mcq",
              concept: "idees",
              prompt: "Tu dois écrire un mot d'excuse pour une réunion manquée. Le mieux ?",
              options: [
                { id: "a", text: "Donner tes points (raison, regret, proposition de rattrapage) et faire rédiger" },
                { id: "b", text: "« Écris un mot d'excuse »" },
              ],
              answer: "a",
              explanation: "Avec tes points, le mot dit ce que tu veux dire. Sinon, il invente une raison.",
            },
          },
        ],
      },
      {
        id: "style",
        title: "Ton style, pas le sien",
        blocks: [
          {
            type: "text",
            body: "Sans indication, l'IA écrit **dans son style à elle** : poli, un peu long, plein de formules. Colle **un ou deux de tes textes** en exemple : il imite bien mieux qu'avec « sois naturel ».",
          },
          {
            type: "check",
            question: {
              id: "rediger-resumer:v2-c2",
              type: "true_false",
              concept: "style",
              statement: "« Écris de façon naturelle » suffit pour qu'il écrive comme moi.",
              answer: false,
              explanation: "« Naturel » est vague. Tes propres textes sont l'exemple le plus précis.",
            },
          },
        ],
      },
      {
        id: "raccourcir",
        title: "Raccourcir sans perdre",
        blocks: [
          {
            type: "compare",
            columns: ["Risqué", "Sûr"],
            rows: [{ a: "Raccourcis ce texte.", b: "Raccourcis à 100 mots. Garde la date, le lieu et la demande de réponse." }],
          },
          { type: "keypoint", body: "Quand tu fais raccourcir, dis **ce qui doit rester**." },
        ],
      },
      {
        id: "relire",
        title: "Relire avant d'envoyer",
        blocks: [
          {
            type: "check",
            question: {
              id: "rediger-resumer:v2-c3",
              type: "multi",
              concept: "relire",
              prompt: "Avant d'envoyer le texte, que relis-tu ?",
              options: [
                { id: "a", text: "Ce qu'il a ajouté que tu n'avais pas dit" },
                { id: "b", text: "Les noms, dates et chiffres" },
                { id: "c", text: "Le ton : est-ce que ça te ressemble ?" },
              ],
              answer: ["a", "b", "c"],
              explanation: "Le texte part sous ton nom : chaque mot t'engage.",
            },
          },
        ],
      },
      {
        id: "atelier",
        title: "À toi",
        blocks: [
          {
            type: "exercise",
            title: "Un vrai texte de ta semaine",
            prompt: "Écris 3 idées en vrac pour un message que tu dois envoyer. Colle un ancien message à toi comme exemple de style. Demande la mise en forme, sans ajout d'idée.",
            solution: "Compare le résultat à tes 3 idées : tout y est, rien de plus ? Le ton te ressemble ? Si non, dis précisément quoi changer.",
            minutes: 4,
          },
          {
            type: "check",
            question: {
              id: "rediger-resumer:v2-c4",
              type: "mcq",
              concept: "idees",
              prompt: "Il a ajouté une promesse que tu n'as pas faite. Tu…",
              options: [
                { id: "a", text: "la retires avant d'envoyer" },
                { id: "b", text: "la laisses, ça fait sérieux" },
              ],
              answer: "a",
              explanation: "Ce qu'il ajoute t'engage. Garde uniquement ce que tu as décidé.",
            },
          },
        ],
      },
    ],
    summary: [
      "Donne **tes idées**, et précise **« n'ajoute aucune idée »**.",
      "Pour ton style, colle **un de tes textes** en exemple.",
      "Pour raccourcir, dis **ce qui doit rester**.",
      "Relis tout : **le texte part sous ton nom**.",
    ],
    questions: [
      {
        id: "rediger-resumer:v2-q1",
        type: "mcq",
        concept: "idees",
        prompt: "Qui décide du contenu d'un texte rédigé avec l'IA ?",
        options: [
          { id: "a", text: "Toi : l'IA met en forme" },
          { id: "b", text: "L'IA : elle sait mieux écrire" },
        ],
        answer: "a",
        explanation: "Tu apportes le fond, elle aide sur la forme.",
      },
      {
        id: "rediger-resumer:v2-q2",
        type: "fill_choice",
        concept: "style",
        prompt: "Complète la phrase.",
        sentence: "Pour qu'il écrive comme moi, je colle un de mes ___ en exemple.",
        options: [
          { id: "a", text: "textes" },
          { id: "b", text: "mots de passe" },
        ],
        answer: "a",
        explanation: "Un exemple réel montre ton style mieux qu'un adjectif.",
      },
      {
        id: "rediger-resumer:v2-q3",
        type: "true_false",
        concept: "raccourcir",
        statement: "En raccourcissant, l'IA peut retirer une info importante.",
        answer: true,
        explanation: "D'où la consigne : « garde la date, le lieu, la demande ».",
      },
      {
        id: "rediger-resumer:v2-q4",
        type: "mcq",
        concept: "relire",
        prompt: "Le message mentionne « jeudi 14 » mais ta réunion est mercredi. Le plus probable ?",
        options: [
          { id: "a", text: "Une erreur ajoutée en reformulant : il faut relire" },
          { id: "b", text: "Ta réunion a changé de jour" },
        ],
        answer: "a",
        explanation: "Dates et chiffres sont les premières choses à relire.",
      },
      {
        id: "rediger-resumer:v2-q5",
        type: "mcq",
        concept: "style",
        prompt: "Le texte est trop « IA » (long, plein de formules). Tu demandes…",
        options: [
          { id: "a", text: "« Plus court, phrases simples, comme mon exemple »" },
          { id: "b", text: "« Sois humain »" },
        ],
        answer: "a",
        explanation: "Des consignes précises et un exemple marchent mieux qu'un souhait vague.",
      },
    ],
    reviewQuestions: [
      {
        id: "rediger-resumer:v2-r1",
        type: "mcq",
        concept: "raccourcir",
        prompt: "La meilleure consigne pour raccourcir ?",
        options: [
          { id: "a", text: "« 80 mots, garde la date et le lieu »" },
          { id: "b", text: "« Plus court »" },
        ],
        answer: "a",
        explanation: "Une longueur chiffrée et ce qui doit rester.",
      },
    ],
    sources: [BEST_PRACTICES, CNIL_IAG],
  },

  {
    id: "mails-et-messages",
    title: "Mails et messages pro",
    objective: "Écrire un mail délicat avec l'IA : le bon ton, la demande claire, et rien d'inventé.",
    theme: "outils",
    difficulty: 2,
    format: "labo",
    durationMin: 5,
    xp: 25,
    skills: ["Régler le ton d'un message", "Rendre une demande claire"],
    sections: [
      {
        id: "but",
        title: "Un mail, un but",
        blocks: [
          {
            type: "text",
            body: "Avant d'écrire, une question : **qu'est-ce que la personne doit faire après avoir lu ?** Répondre, valider, venir, payer. Dis-le à l'assistant.",
          },
          {
            type: "check",
            question: {
              id: "mails-et-messages:c1",
              type: "mcq",
              concept: "but",
              prompt: "Quelle phrase rend le but clair ?",
              options: [
                { id: "a", text: "« Peux-tu me confirmer ta présence avant vendredi ? »" },
                { id: "b", text: "« N'hésite pas à revenir vers moi si besoin. »" },
              ],
              answer: "a",
              explanation: "Une action et une date : le lecteur sait quoi faire.",
            },
          },
        ],
      },
      {
        id: "ton",
        title: "Régler le ton",
        blocks: [
          {
            type: "spectrum",
            title: "Le même refus, trois tons",
            poles: ["Sec", "Chaleureux"],
            items: [
              { label: "« Impossible cette semaine. »", position: 10 },
              { label: "« Je ne peux pas cette semaine. La suivante ? »", position: 50 },
              { label: "« Merci de penser à moi ! Cette semaine est pleine, mais la suivante me va très bien. »", position: 90 },
            ],
            caption: "Touche chaque version. Dis à l'assistant où tu veux te placer.",
          },
        ],
      },
      {
        id: "delicat",
        title: "Un mail délicat",
        blocks: [
          {
            type: "anatomy",
            title: "Le prompt",
            segments: [
              { text: "Je dois dire à un client que la livraison aura 2 semaines de retard.", label: "Situation", detail: "Les faits, sans les embellir." },
              { text: " Il est déjà mécontent.", label: "Contexte", detail: "Ce qui change le ton à adopter." },
              { text: " Ton calme et professionnel, sans excuses en boucle.", label: "Ton", detail: "Une indication précise." },
              { text: " Propose un geste : livraison offerte.", label: "Contenu", detail: "Ce que TU décides de proposer." },
              { text: " 120 mots max.", label: "Format" },
            ],
            caption: "Touche chaque morceau.",
          },
          { type: "keypoint", body: "Un geste commercial, une date, un prix : **c'est toi qui décides**, jamais l'assistant." },
        ],
      },
      {
        id: "pieges",
        title: "Les pièges",
        blocks: [
          {
            type: "check",
            question: {
              id: "mails-et-messages:c2",
              type: "sort",
              concept: "pieges",
              prompt: "À garder, ou à corriger ?",
              bins: ["À garder", "À corriger"],
              items: [
                { id: "a", text: "Une date que tu as donnée" },
                { id: "b", text: "Un remboursement que tu n'as pas promis" },
                { id: "c", text: "Une phrase claire sur la suite" },
                { id: "d", text: "Trois paragraphes d'excuses" },
              ],
              answer: [0, 1, 0, 1],
              explanation: "Une promesse inventée t'engage. Trop d'excuses affaiblit le message.",
            },
          },
        ],
      },
      {
        id: "relecture",
        title: "La relecture finale",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Le but", body: "Le lecteur sait-il quoi faire ?" },
              { title: "Les faits", body: "Noms, dates, montants : tous justes ?" },
              { title: "Le ton", body: "Tu le dirais comme ça, à l'oral ?" },
            ],
          },
          {
            type: "check",
            question: {
              id: "mails-et-messages:c3",
              type: "true_false",
              concept: "relecture",
              statement: "Un mail rédigé par l'IA peut partir sans relecture s'il a l'air bien.",
              answer: false,
              explanation: "Il part sous ton nom. Trente secondes de relecture évitent bien des soucis.",
            },
          },
        ],
      },
    ],
    summary: [
      "Un mail, **un but** : ce que le lecteur doit faire, et quand.",
      "Dis **le ton** voulu, précisément.",
      "Gestes, dates, prix : **c'est toi qui décides**.",
      "Relis **le but, les faits, le ton** avant d'envoyer.",
    ],
    questions: [
      {
        id: "mails-et-messages:q1",
        type: "mcq",
        concept: "but",
        prompt: "Quelle info donner en premier à l'assistant pour un mail ?",
        options: [
          { id: "a", text: "Ce que le lecteur doit faire après l'avoir lu" },
          { id: "b", text: "La police d'écriture" },
        ],
        answer: "a",
        explanation: "Le but organise tout le message.",
      },
      {
        id: "mails-et-messages:q2",
        type: "true_false",
        concept: "pieges",
        statement: "L'assistant peut ajouter une promesse que tu n'as pas faite.",
        answer: true,
        explanation: "Il cherche à faire « bien ». Relis chaque engagement.",
      },
      {
        id: "mails-et-messages:q3",
        type: "fill_choice",
        concept: "ton",
        prompt: "Complète la consigne.",
        sentence: "« Ton ___, sans excuses en boucle. »",
        options: [
          { id: "a", text: "calme et professionnel" },
          { id: "b", text: "comme tu veux" },
        ],
        answer: "a",
        explanation: "Un ton précis donne un résultat précis.",
      },
      {
        id: "mails-et-messages:q4",
        type: "multi",
        concept: "relecture",
        prompt: "Que vérifier avant d'envoyer ?",
        options: [
          { id: "a", text: "Les dates et montants" },
          { id: "b", text: "Que le lecteur sait quoi faire" },
          { id: "c", text: "Le nombre de mots exact" },
        ],
        answer: ["a", "b"],
        explanation: "Les faits et le but d'abord. Le nombre de mots exact compte rarement.",
      },
      {
        id: "mails-et-messages:q5",
        type: "mcq",
        concept: "pieges",
        prompt: "Le brouillon contient trois paragraphes d'excuses. Tu demandes…",
        options: [
          { id: "a", text: "« Une seule phrase d'excuse, puis la solution »" },
          { id: "b", text: "« Encore plus d'excuses »" },
        ],
        answer: "a",
        explanation: "Une excuse claire, puis l'action : c'est plus crédible.",
      },
    ],
    reviewQuestions: [
      {
        id: "mails-et-messages:r1",
        type: "mcq",
        concept: "but",
        prompt: "« N'hésite pas à revenir vers moi » est…",
        options: [
          { id: "a", text: "une formule qui ne demande rien de précis" },
          { id: "b", text: "un but clair" },
        ],
        answer: "a",
        explanation: "Préfère une action et une date.",
      },
    ],
    sources: [BEST_PRACTICES],
  },

  {
    id: "resumer-un-long-document",
    title: "Résumer un long document",
    objective: "Faire résumer un document long en gardant ce qui compte, et vérifier le résumé en trois passes.",
    theme: "outils",
    difficulty: 2,
    format: "atelier",
    durationMin: 6,
    xp: 25,
    skills: ["Demander un résumé ciblé", "Vérifier un résumé contre le texte"],
    sections: [
      {
        id: "lecteur",
        title: "Un résumé a un lecteur",
        blocks: [
          {
            type: "text",
            body: "Un bon résumé dépend de **qui le lit**. Précise trois choses : **pour qui**, **quelle longueur** chiffrée, et **ce qu'il faut garder en priorité**.",
          },
          {
            type: "check",
            question: {
              id: "resumer-un-long-document:c1",
              type: "mcq",
              concept: "cible",
              prompt: "Quelle demande donnera le résumé le plus utile ?",
              options: [
                { id: "a", text: "« Résume ce rapport pour mon manager, en 5 points : décisions, chiffres, risques »" },
                { id: "b", text: "« Résume ce rapport »" },
              ],
              answer: "a",
              explanation: "Lecteur, longueur, priorités : le résumé devient ciblé.",
            },
          },
        ],
      },
      {
        id: "trahisons",
        title: "Trois façons de trahir",
        blocks: [
          {
            type: "layers",
            title: "Ce qu'un résumé peut faire",
            layers: [
              { label: "Oublier", detail: "Un point important disparaît." },
              { label: "Aplatir", detail: "« Pourrait » devient « va ». Une nuance s'efface." },
              { label: "Ajouter", detail: "Un élément absent du texte apparaît." },
            ],
            caption: "Touche chaque défaut. Aucun ne se voit sans revenir au texte.",
          },
          {
            type: "check",
            question: {
              id: "resumer-un-long-document:c2",
              type: "mcq",
              concept: "trahisons",
              prompt: "Le texte dit « les ventes pourraient baisser ». Le résumé dit « les ventes vont baisser ». C'est…",
              options: [
                { id: "a", text: "une nuance aplatie" },
                { id: "b", text: "un résumé fidèle" },
              ],
              answer: "a",
              explanation: "Une possibilité est devenue une certitude : le sens a changé.",
            },
          },
        ],
      },
      {
        id: "citations",
        title: "Demander les citations",
        blocks: [
          {
            type: "text",
            body: "Ajoute : « **pour chaque point, cite la phrase exacte du document** ». Tu vérifies alors en un coup d'œil, et il invente moins.",
          },
          {
            type: "check",
            question: {
              id: "resumer-un-long-document:c3",
              type: "true_false",
              concept: "citations",
              statement: "Demander la phrase source de chaque point facilite la vérification.",
              answer: true,
              explanation: "Tu retrouves la phrase dans le document, et tu vois tout de suite si elle dit bien ça.",
            },
          },
        ],
      },
      {
        id: "trois-passes",
        title: "Vérifier en trois passes",
        blocks: [
          {
            type: "flow",
            nodes: [
              { label: "Du résumé au texte", detail: "Chaque point se retrouve-t-il dans le document ?" },
              { label: "Du texte au résumé", detail: "Les titres et conclusions du document sont-ils dans le résumé ?" },
              { label: "Les mots de prudence", detail: "« Pourrait », « environ », « selon » : sont-ils restés ?" },
            ],
          },
        ],
      },
      {
        id: "long",
        title: "Très long ? Par morceaux",
        blocks: [
          { type: "keypoint", body: "Document très long ? Fais résumer **partie par partie**, puis **assemble**." },
          {
            type: "check",
            question: {
              id: "resumer-un-long-document:c4",
              type: "mcq",
              concept: "long",
              prompt: "Un document de 300 pages. La meilleure approche ?",
              options: [
                { id: "a", text: "Résumer chapitre par chapitre, puis faire une synthèse" },
                { id: "b", text: "Tout coller d'un coup et espérer" },
              ],
              answer: "a",
              explanation: "Par morceaux, chaque partie est mieux traitée, et tu vérifies plus facilement.",
            },
          },
        ],
      },
    ],
    summary: [
      "Précise **pour qui, quelle longueur, quelles priorités**.",
      "Un résumé peut **oublier, aplatir, ajouter**.",
      "Demande **la phrase source** de chaque point.",
      "Vérifie en **trois passes**. Très long ? **Par morceaux**.",
    ],
    questions: [
      {
        id: "resumer-un-long-document:q1",
        type: "multi",
        concept: "cible",
        prompt: "Que préciser pour un bon résumé ?",
        options: [
          { id: "a", text: "Pour qui" },
          { id: "b", text: "Quelle longueur" },
          { id: "c", text: "Ce qu'il faut garder" },
          { id: "d", text: "La couleur du texte" },
        ],
        answer: ["a", "b", "c"],
        explanation: "Lecteur, longueur, priorités.",
      },
      {
        id: "resumer-un-long-document:q2",
        type: "match",
        concept: "trahisons",
        prompt: "Relie chaque défaut à son exemple.",
        left: [
          { id: "1", text: "Oublier" },
          { id: "2", text: "Aplatir" },
          { id: "3", text: "Ajouter" },
        ],
        right: [
          { id: "a", text: "La conclusion du rapport n'apparaît pas" },
          { id: "b", text: "« Probablement » devient « certainement »" },
          { id: "c", text: "Un chiffre absent du texte apparaît" },
        ],
        answer: ["a", "b", "c"],
        explanation: "Trois défauts, un seul remède : revenir au texte.",
      },
      {
        id: "resumer-un-long-document:q3",
        type: "true_false",
        concept: "trois-passes",
        statement: "Il suffit de lire le résumé pour savoir s'il est fidèle.",
        answer: false,
        explanation: "Les défauts ne se voient qu'en comparant au texte.",
      },
      {
        id: "resumer-un-long-document:q4",
        type: "fill_choice",
        concept: "citations",
        prompt: "Complète la consigne.",
        sentence: "« Pour chaque point, cite la ___ exacte du document. »",
        options: [
          { id: "a", text: "phrase" },
          { id: "b", text: "couleur" },
        ],
        answer: "a",
        explanation: "La phrase source rend la vérification rapide.",
      },
      {
        id: "resumer-un-long-document:q5",
        type: "mcq",
        concept: "long",
        prompt: "Pourquoi résumer un long document par morceaux ?",
        options: [
          { id: "a", text: "Chaque partie est mieux traitée et plus facile à vérifier" },
          { id: "b", text: "Parce que c'est plus rapide à taper" },
        ],
        answer: "a",
        explanation: "Moins de texte à la fois, moins d'oublis.",
      },
    ],
    reviewQuestions: [
      {
        id: "resumer-un-long-document:r1",
        type: "mcq",
        concept: "trahisons",
        prompt: "« Selon l'étude, environ 30 % » devient « 30 % ». Quel défaut ?",
        options: [
          { id: "a", text: "Une nuance aplatie" },
          { id: "b", text: "Aucun" },
        ],
        answer: "a",
        explanation: "« Environ » et « selon » ont disparu : le chiffre paraît plus sûr qu'il ne l'est.",
      },
    ],
    sources: [BEST_PRACTICES, REDUCE_HALLUCINATIONS],
  },
];
