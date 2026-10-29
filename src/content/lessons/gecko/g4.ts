import type { Lesson } from "../../types";

const REDUCE_HALLUCINATIONS = { title: "Reduce hallucinations", publisher: "Anthropic (documentation)", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations", verified: "2026-10-14" };
const JI = { title: "Survey of Hallucination in Natural Language Generation", publisher: "Ji et al., ACM Computing Surveys (arXiv 2202.03629)", url: "https://arxiv.org/abs/2202.03629", verified: "2026-10-14" };
const SAMSUNG = { title: "Samsung bans use of generative AI tools like ChatGPT after April internal data leak", publisher: "TechCrunch (2 mai 2023)", url: "https://techcrunch.com/2023/05/02/samsung-bans-use-of-generative-ai-tools-like-chatgpt-after-april-internal-data-leak/", verified: "2026-10-14" };
const RGPD = { title: "Règlement général sur la protection des données (UE) 2016/679, article 4 (pseudonymisation) et considérant 26 (données anonymes)", publisher: "EUR-Lex, Journal officiel de l'Union européenne", url: "https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32016R0679", verified: "2026-10-14" };
const UNESCO = { title: "Guidance for generative AI in education and research", publisher: "UNESCO", url: "https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research", verified: "2026-10-14" };

/** Gecko · chapitre 4 : « Vérifier et protéger » */
export const geckoChapter4: Lesson[] = [
  {
    id: "relire-ia",
    title: "Relire une réponse d'IA",
    objective: "Relire avec cinq contrôles, et savoir quand vérifier, réécrire ou retirer.",
    theme: "confiance",
    difficulty: 2,
    format: "atelier",
    durationMin: 6,
    xp: 25,
    skills: ["Relire avec une checklist", "Décider quoi vérifier, réécrire ou retirer"],
    sections: [
      {
        id: "forme",
        title: "Bien écrit n'est pas juste",
        blocks: [
          {
            type: "text",
            body: "Une réponse **fluide et assurée** donne envie d'y croire. Mais **la forme ne dit rien du fond** : le style est le même quand c'est faux.",
          },
          {
            type: "check",
            question: {
              id: "relire-ia:v2-c1",
              type: "true_false",
              concept: "forme",
              statement: "Une réponse sans faute d'orthographe est plus souvent exacte.",
              answer: false,
              explanation: "L'IA écrit toujours proprement. L'orthographe ne mesure pas l'exactitude.",
            },
          },
        ],
      },
      {
        id: "cinq",
        title: "Les cinq contrôles",
        blocks: [
          {
            type: "layers",
            layers: [
              { label: "Faits et chiffres", detail: "Sont-ils vrais ? Vérifiables à une source ?" },
              { label: "Raisonnement", detail: "La conclusion découle-t-elle vraiment des étapes ?" },
              { label: "Oublis", detail: "Manque-t-il un point qu'un expert aurait mentionné ?" },
              { label: "Destinataire", detail: "Le ton et le niveau vont-ils à la personne qui lira ?" },
              { label: "Origine", detail: "Des phrases reprises telles quelles d'un auteur ? Des sources inventées ?" },
            ],
            caption: "Touche chaque contrôle.",
          },
        ],
      },
      {
        id: "decider",
        title: "Vérifier, réécrire ou retirer",
        blocks: [
          {
            type: "text",
            body: "Demande-toi : **« et si c'était faux ? »**. Si l'erreur coûterait cher, **vérifie à la source**. Si c'est une question de forme, **réécris toi-même**. Si tu ne peux pas confirmer, **retire**.",
          },
          {
            type: "check",
            question: {
              id: "relire-ia:v2-c2",
              type: "match",
              concept: "decider",
              prompt: "Que faire de chaque passage ?",
              left: [
                { id: "1", text: "Un chiffre clé de ton rapport" },
                { id: "2", text: "Une phrase lourde mais juste" },
                { id: "3", text: "Une référence introuvable" },
              ],
              right: [
                { id: "verifier", text: "Vérifier à la source" },
                { id: "reecrire", text: "Réécrire" },
                { id: "retirer", text: "Retirer" },
              ],
              answer: ["verifier", "reecrire", "retirer"],
              explanation: "Une référence introuvable ne se cite jamais.",
            },
          },
        ],
      },
      {
        id: "seconde-lecture",
        title: "Pas d'autocorrection aveugle",
        blocks: [
          {
            type: "mistake",
            title: "« Relis-toi et corrige tes erreurs »",
            why: "Il peut repérer un oubli de forme, mais il vérifie les faits avec le même mécanisme qui a produit l'erreur.",
            fix: "Les faits se vérifient **à l'extérieur** : source, document, personne qui sait.",
          },
          {
            type: "check",
            question: {
              id: "relire-ia:v2-c3",
              type: "true_false",
              concept: "exterieur",
              statement: "Demander à l'IA de vérifier ses propres faits suffit.",
              answer: false,
              explanation: "La vérification des faits vient d'une source extérieure.",
            },
          },
        ],
      },
      {
        id: "checklist",
        title: "Ta checklist",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Souligne", body: "Chaque chiffre, nom, date, citation." },
              { title: "Vérifie", body: "Ce qui coûterait cher si c'était faux." },
              { title: "Coupe", body: "Ce que tu ne peux pas confirmer." },
              { title: "Signe", body: "Seulement ce que tu peux défendre." },
            ],
          },
          {
            type: "check",
            question: {
              id: "relire-ia:v2-c4",
              type: "ordering",
              concept: "checklist",
              prompt: "Remets la checklist dans l'ordre.",
              items: [
                { id: "a", text: "Souligner les faits" },
                { id: "b", text: "Vérifier ce qui compte" },
                { id: "c", text: "Couper l'invérifiable" },
                { id: "d", text: "Valider le texte" },
              ],
              answer: ["a", "b", "c", "d"],
              explanation: "Repérer, vérifier, couper, valider.",
            },
          },
        ],
      },
    ],
    summary: [
      "**Bien écrit n'est pas juste** : la forme ne dit rien du fond.",
      "Cinq contrôles : **faits, raisonnement, oublis, destinataire, origine**.",
      "« Et si c'était faux ? » : **vérifier, réécrire ou retirer**.",
      "Les faits se vérifient **à l'extérieur**, pas par l'IA elle-même.",
    ],
    questions: [
      {
        id: "relire-ia:v2-q1",
        type: "multi",
        concept: "cinq",
        prompt: "Quels contrôles font partie de la relecture ?",
        options: [
          { id: "a", text: "Les faits et chiffres" },
          { id: "b", text: "Le raisonnement" },
          { id: "c", text: "Les oublis" },
          { id: "d", text: "Le nombre de paragraphes" },
        ],
        answer: ["a", "b", "c"],
        explanation: "Et aussi le destinataire et l'origine.",
      },
      {
        id: "relire-ia:v2-q2",
        type: "mcq",
        concept: "decider",
        prompt: "Tu ne retrouves pas l'étude citée. Tu…",
        options: [
          { id: "a", text: "retires la phrase" },
          { id: "b", text: "la gardes, elle a l'air sérieuse" },
        ],
        answer: "a",
        explanation: "Ce que tu ne peux pas confirmer ne part pas sous ton nom.",
      },
      {
        id: "relire-ia:v2-q3",
        type: "true_false",
        concept: "forme",
        statement: "Le ton assuré d'une réponse est un signe de fiabilité.",
        answer: false,
        explanation: "Le ton est le même, que ce soit vrai ou faux.",
      },
      {
        id: "relire-ia:v2-q4",
        type: "fill_choice",
        concept: "decider",
        prompt: "Complète la question à se poser.",
        sentence: "« Et si c'était ___ ? »",
        options: [
          { id: "a", text: "faux" },
          { id: "b", text: "plus long" },
        ],
        answer: "a",
        explanation: "Le coût d'une erreur décide de l'effort de vérification.",
      },
      {
        id: "relire-ia:v2-q5",
        type: "mcq",
        concept: "exterieur",
        prompt: "La meilleure façon de vérifier un fait ?",
        options: [
          { id: "a", text: "Le retrouver dans une source fiable" },
          { id: "b", text: "Demander à l'IA de se relire" },
        ],
        answer: "a",
        explanation: "La source extérieure tranche. L'IA peut confirmer sa propre erreur.",
      },
    ],
    reviewQuestions: [
      {
        id: "relire-ia:v2-r1",
        type: "mcq",
        concept: "cinq",
        prompt: "« La conclusion découle-t-elle des étapes ? » vérifie…",
        options: [
          { id: "a", text: "le raisonnement" },
          { id: "b", text: "l'orthographe" },
        ],
        answer: "a",
        explanation: "Une conclusion peut sonner juste et ne pas découler de ce qui précède.",
      },
    ],
    sources: [REDUCE_HALLUCINATIONS, JI],
  },

  {
    id: "donnees-confidentielles",
    title: "Données confidentielles",
    objective: "Savoir quelles données ne t'appartiennent pas, quel outil est autorisé, et comment préparer un document.",
    theme: "confiance",
    difficulty: 2,
    format: "etude-de-cas",
    durationMin: 6,
    xp: 25,
    skills: ["Reconnaître une donnée confidentielle", "Préparer un document avant envoi"],
    sections: [
      {
        id: "cas",
        title: "Le cas Samsung",
        blocks: [
          {
            type: "text",
            body: "Au printemps 2023, des ingénieurs de Samsung ont collé du **code interne** dans ChatGPT pour se faire aider. L'entreprise a ensuite **interdit** ces outils en interne.",
          },
          {
            type: "check",
            question: {
              id: "donnees-confidentielles:v2-c1",
              type: "mcq",
              concept: "cas",
              prompt: "Quel était le vrai problème ?",
              options: [
                { id: "a", text: "Des secrets de l'entreprise sont partis vers un service extérieur" },
                { id: "b", text: "Le code était mal écrit" },
              ],
              answer: "a",
              explanation: "L'entreprise ne contrôlait plus où partaient ses données.",
            },
          },
        ],
      },
      {
        id: "familles",
        title: "Ce qui ne t'appartient pas",
        blocks: [
          {
            type: "check",
            question: {
              id: "donnees-confidentielles:v2-c2",
              type: "sort",
              concept: "familles",
              prompt: "Peut partir, ou confidentiel ?",
              bins: ["Peut partir", "Confidentiel"],
              items: [
                { id: "a", text: "Le fichier clients de ton entreprise" },
                { id: "b", text: "Un article de presse public" },
                { id: "c", text: "Un document sous accord de confidentialité" },
                { id: "d", text: "Les notes d'un camarade, sans son accord" },
                { id: "e", text: "Une question générale sur Excel" },
              ],
              answer: [1, 0, 1, 1, 0],
              explanation: "Données de personnes, secrets de l'organisation, documents sous contrat, travail d'autrui : rien de ça ne t'appartient.",
            },
          },
        ],
      },
      {
        id: "outil",
        title: "Quel outil, autorisé par qui",
        blocks: [
          {
            type: "text",
            body: "Utiliser un outil que ton organisation n'a pas autorisé, c'est du **shadow AI**. Et l'absence de règle n'est **pas une autorisation** : dans le doute, demande.",
          },
          {
            type: "compare",
            columns: ["Compte perso", "Outil fourni par l'organisation"],
            rows: [
              { label: "Contrat", a: "Les conditions grand public", b: "Un contrat négocié" },
              { label: "Données de travail", a: "À éviter", b: "Selon les règles internes" },
            ],
          },
        ],
      },
      {
        id: "preparer",
        title: "Préparer un document",
        blocks: [
          {
            type: "flow",
            nodes: [
              { label: "Réduire", detail: "Garde seulement le passage utile." },
              { label: "Remplacer", detail: "Noms → « Client A », « Collègue B »." },
              { label: "Arrondir", detail: "« 1 243 812 € » → « environ 1,2 M€ »." },
              { label: "Relire en adversaire", detail: "Quelqu'un pourrait-il deviner de qui il s'agit ?" },
            ],
          },
          {
            type: "check",
            question: {
              id: "donnees-confidentielles:v2-c3",
              type: "true_false",
              concept: "pseudonymiser",
              statement: "Remplacer les noms suffit toujours à rendre un document anonyme.",
              answer: false,
              explanation: "Avec un poste, une ville et une date, on reconnaît souvent la personne. Les données restent personnelles.",
            },
          },
        ],
      },
      {
        id: "doute",
        title: "En cas de doute",
        blocks: [
          { type: "keypoint", body: "Un doute ? **Demande** : ton responsable, ton enseignant, le service informatique, ou la personne qui t'a confié le document." },
          {
            type: "check",
            question: {
              id: "donnees-confidentielles:v2-c4",
              type: "mcq",
              concept: "outil",
              prompt: "Ton entreprise n'a aucune règle sur l'IA. Tu veux analyser un contrat client. Tu…",
              options: [
                { id: "a", text: "demandes d'abord quel outil est autorisé" },
                { id: "b", text: "utilises ton compte perso, rien ne l'interdit" },
              ],
              answer: "a",
              explanation: "Pas de règle ne veut pas dire autorisé. Le contrat client reste confidentiel.",
            },
          },
        ],
      },
    ],
    summary: [
      "Beaucoup de données **ne t'appartiennent pas** : clients, secrets, contrats, travail d'autrui.",
      "Utiliser un outil non autorisé, c'est du **shadow AI**. Pas de règle n'est **pas une autorisation**.",
      "Prépare : **réduire, remplacer, arrondir, relire en adversaire**.",
      "Un doute ? **Demande.**",
    ],
    questions: [
      {
        id: "donnees-confidentielles:v2-q1",
        type: "fill_choice",
        concept: "outil",
        prompt: "Complète la phrase.",
        sentence: "Utiliser un outil IA non autorisé par ton organisation, c'est du ___.",
        options: [
          { id: "a", text: "shadow AI" },
          { id: "b", text: "télétravail" },
        ],
        answer: "a",
        explanation: "L'organisation ne sait plus où partent ses données.",
      },
      {
        id: "donnees-confidentielles:v2-q2",
        type: "multi",
        concept: "familles",
        prompt: "Qu'est-ce qui est confidentiel ?",
        options: [
          { id: "a", text: "Les salaires de l'équipe" },
          { id: "b", text: "Un plan stratégique interne" },
          { id: "c", text: "La page d'accueil publique de l'entreprise" },
        ],
        answer: ["a", "b"],
        explanation: "Ce qui est déjà public n'est pas un secret.",
      },
      {
        id: "donnees-confidentielles:v2-q3",
        type: "true_false",
        concept: "pseudonymiser",
        statement: "« Le directeur financier de notre usine de Lille » peut identifier quelqu'un.",
        answer: true,
        explanation: "Il n'y a qu'une personne à ce poste : c'est une donnée personnelle.",
      },
      {
        id: "donnees-confidentielles:v2-q4",
        type: "ordering",
        concept: "preparer",
        prompt: "Remets la préparation dans l'ordre.",
        items: [
          { id: "a", text: "Garder le passage utile" },
          { id: "b", text: "Remplacer les noms" },
          { id: "c", text: "Arrondir les chiffres" },
          { id: "d", text: "Relire en adversaire" },
        ],
        answer: ["a", "b", "c", "d"],
        explanation: "Réduire, remplacer, arrondir, relire.",
      },
      {
        id: "donnees-confidentielles:v2-q5",
        type: "mcq",
        concept: "cas",
        prompt: "Qu'a fait Samsung après la fuite ?",
        options: [
          { id: "a", text: "Interdire ces outils en interne" },
          { id: "b", text: "Rien" },
        ],
        answer: "a",
        explanation: "Une réaction fréquente quand une organisation perd le contrôle de ses données.",
      },
    ],
    reviewQuestions: [
      {
        id: "donnees-confidentielles:v2-r1",
        type: "mcq",
        concept: "outil",
        prompt: "« Personne ne m'a interdit cet outil. » Est-ce une autorisation ?",
        options: [
          { id: "a", text: "Non : dans le doute, on demande" },
          { id: "b", text: "Oui" },
        ],
        answer: "a",
        explanation: "L'absence de règle n'autorise rien.",
      },
    ],
    sources: [SAMSUNG, RGPD],
  },

  {
    id: "citer-et-integrite",
    title: "Utiliser l'IA honnêtement",
    objective: "Connaître les règles de ton école ou de ton travail, déclarer ton usage et citer les vraies sources.",
    theme: "confiance",
    difficulty: 2,
    format: "notion",
    durationMin: 5,
    xp: 25,
    skills: ["Déclarer son usage de l'IA", "Citer les sources consultées, pas celles annoncées"],
    sections: [
      {
        id: "regles",
        title: "Les règles changent d'un endroit à l'autre",
        blocks: [
          {
            type: "text",
            body: "Une école autorise l'IA pour réviser, une autre l'interdit en devoir. Un employeur fournit un outil, un autre non. **La règle qui compte est celle de ton lieu**.",
          },
          {
            type: "check",
            question: {
              id: "citer-et-integrite:c1",
              type: "mcq",
              concept: "regles",
              prompt: "Où trouver ce qui est permis pour ton devoir ?",
              options: [
                { id: "a", text: "Dans la consigne, le règlement, ou auprès du prof" },
                { id: "b", text: "En demandant à l'IA" },
              ],
              answer: "a",
              explanation: "Seule ta structure fixe ses règles. L'IA ne les connaît pas.",
            },
          },
        ],
      },
      {
        id: "declarer",
        title: "Déclarer ton usage",
        blocks: [
          {
            type: "text",
            body: "Quand c'est demandé, dis **quel outil**, **pour quoi faire** (plan, relecture, reformulation) et **ce que tu as gardé**. C'est simple, et ça évite tout malentendu.",
          },
          {
            type: "example",
            label: "Une note d'usage",
            good: true,
            content: "J'ai utilisé un assistant IA pour reformuler mon introduction et me faire interroger sur le chapitre 3. Les idées, le plan et la conclusion sont de moi.",
          },
        ],
      },
      {
        id: "sources",
        title: "Les vraies sources",
        blocks: [
          { type: "keypoint", body: "Cite **les sources que tu as lues**, pas celles que l'IA annonce." },
          {
            type: "check",
            question: {
              id: "citer-et-integrite:c2",
              type: "true_false",
              concept: "sources",
              statement: "Je peux mettre dans ma bibliographie un livre que l'IA m'a conseillé, sans l'avoir ouvert.",
              answer: false,
              explanation: "Il peut ne pas exister, ou ne pas dire ça. Une source se cite après lecture.",
            },
          },
        ],
      },
      {
        id: "ligne",
        title: "Où est la ligne",
        blocks: [
          {
            type: "spectrum",
            poles: ["Honnête", "Triche"],
            items: [
              { label: "Se faire interroger pour réviser", position: 5 },
              { label: "Faire corriger son orthographe", position: 25, detail: "Souvent accepté, mais vérifie la consigne." },
              { label: "Faire écrire le plan", position: 60, detail: "Dépend des règles : à déclarer." },
              { label: "Rendre un texte écrit par l'IA comme le sien", position: 95 },
            ],
            caption: "Touche chaque usage.",
          },
        ],
      },
      {
        id: "test",
        title: "Le test simple",
        blocks: [
          {
            type: "check",
            question: {
              id: "citer-et-integrite:c3",
              type: "mcq",
              concept: "test",
              prompt: "Le meilleur test avant de rendre un travail ?",
              options: [
                { id: "a", text: "Est-ce que je peux l'expliquer et le défendre seul ?" },
                { id: "b", text: "Est-ce qu'un détecteur d'IA le repère ?" },
              ],
              answer: "a",
              explanation: "Si tu peux le défendre sans aide, c'est ton travail.",
            },
          },
        ],
      },
    ],
    summary: [
      "La règle qui compte est **celle de ton école ou de ton travail**.",
      "Déclare **l'outil, l'usage, ce que tu as gardé**.",
      "Cite **ce que tu as lu**, pas ce que l'IA annonce.",
      "Le test : **peux-tu l'expliquer et le défendre seul ?**",
    ],
    questions: [
      {
        id: "citer-et-integrite:q1",
        type: "multi",
        concept: "declarer",
        prompt: "Que mettre dans une note d'usage de l'IA ?",
        options: [
          { id: "a", text: "L'outil utilisé" },
          { id: "b", text: "Pour quoi faire" },
          { id: "c", text: "Ce qui vient de toi" },
          { id: "d", text: "Ton mot de passe" },
        ],
        answer: ["a", "b", "c"],
        explanation: "Trois infos suffisent pour être transparent.",
      },
      {
        id: "citer-et-integrite:q2",
        type: "true_false",
        concept: "regles",
        statement: "Les règles sur l'IA sont les mêmes dans toutes les écoles.",
        answer: false,
        explanation: "Elles varient : lis la consigne, ou demande.",
      },
      {
        id: "citer-et-integrite:q3",
        type: "mcq",
        concept: "sources",
        prompt: "L'IA te cite trois articles. Pour ta bibliographie, tu…",
        options: [
          { id: "a", text: "les retrouves, les lis, puis cites ceux qui servent" },
          { id: "b", text: "les recopies tels quels" },
        ],
        answer: "a",
        explanation: "Une référence non lue peut être inventée ou mal résumée.",
      },
      {
        id: "citer-et-integrite:q4",
        type: "fill_choice",
        concept: "test",
        prompt: "Complète le test.",
        sentence: "Je rends seulement ce que je peux ___ seul.",
        options: [
          { id: "a", text: "expliquer" },
          { id: "b", text: "copier" },
        ],
        answer: "a",
        explanation: "C'est la règle la plus simple et la plus sûre.",
      },
      {
        id: "citer-et-integrite:q5",
        type: "mcq",
        concept: "regles",
        prompt: "La consigne ne dit rien sur l'IA. Tu…",
        options: [
          { id: "a", text: "demandes au prof avant" },
          { id: "b", text: "fais comme tu veux" },
        ],
        answer: "a",
        explanation: "Une question évite un malentendu.",
      },
    ],
    reviewQuestions: [
      {
        id: "citer-et-integrite:r1",
        type: "mcq",
        concept: "sources",
        prompt: "Quelle source citer ?",
        options: [
          { id: "a", text: "Celle que tu as ouverte et lue" },
          { id: "b", text: "Celle que l'IA a mentionnée" },
        ],
        answer: "a",
        explanation: "On cite ce qu'on a vérifié.",
      },
    ],
    sources: [UNESCO, REDUCE_HALLUCINATIONS],
  },
];
