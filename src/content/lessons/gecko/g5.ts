import type { Lesson } from "../../types";

const EFFECTIVE_AGENTS = { title: "Building effective agents (section « Workflow: Prompt chaining »)", publisher: "Anthropic, Engineering", url: "https://www.anthropic.com/engineering/building-effective-agents", verified: "2026-10-14" };
const CHAINING = { title: "Prompting best practices (section « Chain complex prompts »)", publisher: "Anthropic, documentation Claude", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices", verified: "2026-10-14" };
const EXCEL = { title: "Overview of formulas in Excel", publisher: "Microsoft Support", url: "https://support.microsoft.com/en-us/office/overview-of-formulas-in-excel-ecfdc708-9162-49e8-b993-c311f47ca173", verified: "2026-10-29" };
const ZAPIER = { title: "Learn key concepts in Zap workflows", publisher: "Zapier, centre d'aide", url: "https://help.zapier.com/hc/en-us/articles/8496181725453", verified: "2026-10-14" };
const MAKE = { title: "Types of modules", publisher: "Make, centre d'aide", url: "https://help.make.com/types-of-modules", verified: "2026-10-14" };
const N8N = { title: "Key concept glossary", publisher: "n8n, documentation", url: "https://docs.n8n.io/glossary/", verified: "2026-10-14" };

/** Gecko · chapitre 5 : « Organiser et automatiser » */
export const geckoChapter5: Lesson[] = [
  {
    id: "decouper-une-tache",
    title: "Découper une grosse tâche",
    objective: "Transformer une grosse demande en petites étapes vérifiées, où chaque sortie nourrit la suivante.",
    theme: "workflows",
    difficulty: 2,
    format: "atelier",
    durationMin: 6,
    xp: 25,
    skills: ["Découper une tâche en étapes", "Placer des points de contrôle"],
    sections: [
      {
        id: "tout-dun-coup",
        title: "Tout d'un coup ? Ça rate",
        blocks: [
          {
            type: "text",
            body: "« Organise mon déménagement » en une seule demande donne une réponse **générale et fragile** : une erreur du début se propage partout, et tu ne décides de rien.",
          },
          {
            type: "check",
            question: {
              id: "decouper-une-tache:v2-c1",
              type: "true_false",
              concept: "pourquoi",
              statement: "Une grosse demande en un seul message donne le résultat le plus fiable.",
              answer: false,
              explanation: "Plusieurs buts mélangés, des erreurs qui se propagent : mieux vaut découper.",
            },
          },
        ],
      },
      {
        id: "etape",
        title: "Une étape bien définie",
        blocks: [
          {
            type: "anatomy",
            title: "Une étape = entrée, travail, sortie",
            segments: [
              { text: "À partir de ma liste de pièces et de meubles,", label: "Entrée", detail: "Ce que tu donnes à l'étape." },
              { text: " estime le nombre de cartons par pièce,", label: "Travail", detail: "Un seul but." },
              { text: " en tableau : pièce, cartons, objets fragiles.", label: "Sortie", detail: "Une forme précise, réutilisable à l'étape suivante." },
            ],
            caption: "Touche chaque partie.",
          },
        ],
      },
      {
        id: "enchainer",
        title: "Enchaîner",
        blocks: [
          {
            type: "flow",
            title: "Un déménagement en 3 étapes",
            nodes: [
              { label: "Inventaire", detail: "Liste des pièces → cartons par pièce." },
              { label: "Planning", detail: "Tableau des cartons → planning sur 3 semaines." },
              { label: "Messages", detail: "Planning → messages aux amis qui aident." },
            ],
            caption: "Tu corriges chaque sortie avant de la recoller à l'étape suivante.",
          },
          {
            type: "check",
            question: {
              id: "decouper-une-tache:v2-c2",
              type: "mcq",
              concept: "enchainer",
              prompt: "L'étape 1 a sous-estimé les cartons de la cuisine. Tu…",
              options: [
                { id: "a", text: "corriges le tableau, puis le recolles à l'étape 2" },
                { id: "b", text: "continues, tu verras plus tard" },
              ],
              answer: "a",
              explanation: "Une erreur corrigée tôt ne se propage pas.",
            },
          },
        ],
      },
      {
        id: "controles",
        title: "Où tu relis",
        blocks: [
          {
            type: "text",
            body: "Place un **point de contrôle** là où une erreur se propagerait, là où il faut **du vrai** (dates, prix), et **avant tout ce qui sort de chez toi** (un message envoyé).",
          },
          {
            type: "check",
            question: {
              id: "decouper-une-tache:v2-c3",
              type: "multi",
              concept: "controles",
              prompt: "Où placer un point de contrôle ?",
              options: [
                { id: "a", text: "Avant d'envoyer les messages aux amis" },
                { id: "b", text: "Sur le prix du camion de location" },
                { id: "c", text: "Sur la couleur des cartons" },
              ],
              answer: ["a", "b"],
              explanation: "Ce qui sort de chez toi et ce qui doit être exact méritent une relecture.",
            },
          },
        ],
      },
      {
        id: "role",
        title: "Qui fait quoi",
        blocks: [
          { type: "keypoint", body: "L'assistant **propose et rédige**. Toi, tu **choisis, vérifies et assumes**." },
          {
            type: "check",
            question: {
              id: "decouper-une-tache:v2-c4",
              type: "ordering",
              concept: "enchainer",
              prompt: "Remets une étape dans l'ordre.",
              items: [
                { id: "a", text: "Donner l'entrée" },
                { id: "b", text: "Obtenir la sortie" },
                { id: "c", text: "La corriger" },
                { id: "d", text: "La passer à l'étape suivante" },
              ],
              answer: ["a", "b", "c", "d"],
              explanation: "Chaque sortie validée devient l'entrée de la suite.",
            },
          },
        ],
      },
    ],
    summary: [
      "Une grosse demande d'un coup : **général, fragile, sans contrôle**.",
      "Une étape : **une entrée, un travail, une sortie** précise.",
      "Corrige chaque sortie **avant** de la passer à la suite.",
      "Contrôle là où **l'erreur se propage**, où il faut **du vrai**, et **avant d'envoyer**.",
    ],
    questions: [
      {
        id: "decouper-une-tache:v2-q1",
        type: "match",
        concept: "etape",
        prompt: "Relie chaque partie d'une étape.",
        left: [
          { id: "1", text: "« À partir de mes notes de réunion »" },
          { id: "2", text: "« liste les décisions prises »" },
          { id: "3", text: "« en tableau : décision, responsable, date »" },
        ],
        right: [
          { id: "entree", text: "Entrée" },
          { id: "travail", text: "Travail" },
          { id: "sortie", text: "Sortie" },
        ],
        answer: ["entree", "travail", "sortie"],
        explanation: "Une étape bien définie se lit en trois morceaux.",
      },
      {
        id: "decouper-une-tache:v2-q2",
        type: "true_false",
        concept: "enchainer",
        statement: "Une erreur non corrigée à l'étape 1 peut fausser les étapes suivantes.",
        answer: true,
        explanation: "Chaque étape s'appuie sur la précédente.",
      },
      {
        id: "decouper-une-tache:v2-q3",
        type: "mcq",
        concept: "controles",
        prompt: "Le point de contrôle le plus important ?",
        options: [
          { id: "a", text: "Avant d'envoyer quelque chose à quelqu'un" },
          { id: "b", text: "Après chaque phrase" },
        ],
        answer: "a",
        explanation: "Une fois envoyé, impossible de rattraper.",
      },
      {
        id: "decouper-une-tache:v2-q4",
        type: "fill_choice",
        concept: "role",
        prompt: "Complète la phrase.",
        sentence: "L'assistant propose. Moi, je ___.",
        options: [
          { id: "a", text: "décide et vérifie" },
          { id: "b", text: "valide sans lire" },
        ],
        answer: "a",
        explanation: "La responsabilité reste la tienne.",
      },
      {
        id: "decouper-une-tache:v2-q5",
        type: "mcq",
        concept: "pourquoi",
        prompt: "Pourquoi découper une grosse tâche ?",
        options: [
          { id: "a", text: "Pour garder la main et repérer les erreurs tôt" },
          { id: "b", text: "Pour écrire plus de messages" },
        ],
        answer: "a",
        explanation: "Petites étapes, petites erreurs, faciles à corriger.",
      },
    ],
    reviewQuestions: [
      {
        id: "decouper-une-tache:v2-r1",
        type: "mcq",
        concept: "etape",
        prompt: "Une bonne sortie d'étape est…",
        options: [
          { id: "a", text: "dans une forme précise, réutilisable" },
          { id: "b", text: "un long texte libre" },
        ],
        answer: "a",
        explanation: "Une forme précise se recolle facilement à l'étape suivante.",
      },
    ],
    sources: [EFFECTIVE_AGENTS, CHAINING],
  },

  {
    id: "tableurs-et-donnees",
    title: "L'IA et les tableurs",
    objective: "Faire écrire une formule, la faire expliquer, puis la tester sur quelques lignes avant de l'utiliser.",
    theme: "workflows",
    difficulty: 2,
    format: "labo",
    durationMin: 6,
    xp: 25,
    skills: ["Obtenir une formule de tableur", "Tester une formule avant de l'utiliser"],
    sections: [
      {
        id: "formule",
        title: "Demander une formule",
        blocks: [
          {
            type: "text",
            body: "Décris **tes colonnes** et **ce que tu veux calculer**. L'assistant propose une formule. Pas besoin de connaître les fonctions par cœur.",
          },
          {
            type: "example",
            label: "Le prompt",
            good: true,
            content: "Dans mon tableur : colonne A = date, colonne B = catégorie (Courses, Loisirs…), colonne C = montant. Donne une formule pour le total de la catégorie Courses.",
            note: "Les noms de colonnes et un exemple de valeur évitent les formules à côté.",
          },
        ],
      },
      {
        id: "expliquer",
        title: "La faire expliquer",
        blocks: [
          {
            type: "text",
            body: "Demande **« explique la formule morceau par morceau »**. Si tu ne comprends pas une partie, tu ne sauras pas la corriger quand elle cassera.",
          },
          {
            type: "anatomy",
            title: "Une formule décortiquée",
            segments: [
              { text: "=SOMME.SI(", label: "Fonction", detail: "Additionne seulement les lignes qui respectent une condition." },
              { text: "B:B;", label: "Où chercher", detail: "La colonne des catégories." },
              { text: "\"Courses\";", label: "Condition", detail: "La valeur à trouver." },
              { text: "C:C)", label: "Quoi additionner", detail: "La colonne des montants." },
            ],
            caption: "Touche chaque morceau.",
          },
        ],
      },
      {
        id: "tester",
        title: "Tester sur 3 lignes",
        blocks: [
          { type: "keypoint", body: "Avant de faire confiance, **teste sur quelques lignes dont tu connais le résultat**." },
          {
            type: "check",
            question: {
              id: "tableurs-et-donnees:c1",
              type: "mcq",
              concept: "tester",
              prompt: "Tu as 3 lignes Courses : 20 €, 35 €, 15 €. La formule affiche 55 €. Tu…",
              options: [
                { id: "a", text: "cherches l'erreur : le bon total est 70 €" },
                { id: "b", text: "gardes la formule, l'IA sait calculer" },
              ],
              answer: "a",
              explanation: "Un test sur des valeurs connues révèle tout de suite le problème.",
            },
          },
        ],
      },
      {
        id: "pieges",
        title: "Les pièges courants",
        blocks: [
          {
            type: "layers",
            layers: [
              { label: "Séparateur", detail: "En français, les tableurs utilisent souvent « ; » au lieu de « , »." },
              { label: "Nom des fonctions", detail: "SUM ou SOMME selon la langue du logiciel." },
              { label: "Cellules vides ou texte", detail: "Un montant tapé comme du texte n'est pas additionné." },
            ],
            caption: "Touche chaque piège.",
          },
          {
            type: "check",
            question: {
              id: "tableurs-et-donnees:c2",
              type: "true_false",
              concept: "pieges",
              statement: "Une formule peut marcher en anglais et casser dans un tableur en français.",
              answer: true,
              explanation: "Noms de fonctions et séparateurs changent selon la langue.",
            },
          },
        ],
      },
      {
        id: "donnees",
        title: "Et les données ?",
        blocks: [
          {
            type: "check",
            question: {
              id: "tableurs-et-donnees:c3",
              type: "mcq",
              concept: "donnees",
              prompt: "Ton tableur contient les salaires de l'équipe. Pour avoir la formule, tu…",
              options: [
                { id: "a", text: "décris les colonnes avec des valeurs inventées" },
                { id: "b", text: "colles le fichier entier" },
              ],
              answer: "a",
              explanation: "Pour une formule, la structure suffit. Les vraies données restent chez toi.",
            },
          },
        ],
      },
    ],
    summary: [
      "Décris **tes colonnes et ton calcul** : l'IA propose la formule.",
      "Fais-la **expliquer morceau par morceau**.",
      "**Teste sur quelques lignes** dont tu connais le résultat.",
      "Pour une formule, **la structure suffit** : garde les vraies données.",
    ],
    questions: [
      {
        id: "tableurs-et-donnees:q1",
        type: "multi",
        concept: "formule",
        prompt: "Que donner à l'IA pour une bonne formule ?",
        options: [
          { id: "a", text: "Ce que contient chaque colonne" },
          { id: "b", text: "Ce que tu veux calculer" },
          { id: "c", text: "Ton fichier complet avec données personnelles" },
        ],
        answer: ["a", "b"],
        explanation: "La structure et le but suffisent.",
      },
      {
        id: "tableurs-et-donnees:q2",
        type: "mcq",
        concept: "tester",
        prompt: "Comment savoir si une formule est juste ?",
        options: [
          { id: "a", text: "La tester sur des lignes dont tu connais le résultat" },
          { id: "b", text: "Vérifier qu'elle n'affiche pas d'erreur" },
        ],
        answer: "a",
        explanation: "Une formule peut tourner sans erreur et donner un faux résultat.",
      },
      {
        id: "tableurs-et-donnees:q3",
        type: "fill_choice",
        concept: "pieges",
        prompt: "Complète la phrase.",
        sentence: "En français, les tableurs séparent souvent les arguments avec un ___.",
        options: [
          { id: "a", text: "point-virgule" },
          { id: "b", text: "tiret" },
        ],
        answer: "a",
        explanation: "La virgule sert déjà de séparateur décimal.",
      },
      {
        id: "tableurs-et-donnees:q4",
        type: "true_false",
        concept: "expliquer",
        statement: "Mieux vaut comprendre une formule avant de s'en servir.",
        answer: true,
        explanation: "Sinon, tu ne sauras pas la réparer quand elle cassera.",
      },
      {
        id: "tableurs-et-donnees:q5",
        type: "mcq",
        concept: "donnees",
        prompt: "Pour une formule sur un fichier clients, tu donnes…",
        options: [
          { id: "a", text: "les noms de colonnes et une ligne inventée" },
          { id: "b", text: "la vraie liste des clients" },
        ],
        answer: "a",
        explanation: "La formule ne dépend que de la structure.",
      },
    ],
    reviewQuestions: [
      {
        id: "tableurs-et-donnees:r1",
        type: "mcq",
        concept: "tester",
        prompt: "La formule ne renvoie pas d'erreur. Est-elle juste ?",
        options: [
          { id: "a", text: "Pas forcément : teste sur des valeurs connues" },
          { id: "b", text: "Oui" },
        ],
        answer: "a",
        explanation: "Pas d'erreur affichée ne veut pas dire résultat correct.",
      },
    ],
    sources: [EXCEL],
  },

  {
    id: "automatiser-sans-coder",
    title: "Automatiser sans coder",
    objective: "Comprendre une automatisation (déclencheur, étapes, action) et y placer l'IA au bon endroit, avec un humain qui valide.",
    theme: "workflows",
    difficulty: 3,
    format: "atelier",
    durationMin: 8,
    xp: 30,
    skills: ["Décrire une automatisation", "Placer une étape IA et un contrôle humain"],
    sections: [
      {
        id: "anatomie",
        title: "Trois morceaux",
        blocks: [
          {
            type: "text",
            body: "Une automatisation, c'est un **déclencheur** (un mail arrive), des **étapes** (le lire, le classer) et une **action** (créer une tâche). Zapier, Make ou n8n utilisent tous cette logique.",
          },
          {
            type: "flow",
            nodes: [
              { label: "Déclencheur", detail: "Un événement : un mail, un formulaire rempli, une heure précise." },
              { label: "Étapes", detail: "Ce qu'on fait avec : filtrer, extraire, classer." },
              { label: "Action", detail: "Le résultat : une ligne de tableur, une tâche, un brouillon." },
            ],
          },
        ],
      },
      {
        id: "ou-ia",
        title: "Où mettre l'IA",
        blocks: [
          {
            type: "text",
            body: "L'IA sert à **lire du texte libre** : classer un mail, extraire une date, rédiger un brouillon. Pour tout le reste, une **règle fixe** est plus fiable.",
          },
          {
            type: "check",
            question: {
              id: "automatiser-sans-coder:v2-c1",
              type: "sort",
              concept: "ou-ia",
              prompt: "Étape IA, ou règle fixe ?",
              bins: ["Étape IA", "Règle fixe"],
              items: [
                { id: "a", text: "Deviner si un mail est une plainte" },
                { id: "b", text: "Si l'expéditeur est @banque.fr, mettre dans « Banque »" },
                { id: "c", text: "Extraire la date d'un message écrit librement" },
                { id: "d", text: "Envoyer un rappel chaque lundi à 9 h" },
              ],
              answer: [0, 1, 0, 1],
              explanation: "Texte libre : IA. Condition simple et sûre : règle fixe.",
            },
          },
        ],
      },
      {
        id: "liste-fermee",
        title: "Une réponse fermée",
        blocks: [
          {
            type: "text",
            body: "Au milieu d'une chaîne, l'étape IA doit répondre dans **une liste fermée** (« Facture », « Question », « Autre ») avec **une valeur de repli**. Sinon, l'étape suivante casse.",
          },
          {
            type: "check",
            question: {
              id: "automatiser-sans-coder:v2-c2",
              type: "mcq",
              concept: "liste-fermee",
              prompt: "Quelle consigne pour l'étape IA ?",
              options: [
                { id: "a", text: "« Réponds uniquement par Facture, Question ou Autre. En cas de doute : Autre. »" },
                { id: "b", text: "« Dis-moi ce que tu penses de ce mail. »" },
              ],
              answer: "a",
              explanation: "Une liste fermée et un repli : la suite de la chaîne sait toujours quoi faire.",
            },
          },
        ],
      },
      {
        id: "humain",
        title: "Un humain dans la boucle",
        blocks: [
          { type: "keypoint", body: "Par défaut, la chaîne **s'arrête au brouillon**. Un humain valide tout ce qui ne peut pas se défaire." },
          {
            type: "check",
            question: {
              id: "automatiser-sans-coder:v2-c3",
              type: "true_false",
              concept: "humain",
              statement: "Une IA peut répondre seule aux clients mécontents, sans relecture.",
              answer: false,
              explanation: "Un message envoyé ne se reprend pas. Brouillon d'abord, validation humaine ensuite.",
            },
          },
        ],
      },
      {
        id: "pas-automatiser",
        title: "Quand ne pas automatiser",
        blocks: [
          {
            type: "check",
            question: {
              id: "automatiser-sans-coder:v2-c4",
              type: "multi",
              concept: "pas-automatiser",
              prompt: "Lesquelles ne valent pas une automatisation ?",
              options: [
                { id: "a", text: "Une tâche qui arrive deux fois par an" },
                { id: "b", text: "Une décision à fort enjeu (licencier, refuser un prêt)" },
                { id: "c", text: "Trier 50 mails de factures par semaine" },
              ],
              answer: ["a", "b"],
              explanation: "Rare ou à fort enjeu : l'automatisation coûte plus qu'elle ne rapporte, ou fait courir un risque.",
            },
          },
        ],
      },
      {
        id: "tester",
        title: "Tester et garder une trace",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Tester sur de vrais cas", body: "Avec le résultat attendu écrit avant." },
              { title: "Prévoir les pannes", body: "Que se passe-t-il si l'IA ne répond pas ?" },
              { title: "Tenir un journal", body: "Avec une colonne « corrigé par un humain »." },
            ],
          },
        ],
      },
    ],
    summary: [
      "Une automatisation : **déclencheur, étapes, action**.",
      "L'IA pour **lire du texte libre**. Ailleurs, une **règle fixe**.",
      "Étape IA : **liste fermée et valeur de repli**.",
      "La chaîne **s'arrête au brouillon** : un humain valide.",
      "Pas d'automatisation pour le **rare** ou le **à fort enjeu**.",
    ],
    questions: [
      {
        id: "automatiser-sans-coder:v2-q1",
        type: "ordering",
        concept: "anatomie",
        prompt: "Remets dans l'ordre.",
        items: [
          { id: "a", text: "Un formulaire est envoyé" },
          { id: "b", text: "L'IA extrait le nom et la demande" },
          { id: "c", text: "Une ligne est ajoutée au tableur" },
        ],
        answer: ["a", "b", "c"],
        explanation: "Déclencheur, étape, action.",
      },
      {
        id: "automatiser-sans-coder:v2-q2",
        type: "mcq",
        concept: "ou-ia",
        prompt: "Où l'IA est-elle vraiment utile dans une automatisation ?",
        options: [
          { id: "a", text: "Pour comprendre du texte écrit librement" },
          { id: "b", text: "Pour déclencher à une heure fixe" },
        ],
        answer: "a",
        explanation: "Une heure fixe, c'est une règle simple, pas besoin d'IA.",
      },
      {
        id: "automatiser-sans-coder:v2-q3",
        type: "true_false",
        concept: "liste-fermee",
        statement: "Une valeur de repli évite que la chaîne casse quand l'IA hésite.",
        answer: true,
        explanation: "« En cas de doute : Autre » : la suite sait toujours quoi faire.",
      },
      {
        id: "automatiser-sans-coder:v2-q4",
        type: "mcq",
        concept: "humain",
        prompt: "La sortie par défaut d'une chaîne qui écrit aux clients ?",
        options: [
          { id: "a", text: "Un brouillon à valider" },
          { id: "b", text: "Un envoi automatique" },
        ],
        answer: "a",
        explanation: "Ce qui ne se reprend pas passe par un humain.",
      },
      {
        id: "automatiser-sans-coder:v2-q5",
        type: "fill_choice",
        concept: "tester",
        prompt: "Complète la phrase.",
        sentence: "Dans le journal, une colonne « corrigé par un ___ » montre où l'IA se trompe.",
        options: [
          { id: "a", text: "humain" },
          { id: "b", text: "robot" },
        ],
        answer: "a",
        explanation: "Tu sais où améliorer la consigne, ou où l'IA n'a pas sa place.",
      },
    ],
    reviewQuestions: [
      {
        id: "automatiser-sans-coder:v2-r1",
        type: "mcq",
        concept: "ou-ia",
        prompt: "« Si l'objet contient FACTURE, ranger dans Factures. » C'est…",
        options: [
          { id: "a", text: "une règle fixe, pas besoin d'IA" },
          { id: "b", text: "une étape IA" },
        ],
        answer: "a",
        explanation: "Une condition simple et sûre se fait sans IA.",
      },
    ],
    sources: [ZAPIER, MAKE, N8N],
  },
];
