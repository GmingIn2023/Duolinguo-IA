import type { Lesson } from "../../types";

const BASTANI = { title: "Generative AI without guardrails can harm learning: Evidence from high school mathematics (Bastani et al., PNAS, 2025), notice et résumé", publisher: "Europe PMC", url: "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=ext_id:40560616&resultType=core&format=json", verified: "2026-10-14" };
const ROEDIGER = { title: "Test-enhanced learning: taking memory tests improves long-term retention (Roediger & Karpicke, Psychological Science, 2006), notice et résumé", publisher: "Europe PMC", url: "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=ext_id:16507066&resultType=core&format=json", verified: "2026-10-14" };
const UNESCO = { title: "Guidance for generative AI in education and research", publisher: "UNESCO", url: "https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research", verified: "2026-10-14" };
const DUNLOSKY = { title: "Improving Students' Learning With Effective Learning Techniques (Dunlosky et al., Psychological Science in the Public Interest, 2013), notice et résumé", publisher: "Europe PMC", url: "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=ext_id:26173288&resultType=core&format=json", verified: "2026-10-14" };
const IES = { title: "Organizing Instruction and Study to Improve Student Learning (guide de pratique, 2007)", publisher: "Institute of Education Sciences, What Works Clearinghouse (États-Unis)", url: "https://ies.ed.gov/ncee/wwc/PracticeGuide/1", verified: "2026-10-14" };

/** Gecko · chapitre 2 : « Étudier » */
export const geckoChapter2: Lesson[] = [
  {
    id: "tuteur-pas-copieur",
    title: "Un tuteur, pas un copieur",
    objective: "Utiliser l'IA pour apprendre vraiment : indices, explications, questions, plutôt que des réponses toutes faites.",
    theme: "outils",
    difficulty: 2,
    format: "etude-de-cas",
    durationMin: 6,
    xp: 25,
    skills: ["Demander un indice plutôt qu'une solution", "Faire corriger son propre raisonnement"],
    sections: [
      {
        id: "cas",
        title: "Deux élèves, le même exercice",
        blocks: [
          {
            type: "text",
            body: "Léa fait coller la solution par l'IA. Hugo demande **un indice**, se trompe, recommence. Le jour du contrôle, sans IA, devine qui réussit.",
          },
          {
            type: "text",
            body: "Une étude sur des lycéens a observé ce piège : avec un chatbot **sans garde-fous**, ils réussissaient mieux les exercices, puis **moins bien l'examen** sans aide.",
          },
          {
            type: "check",
            question: {
              id: "tuteur-pas-copieur:v2-c1",
              type: "true_false",
              concept: "illusion",
              statement: "Réussir un exercice avec l'IA prouve que je sais le refaire seul.",
              answer: false,
              explanation: "Ça prouve que l'IA sait le faire. Ce qui compte, c'est toi sans elle.",
            },
          },
        ],
      },
      {
        id: "effort",
        title: "Pourquoi l'effort compte",
        blocks: [
          { type: "keypoint", body: "C'est **chercher, se tromper, corriger** qui construit la mémoire. Une solution lue ne laisse presque rien." },
          {
            type: "spectrum",
            title: "Ce qui fait apprendre",
            poles: ["Peu", "Beaucoup"],
            items: [
              { label: "Lire la solution de l'IA", position: 10 },
              { label: "Demander une autre explication", position: 50 },
              { label: "Essayer, puis faire corriger ton raisonnement", position: 90 },
            ],
            caption: "Touche chaque usage.",
          },
        ],
      },
      {
        id: "demandes",
        title: "Quatre demandes de tuteur",
        blocks: [
          {
            type: "layers",
            layers: [
              { label: "Un indice", detail: "« Donne-moi un indice, pas la solution. »" },
              { label: "Une autre explication", detail: "« Explique-moi autrement, avec un exemple concret. »" },
              { label: "Des questions", detail: "« Pose-moi des questions une par une pour me faire trouver. »" },
              { label: "Corriger MON raisonnement", detail: "« Voici ma réponse. Où est mon erreur ? »" },
            ],
            caption: "Touche chaque demande.",
          },
          {
            type: "check",
            question: {
              id: "tuteur-pas-copieur:v2-c2",
              type: "mcq",
              concept: "demandes",
              prompt: "Tu bloques sur un exercice de physique. La meilleure demande ?",
              options: [
                { id: "a", text: "« Donne-moi un indice pour la première étape, pas la solution »" },
                { id: "b", text: "« Résous l'exercice »" },
              ],
              answer: "a",
              explanation: "L'indice te remet en mouvement, et c'est toi qui fais le reste.",
            },
          },
        ],
      },
      {
        id: "prompt-tuteur",
        title: "Le prompt de tuteur",
        blocks: [
          {
            type: "anatomy",
            segments: [
              { text: "Je suis en terminale.", label: "Niveau", detail: "Pour adapter les explications." },
              { text: " Voici ma tentative : [ta réponse].", label: "Ta tentative", detail: "Il corrige ton raisonnement, pas le sien." },
              { text: " Ne me donne pas la solution.", label: "L'interdit", detail: "Sans ça, il a tendance à tout résoudre." },
              { text: " Une étape à la fois, attends ma réponse.", label: "Le rythme", detail: "Pour que tu fasses le travail." },
            ],
            caption: "Touche chaque morceau.",
          },
        ],
      },
      {
        id: "regles",
        title: "Les règles du jeu",
        blocks: [
          {
            type: "check",
            question: {
              id: "tuteur-pas-copieur:v2-c3",
              type: "sort",
              concept: "regles",
              prompt: "Correct, ou à éviter ?",
              bins: ["Correct", "À éviter"],
              items: [
                { id: "a", text: "Vérifier les règles de ton école sur l'IA" },
                { id: "b", text: "Rendre un texte que tu ne sais pas expliquer" },
                { id: "c", text: "Dire comment tu as utilisé l'IA si on te le demande" },
                { id: "d", text: "Copier une solution sans la comprendre" },
              ],
              answer: [0, 1, 0, 1],
              explanation: "La règle simple : ne rends que ce que tu peux expliquer seul.",
            },
          },
        ],
      },
    ],
    summary: [
      "Réussir **avec** l'IA ne prouve pas que tu sais faire **sans**.",
      "**Chercher, se tromper, corriger** : c'est ça qui fait apprendre.",
      "Demande **un indice, une autre explication, des questions**, ou la **correction de ta réponse**.",
      "Ne rends **que ce que tu sais expliquer**, et respecte les règles de ton école.",
    ],
    questions: [
      {
        id: "tuteur-pas-copieur:v2-q1",
        type: "mcq",
        concept: "illusion",
        prompt: "Qu'ont observé les chercheurs chez des lycéens avec un chatbot sans garde-fous ?",
        options: [
          { id: "a", text: "Mieux pendant les exercices, moins bien à l'examen sans aide" },
          { id: "b", text: "Mieux partout" },
        ],
        answer: "a",
        explanation: "L'aide masquait le manque d'apprentissage.",
      },
      {
        id: "tuteur-pas-copieur:v2-q2",
        type: "multi",
        concept: "demandes",
        prompt: "Quelles demandes font de l'IA un tuteur ?",
        options: [
          { id: "a", text: "« Donne-moi un indice »" },
          { id: "b", text: "« Où est l'erreur dans ma réponse ? »" },
          { id: "c", text: "« Écris ma dissertation »" },
        ],
        answer: ["a", "b"],
        explanation: "Le tuteur t'aide à faire. Le copieur fait à ta place.",
      },
      {
        id: "tuteur-pas-copieur:v2-q3",
        type: "fill_choice",
        concept: "prompt-tuteur",
        prompt: "Complète le prompt.",
        sentence: "« Ne me donne pas la ___, une étape à la fois. »",
        options: [
          { id: "a", text: "solution" },
          { id: "b", text: "consigne" },
        ],
        answer: "a",
        explanation: "C'est l'interdit qui transforme l'assistant en tuteur.",
      },
      {
        id: "tuteur-pas-copieur:v2-q4",
        type: "true_false",
        concept: "effort",
        statement: "Se tromper puis corriger aide à retenir.",
        answer: true,
        explanation: "L'erreur corrigée est un des meilleurs moments d'apprentissage.",
      },
      {
        id: "tuteur-pas-copieur:v2-q5",
        type: "mcq",
        concept: "regles",
        prompt: "Ton prof demande si tu as utilisé l'IA. Tu…",
        options: [
          { id: "a", text: "expliques comment tu l'as utilisée" },
          { id: "b", text: "dis non, c'est plus simple" },
        ],
        answer: "a",
        explanation: "Déclarer ton usage, c'est la règle presque partout.",
      },
    ],
    reviewQuestions: [
      {
        id: "tuteur-pas-copieur:v2-r1",
        type: "mcq",
        concept: "demandes",
        prompt: "Tu as fait l'exercice et tu n'es pas sûr. Le meilleur usage de l'IA ?",
        options: [
          { id: "a", text: "Lui montrer ta réponse et demander où est l'erreur" },
          { id: "b", text: "Lui demander la solution pour comparer" },
        ],
        answer: "a",
        explanation: "Il corrige ton raisonnement : tu sais où tu as dérapé.",
      },
    ],
    sources: [BASTANI, ROEDIGER, UNESCO],
  },

  {
    id: "reviser-avec-ia",
    title: "Réviser avec l'IA",
    objective: "Te faire interroger sur TON cours, une question à la fois, et espacer tes révisions.",
    theme: "outils",
    difficulty: 2,
    format: "atelier",
    durationMin: 6,
    xp: 25,
    skills: ["Se faire interroger sur son cours", "Planifier des révisions espacées"],
    sections: [
      {
        id: "retenir",
        title: "Ce qui fait vraiment retenir",
        blocks: [
          {
            type: "text",
            body: "Deux techniques marchent le mieux : **se tester** et **espacer ses révisions**. Relire et surligner donnent confiance sur le moment, mais retiennent peu.",
          },
          {
            type: "check",
            question: {
              id: "reviser-avec-ia:v2-c1",
              type: "sort",
              concept: "techniques",
              prompt: "Efficace, ou peu efficace ?",
              bins: ["Efficace", "Peu efficace"],
              items: [
                { id: "a", text: "Se faire interroger" },
                { id: "b", text: "Relire trois fois la fiche" },
                { id: "c", text: "Réviser à plusieurs jours d'écart" },
                { id: "d", text: "Surligner tout le cours" },
              ],
              answer: [0, 1, 0, 1],
              explanation: "Se tester et espacer sont les techniques les mieux établies par la recherche.",
            },
          },
        ],
      },
      {
        id: "ton-cours",
        title: "Partir de TON cours",
        blocks: [
          {
            type: "text",
            body: "Colle **ton propre cours** et demande à l'assistant de **s'y tenir**. Il invente moins, et ses questions collent à ton programme.",
          },
          {
            type: "example",
            label: "Le prompt",
            good: true,
            content: "Voici mon cours sur la Révolution française : [cours]. Pose-moi 10 questions dessus, une à la fois. Attends ma réponse avant de corriger. Ne sors pas de ce cours.",
          },
        ],
      },
      {
        id: "fiches",
        title: "Vérifier les fiches",
        blocks: [
          {
            type: "check",
            question: {
              id: "reviser-avec-ia:v2-c2",
              type: "multi",
              concept: "fiches",
              prompt: "L'IA a fait ta fiche. Que vérifier contre le cours ?",
              options: [
                { id: "a", text: "Rien n'a été ajouté" },
                { id: "b", text: "Rien n'a été déformé" },
                { id: "c", text: "Rien d'important n'a été oublié" },
                { id: "d", text: "La fiche est jolie" },
              ],
              answer: ["a", "b", "c"],
              explanation: "Une fiche fausse, apprise par cœur, c'est pire que pas de fiche.",
            },
          },
        ],
      },
      {
        id: "interroger",
        title: "Une question à la fois",
        blocks: [
          {
            type: "dialogue",
            turns: [
              { who: "ai", text: "Question 1 : en quelle année les États généraux sont-ils convoqués ?" },
              { who: "user", text: "1788 ?" },
              { who: "ai", text: "Presque : convoqués en 1788, ils se réunissent en mai 1789. Question 2…" },
            ],
            note: "Tu réponds d'abord, il corrige ensuite. C'est l'effort de mémoire qui fait retenir.",
          },
          {
            type: "check",
            question: {
              id: "reviser-avec-ia:v2-c3",
              type: "true_false",
              concept: "interroger",
              statement: "Mieux vaut qu'il donne la réponse en même temps que la question.",
              answer: false,
              explanation: "Il faut chercher d'abord : c'est ce qui fait travailler ta mémoire.",
            },
          },
        ],
      },
      {
        id: "espacer",
        title: "Espacer",
        blocks: [
          {
            type: "flow",
            title: "Un rythme simple",
            nodes: [
              { label: "Jour 1", detail: "Tu apprends, puis tu te fais interroger." },
              { label: "Jour 3", detail: "Nouvelle série de questions, surtout sur tes erreurs." },
              { label: "Jour 7", detail: "Tout mélangé, comme le jour du contrôle." },
            ],
          },
          { type: "keypoint", body: "Garde **toi-même** la liste de tes erreurs : l'assistant ne s'en souviendra pas d'une séance à l'autre." },
        ],
      },
    ],
    summary: [
      "**Se tester** et **espacer** : les deux techniques qui marchent le mieux.",
      "Colle **ton cours** et demande de **s'y tenir**.",
      "Vérifie les fiches : **rien d'ajouté, de déformé, d'oublié**.",
      "Une question à la fois, et **ta liste d'erreurs** gardée par toi.",
    ],
    questions: [
      {
        id: "reviser-avec-ia:v2-q1",
        type: "mcq",
        concept: "techniques",
        prompt: "Quelle méthode fait le mieux retenir ?",
        options: [
          { id: "a", text: "Se faire interroger, plusieurs jours de suite" },
          { id: "b", text: "Relire la fiche juste avant le contrôle" },
        ],
        answer: "a",
        explanation: "Se tester et espacer : c'est ce que montrent les études.",
      },
      {
        id: "reviser-avec-ia:v2-q2",
        type: "true_false",
        concept: "ton-cours",
        statement: "Donner ton cours à l'IA réduit les inventions.",
        answer: true,
        explanation: "Elle s'appuie sur ce que tu lui donnes au lieu de compléter de mémoire.",
      },
      {
        id: "reviser-avec-ia:v2-q3",
        type: "fill_choice",
        concept: "interroger",
        prompt: "Complète le prompt.",
        sentence: "« Pose-moi les questions une à la fois, et ___ ma réponse avant de corriger. »",
        options: [
          { id: "a", text: "attends" },
          { id: "b", text: "devine" },
        ],
        answer: "a",
        explanation: "Tu cherches d'abord, il corrige ensuite.",
      },
      {
        id: "reviser-avec-ia:v2-q4",
        type: "ordering",
        concept: "espacer",
        prompt: "Remets le rythme dans l'ordre.",
        items: [
          { id: "a", text: "Apprendre et se faire interroger" },
          { id: "b", text: "Reprendre ses erreurs deux jours après" },
          { id: "c", text: "Tout mélanger une semaine après" },
        ],
        answer: ["a", "b", "c"],
        explanation: "Des reprises de plus en plus espacées.",
      },
      {
        id: "reviser-avec-ia:v2-q5",
        type: "mcq",
        concept: "fiches",
        prompt: "La fiche contient une date absente de ton cours. Tu…",
        options: [
          { id: "a", text: "la vérifies ou la retires" },
          { id: "b", text: "l'apprends, elle a l'air juste" },
        ],
        answer: "a",
        explanation: "Ce qui n'est pas dans ton cours a pu être inventé.",
      },
    ],
    reviewQuestions: [
      {
        id: "reviser-avec-ia:v2-r1",
        type: "true_false",
        concept: "techniques",
        statement: "Surligner est une des techniques de révision les plus efficaces.",
        answer: false,
        explanation: "C'est une des moins efficaces. Se tester fait bien mieux.",
      },
    ],
    sources: [DUNLOSKY, ROEDIGER, IES],
  },

  {
    id: "comprendre-un-cours-difficile",
    title: "Comprendre un cours difficile",
    objective: "Débloquer une notion qui résiste : changer de niveau, demander une analogie, puis l'expliquer avec tes mots.",
    theme: "outils",
    difficulty: 2,
    format: "labo",
    durationMin: 5,
    xp: 25,
    skills: ["Demander une explication à son niveau", "Vérifier sa compréhension en expliquant"],
    sections: [
      {
        id: "niveau",
        title: "Changer de niveau",
        blocks: [
          {
            type: "text",
            body: "Une notion ne passe pas ? Demande-la **à un niveau plus simple**, puis remonte. « Explique comme à un élève de 3e » n'a rien de honteux : c'est une **marche**.",
          },
          {
            type: "check",
            question: {
              id: "comprendre-un-cours-difficile:c1",
              type: "mcq",
              concept: "niveau",
              prompt: "Tu ne comprends pas « l'élasticité-prix ». Première demande ?",
              options: [
                { id: "a", text: "« Explique-la simplement, avec un exemple du quotidien »" },
                { id: "b", text: "« Donne la définition exacte du manuel »" },
              ],
              answer: "a",
              explanation: "D'abord l'idée simple, ensuite la définition précise.",
            },
          },
        ],
      },
      {
        id: "analogie",
        title: "Une analogie",
        blocks: [
          {
            type: "dialogue",
            turns: [
              { who: "user", text: "Explique-moi la mémoire RAM avec une analogie." },
              { who: "ai", text: "C'est ton bureau : plus il est grand, plus tu peux étaler de dossiers ouverts en même temps. Le disque dur, c'est l'armoire." },
            ],
          },
          {
            type: "text",
            body: "Une analogie aide à **saisir l'idée**. Mais elle a des **limites** : demande toujours « où l'analogie ne marche plus ? ».",
          },
        ],
      },
      {
        id: "expliquer",
        title: "L'expliquer avec tes mots",
        blocks: [
          { type: "keypoint", body: "Tu as compris quand tu peux **l'expliquer simplement, avec tes mots**, sans regarder." },
          {
            type: "check",
            question: {
              id: "comprendre-un-cours-difficile:c2",
              type: "mcq",
              concept: "expliquer",
              prompt: "Comment vérifier que tu as compris ?",
              options: [
                { id: "a", text: "Expliquer la notion à l'IA et lui demander ce qui manque" },
                { id: "b", text: "Relire l'explication jusqu'à ce qu'elle semble claire" },
              ],
              answer: "a",
              explanation: "Relire donne une impression de clarté. Expliquer montre ce que tu sais vraiment.",
            },
          },
        ],
      },
      {
        id: "verifier",
        title: "Revenir au cours",
        blocks: [
          {
            type: "check",
            question: {
              id: "comprendre-un-cours-difficile:c3",
              type: "true_false",
              concept: "verifier",
              statement: "L'explication de l'IA peut contredire ton cours.",
              answer: true,
              explanation: "Elle simplifie, et peut se tromper. En cas de doute, ton cours et ton prof tranchent.",
            },
          },
          {
            type: "steps",
            title: "La méthode en 4 temps",
            items: [
              { title: "Simplifier", body: "Une explication à un niveau plus bas." },
              { title: "Imager", body: "Une analogie, et ses limites." },
              { title: "Expliquer", body: "Toi, avec tes mots, à l'IA." },
              { title: "Vérifier", body: "Contre ton cours." },
            ],
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
              id: "comprendre-un-cours-difficile:c4",
              type: "ordering",
              concept: "methode",
              prompt: "Remets la méthode dans l'ordre.",
              items: [
                { id: "a", text: "Demander une explication simple" },
                { id: "b", text: "Demander une analogie" },
                { id: "c", text: "Expliquer avec tes mots" },
                { id: "d", text: "Vérifier contre le cours" },
              ],
              answer: ["a", "b", "c", "d"],
              explanation: "Simplifier, imager, expliquer, vérifier.",
            },
          },
        ],
      },
    ],
    summary: [
      "Bloqué ? Demande **un niveau plus simple**, puis remonte.",
      "Une **analogie** aide, mais demande **où elle s'arrête**.",
      "Tu as compris quand tu sais **l'expliquer avec tes mots**.",
      "En cas de doute, **ton cours tranche**.",
    ],
    questions: [
      {
        id: "comprendre-un-cours-difficile:q1",
        type: "mcq",
        concept: "niveau",
        prompt: "« Explique comme à un enfant de 10 ans » sert à…",
        options: [
          { id: "a", text: "saisir l'idée de base avant les détails" },
          { id: "b", text: "obtenir une réponse plus courte, c'est tout" },
        ],
        answer: "a",
        explanation: "C'est une marche : tu remontes ensuite vers le niveau de ton cours.",
      },
      {
        id: "comprendre-un-cours-difficile:q2",
        type: "true_false",
        concept: "analogie",
        statement: "Une analogie est toujours exacte.",
        answer: false,
        explanation: "Elle éclaire une partie de l'idée, jamais tout. D'où la question « où ça ne marche plus ? ».",
      },
      {
        id: "comprendre-un-cours-difficile:q3",
        type: "fill_choice",
        concept: "expliquer",
        prompt: "Complète la phrase.",
        sentence: "Je sais que j'ai compris quand je peux l'___ avec mes mots.",
        options: [
          { id: "a", text: "expliquer" },
          { id: "b", text: "surligner" },
        ],
        answer: "a",
        explanation: "Expliquer révèle les trous que la lecture cache.",
      },
      {
        id: "comprendre-un-cours-difficile:q4",
        type: "mcq",
        concept: "verifier",
        prompt: "L'IA et ton cours ne disent pas la même chose. Tu…",
        options: [
          { id: "a", text: "suis ton cours et poses la question à ton prof" },
          { id: "b", text: "suis l'IA, elle a lu plus de livres" },
        ],
        answer: "a",
        explanation: "Ton cours est ta référence pour l'examen, et l'IA peut se tromper.",
      },
      {
        id: "comprendre-un-cours-difficile:q5",
        type: "multi",
        concept: "methode",
        prompt: "Quelles demandes aident à comprendre ?",
        options: [
          { id: "a", text: "« Donne-moi un exemple concret »" },
          { id: "b", text: "« Voici mon explication, qu'est-ce qui manque ? »" },
          { id: "c", text: "« Fais-moi le résumé, je l'apprendrai par cœur »" },
        ],
        answer: ["a", "b"],
        explanation: "Apprendre par cœur un résumé ne fait pas comprendre.",
      },
    ],
    reviewQuestions: [
      {
        id: "comprendre-un-cours-difficile:r1",
        type: "mcq",
        concept: "analogie",
        prompt: "Après une analogie, la bonne question à poser ?",
        options: [
          { id: "a", text: "« Où cette analogie ne marche plus ? »" },
          { id: "b", text: "« Tu en as une autre plus drôle ? »" },
        ],
        answer: "a",
        explanation: "Connaître la limite de l'analogie évite une idée fausse.",
      },
    ],
    sources: [DUNLOSKY, UNESCO],
  },
];
