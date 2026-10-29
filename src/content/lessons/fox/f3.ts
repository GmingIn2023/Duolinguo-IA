import type { Lesson } from "../../types";

/** Fox · chapitre 3 : « API » */
export const foxChapter3: Lesson[] = [
  {
    id: "api-cest-quoi",
    title: "Parler à un modèle par API",
    objective: "Lire et écrire une requête d'API vers un modèle de langage, interpréter la réponse (contenu, raison d'arrêt, tokens) et éviter les pièges de base : historique, clé, limites de débit.",
    theme: "api",
    difficulty: 3,
    format: "notion",
    durationMin: 15,
    xp: 50,
    skills: [
      "Décrire les éléments d'une requête et d'une réponse d'API de modèle",
      "Gérer soi-même l'historique d'une conversation sans état",
      "Protéger une clé d'API",
      "Interpréter une raison d'arrêt et une erreur de débit",
    ],
    sections: [
      {
        id: "app-vs-api",
        title: "L'application ou l'API",
        blocks: [
          {
            type: "text",
            body: "Tu veux trier automatiquement les 300 messages reçus chaque jour par le support de ton association : « question », « réclamation », « don ». Tu peux le faire à la main dans un assistant, en copiant chaque message. Ou tu peux écrire un programme qui envoie chaque message au modèle et range la réponse dans un tableur. Pour ça, ton programme ne passe pas par l'application de chat : il passe par l'**API**.",
          },
          {
            type: "definition",
            term: "API (interface de programmation)",
            body: "Un point d'entrée prévu pour les programmes, pas pour les humains. Ton code envoie une requête dans un format convenu (ici du JSON, par HTTPS) et reçoit une réponse dans un format tout aussi convenu.",
          },
          {
            type: "compare",
            title: "Même modèle, deux usages",
            columns: ["Application de chat", "API"],
            rows: [
              { label: "Qui parle", a: "Toi, dans une fenêtre", b: "Ton programme, par une requête HTTP" },
              {
                label: "Mémoire de la conversation",
                a: "Gérée par l'application",
                b: "Gérée par toi : tu renvoies l'historique",
              },
              {
                label: "Prompt système",
                a: "Écrit par l'éditeur (tu ne le vois pas)",
                b: "Écrit par toi, ou absent",
              },
              { label: "Réglages", a: "Fixés pour toi", b: "Modèle, longueur maximale, etc. : tu choisis" },
              { label: "Paiement", a: "Souvent un abonnement", b: "À l'usage, au token" },
              {
                label: "Outils (recherche web, fichiers…)",
                a: "Intégrés à l'application",
                b: "À activer ou à brancher toi-même",
              },
            ],
          },
        ],
      },
      {
        id: "modele-nu",
        title: "Le modèle « nu »",
        blocks: [
          {
            type: "keypoint",
            body: "L'application est un produit fini construit **par-dessus** l'API. Par l'API, tu reçois le modèle « nu » : pas de mémoire, pas de personnalité imposée, pas d'interface. C'est plus de travail et plus de contrôle.",
          },
          {
            type: "check",
            question: {
              id: "api-cest-quoi:c1",
              type: "mcq",
              concept: "app-vs-api",
              prompt: "Tu testes un prompt dans l'application de chat, puis tu l'envoies tel quel par l'API. Les réponses n'ont pas le même ton. Quelle est l'explication la plus probable ?",
              options: [
                {
                  id: "a",
                  text: "L'application ajoute son propre prompt système et ses réglages ; par l'API, il n'y a que ce que tu envoies",
                },
                {
                  id: "b",
                  text: "L'API utilise forcément un modèle de moins bonne qualité",
                  feedback: "Non : tu choisis le modèle dans la requête, et ce sont les mêmes familles de modèles.",
                },
                {
                  id: "c",
                  text: "L'API ne comprend pas le français",
                  feedback: "La langue ne dépend pas de la porte d'entrée.",
                },
              ],
              answer: "a",
              explanation: "L'application enveloppe ta demande : consignes de l'éditeur, historique, outils. Par l'API, rien de tout ça n'existe tant que tu ne l'as pas mis toi-même dans la requête.",
            },
          },
        ],
      },
      {
        id: "requete",
        title: "Anatomie d'une requête",
        blocks: [
          {
            type: "definition",
            term: "Endpoint",
            body: "L'adresse précise à laquelle on envoie un type de requête. Un fournisseur expose plusieurs endpoints : un pour générer du texte, un pour compter des tokens, etc.",
          },
          {
            type: "anatomy",
            title: "Une requête de génération (format de l'API Messages d'Anthropic)",
            segments: [
              {
                text: "POST https://api.anthropic.com/v1/messages\n",
                label: "endpoint",
                detail: "La méthode HTTP (POST : on envoie des données) et l'adresse. Chaque fournisseur a la sienne.",
              },
              {
                text: "x-api-key: $ANTHROPIC_API_KEY\n",
                label: "clé d'API",
                detail: "Le secret qui t'identifie et qui sert à te facturer. Ici il est lu dans une variable d'environnement, jamais écrit en dur. D'autres fournisseurs utilisent un en-tête `Authorization: Bearer …`.",
              },
              { text: "anthropic-version: 2023-06-01\ncontent-type: application/json\n\n" },
              {
                text: "{\n  \"model\": \"nom-du-modele\",\n",
                label: "modèle",
                detail: "Quel modèle doit répondre. C'est toi qui choisis, requête par requête : un petit modèle rapide pour trier, un plus gros pour raisonner.",
              },
              {
                text: "  \"max_tokens\": 300,\n",
                label: "limite de sortie",
                detail: "Le nombre maximal de tokens que la réponse peut contenir. Si le modèle l'atteint, la réponse est coupée net. Obligatoire chez Anthropic ; ailleurs le champ porte un autre nom (par exemple `max_output_tokens`).",
              },
              {
                text: "  \"system\": \"Tu classes des messages de support. Réponds par un seul mot : question, réclamation ou don.\",\n",
                label: "prompt système",
                detail: "Les consignes permanentes : rôle, format, limites. Chez Anthropic c'est un champ à part ; chez d'autres, c'est un message avec un rôle dédié ou un champ `instructions`.",
              },
              {
                text: "  \"messages\": [\n    { \"role\": \"user\", \"content\": \"Bonjour, je n'ai toujours pas reçu mon reçu fiscal.\" }\n  ]\n}",
                label: "messages",
                detail: "La conversation, sous forme de liste. Chaque message a un rôle : `user` (ce que dit l'utilisateur) ou `assistant` (ce qu'a répondu le modèle).",
              },
            ],
            caption: "Touche chaque partie surlignée. Les noms de champs varient d'un fournisseur à l'autre ; les six idées, elles, sont partout.",
          },
        ],
      },
      {
        id: "parametres",
        title: "Température et limite de sortie",
        blocks: [
          {
            type: "text",
            title: "Et la température ?",
            body: "La **température** dose le hasard du tirage. C'est un paramètre de requête (`temperature`) chez de nombreux fournisseurs, mais plus un réglage universel : la documentation d'Anthropic indique que ses modèles récents n'acceptent plus que la valeur par défaut, et recommande de guider le comportement par le prompt. Vérifie la page de référence de ton modèle avant de compter dessus.",
          },
          {
            type: "mistake",
            title: "Fixer la limite de sortie trop bas « pour économiser »",
            why: "La limite ne demande pas au modèle d'être concis : elle coupe la réponse quand le compteur est atteint, au milieu d'une phrase ou d'un objet JSON s'il le faut.",
            fix: "Demande la concision dans le prompt, garde une limite confortable, et contrôle toujours la raison d'arrêt de la réponse (section suivante).",
          },
        ],
      },
      {
        id: "reponse",
        title: "Anatomie d'une réponse",
        blocks: [
          {
            type: "code",
            lang: "json",
            code: "{\n  \"id\": \"msg_01ExempleFictif\",\n  \"type\": \"message\",\n  \"role\": \"assistant\",\n  \"content\": [\n    { \"type\": \"text\", \"text\": \"réclamation\" }\n  ],\n  \"model\": \"nom-du-modele\",\n  \"stop_reason\": \"end_turn\",\n  \"usage\": {\n    \"input_tokens\": 58,\n    \"output_tokens\": 4\n  }\n}",
            caption: "Réponse plausible à la requête précédente (identifiant et compteurs fictifs, structure réelle de l'API Messages).",
          },
          {
            type: "steps",
            title: "Trois choses à lire, dans cet ordre",
            items: [
              {
                title: "La raison d'arrêt",
                body: "`stop_reason` dit pourquoi la génération s'est arrêtée. Lis-la avant le contenu : elle te dit si le contenu est complet.",
              },
              {
                title: "Le contenu",
                body: "`content` est une liste de blocs, pas une simple chaîne : un bloc de texte ici, mais il peut y en avoir plusieurs, de types différents (tu le verras avec les outils dans le cours suivant).",
              },
              {
                title: "Le compte de tokens",
                body: "`usage` donne les tokens lus en entrée et les tokens écrits en sortie. C'est la base de la facture et le meilleur indicateur pour comprendre pourquoi une requête coûte cher.",
              },
            ],
          },
          {
            type: "table",
            headers: ["Raison d'arrêt", "Ce que ça veut dire", "Quoi faire"],
            rows: [
              ["`end_turn`", "Le modèle a fini sa réponse normalement", "Utiliser le contenu"],
              [
                "`max_tokens`",
                "La limite de sortie a été atteinte : réponse tronquée",
                "Augmenter la limite ou demander plus court, puis relancer",
              ],
              [
                "`stop_sequence`",
                "Le modèle a écrit une séquence d'arrêt que tu avais définie",
                "Comportement voulu : utiliser le contenu",
              ],
              [
                "`tool_use`",
                "Le modèle demande l'exécution d'un outil",
                "Exécuter l'outil et renvoyer le résultat (cours suivant)",
              ],
              [
                "`refusal`",
                "Le modèle a refusé de répondre",
                "Ne pas traiter le contenu comme une réponse normale",
              ],
            ],
            caption: "Valeurs de l'API Messages d'Anthropic (liste non exhaustive). Les autres fournisseurs ont le même concept sous d'autres noms.",
          },
          {
            type: "check",
            question: {
              id: "api-cest-quoi:c2",
              type: "mcq",
              concept: "raison-arret",
              prompt: "Ton programme reçoit un résumé qui se termine par « Les trois causes principales sont : la ». La réponse indique `\"stop_reason\": \"max_tokens\"`. Que s'est-il passé ?",
              options: [
                { id: "a", text: "La limite de tokens de sortie a été atteinte et la réponse a été coupée" },
                {
                  id: "b",
                  text: "Le modèle n'a plus rien trouvé à dire",
                  feedback: "Dans ce cas la raison d'arrêt serait `end_turn`.",
                },
                {
                  id: "c",
                  text: "Ta clé d'API a expiré pendant la réponse",
                  feedback: "Un problème de clé donne une erreur HTTP, pas une réponse partielle avec une raison d'arrêt.",
                },
              ],
              answer: "a",
              explanation: "La raison d'arrêt te dit que le texte est incomplet. Un programme sérieux la teste systématiquement avant d'utiliser le contenu.",
            },
          },
        ],
      },
      {
        id: "sans-etat",
        title: "Sans état : c'est toi la mémoire",
        blocks: [
          {
            type: "definition",
            term: "API sans état (stateless)",
            body: "Le serveur ne garde rien d'une requête à l'autre. Chaque requête doit contenir tout ce dont le modèle a besoin, y compris les échanges précédents.",
          },
          {
            type: "text",
            body: "Dans l'application, le modèle semble se souvenir de la conversation. En réalité, à chaque tour, l'application renvoie tout l'historique. Par l'API, ce travail te revient : la documentation d'Anthropic le dit en une phrase, l'API Messages est sans état, tu envoies toujours l'historique complet.",
          },
          {
            type: "code",
            lang: "json",
            code: "{\n  \"model\": \"nom-du-modele\",\n  \"max_tokens\": 300,\n  \"messages\": [\n    { \"role\": \"user\", \"content\": \"Mon prénom est Inès. Propose un nom pour mon club de lecture.\" },\n    { \"role\": \"assistant\", \"content\": \"Que dirais-tu de « Les Pages d'Inès » ?\" },\n    { \"role\": \"user\", \"content\": \"Plus court, et sans mon prénom.\" }\n  ]\n}",
            caption: "Deuxième tour d'une conversation : ton code a ajouté à la liste la réponse précédente du modèle, puis le nouveau message.",
          },
          {
            type: "mistake",
            title: "Envoyer seulement le dernier message",
            why: "On raisonne comme dans l'application : « il sait déjà ». Mais le modèle ne voit que le contenu de la requête. Sans l'historique, « Plus court, et sans mon prénom » ne se rapporte à rien.",
            fix: "Garde la liste des messages dans ton programme (ou dans ta base), ajoute chaque réponse du modèle avec le rôle `assistant`, et renvoie la liste entière à chaque tour.",
          },
        ],
      },
      {
        id: "facturation",
        title: "Payer au token",
        blocks: [
          {
            type: "text",
            title: "Nuance selon les fournisseurs",
            body: "Certaines API proposent de stocker la conversation côté serveur. OpenAI, par exemple, permet de chaîner des réponses avec un paramètre `previous_response_id` ou un objet conversation persistant. C'est une commodité, pas une mémoire gratuite : pour `previous_response_id`, sa documentation précise que tous les tokens d'entrée des réponses précédentes de la chaîne restent facturés. Le modèle, lui, relit toujours tout.",
          },
          {
            type: "text",
            title: "La facturation au token",
            body: "Tu paies les tokens que le modèle **lit** (entrée : prompt système, historique, documents, définitions d'outils) et ceux qu'il **écrit** (sortie), chacun avec son propre tarif, variable selon le modèle. Conséquence directe de l'absence d'état : dans une conversation, chaque tour repaie en entrée tout ce qui précède. Une conversation de vingt tours ne coûte pas vingt fois le premier tour, elle coûte bien plus, parce que l'entrée grossit à chaque fois.",
          },
          {
            type: "example",
            label: "Une conversation qui grossit (chiffres fictifs)",
            content: "Tour 1 : 200 tokens en entrée. Tour 2 : 200 + la réponse 1 + ta relance = 650. Tour 3 : 1 100. Tour 10 : plus de 4 000 tokens relus pour une relance de dix mots.",
            note: "Chiffres inventés pour illustrer la tendance. Les parades réelles : résumer l'historique ancien, ne garder que les derniers tours, ou utiliser la mise en cache de prompt quand le fournisseur la propose.",
          },
        ],
      },
      {
        id: "cle",
        title: "Protéger ta clé",
        blocks: [
          {
            type: "steps",
            title: "Protéger ta clé d'API",
            items: [
              {
                title: "Jamais dans le code côté navigateur",
                body: "Tout ce qui tourne dans le navigateur est lisible par le visiteur : code JavaScript, requêtes réseau. Une clé placée là est publique. L'appel au modèle part de ton serveur, qui seul connaît la clé.",
              },
              {
                title: "Jamais dans un dépôt",
                body: "Une clé écrite dans un fichier suivi par Git reste dans l'historique même après suppression. Des robots parcourent les dépôts publics à la recherche de clés.",
              },
              {
                title: "Dans une variable d'environnement",
                body: "Ton code lit la clé dans l'environnement (par exemple `ANTHROPIC_API_KEY`), fournie par un fichier local exclu du dépôt ou par le gestionnaire de secrets de ton hébergeur.",
              },
              {
                title: "Révocable et plafonnée",
                body: "Si une clé a fuité, révoque-la et crées-en une autre : c'est fait pour ça. Fixe aussi un plafond de dépenses dans la console du fournisseur quand il le permet.",
              },
            ],
          },
          {
            type: "mistake",
            title: "« C'est juste un prototype, je mets la clé dans le front »",
            why: "Le prototype finit en ligne, quelqu'un ouvre les outils de développement du navigateur, copie la clé et l'utilise à tes frais. Ce n'est pas une attaque sophistiquée : la clé est en clair.",
            fix: "Même pour un prototype, passe par une petite route côté serveur qui ajoute la clé et relaie la requête. Ajoute-y une limite d'usage par utilisateur.",
          },
        ],
      },
      {
        id: "erreurs",
        title: "Erreurs et limites de débit",
        blocks: [
          {
            type: "table",
            headers: ["Code HTTP", "Sens", "Réaction de ton code"],
            rows: [
              [
                "400",
                "Requête mal formée, paramètre refusé, ou plafond de dépenses que tu as fixé atteint",
                "Corriger la requête (ou relever le plafond) ; réessayer à l'identique ne sert à rien",
              ],
              ["401", "Clé absente, invalide ou révoquée", "Vérifier la clé et la variable d'environnement"],
              [
                "429",
                "Limite de débit atteinte (ou plafond mensuel de dépenses du palier)",
                "Attendre la durée de l'en-tête `retry-after` quand il est présent, puis réessayer. Sans cet en-tête (plafond mensuel atteint), réessayer ne sert à rien",
              ],
              ["500", "Erreur interne du fournisseur", "Réessayer avec une attente croissante"],
              [
                "529",
                "Service temporairement surchargé (Anthropic)",
                "Réessayer plus tard, avec une attente croissante",
              ],
            ],
            caption: "Codes documentés par Anthropic. Les codes 400, 401, 429 et 500 suivent les conventions HTTP et se retrouvent chez les autres fournisseurs.",
          },
          {
            type: "definition",
            term: "Limite de débit (rate limit)",
            body: "Un plafond d'usage par période. Chez Anthropic, il se mesure en requêtes par minute et en tokens d'entrée et de sortie par minute, par modèle, et dépend du palier d'usage de ton organisation. Un dépassement renvoie une erreur 429.",
          },
          {
            type: "text",
            body: "La bonne réaction à une erreur 429 ou 5xx s'appelle le **backoff exponentiel** : attendre, réessayer, et doubler l'attente à chaque nouvel échec, avec un nombre maximal de tentatives. Les SDK officiels le font souvent pour toi (celui d'Anthropic réessaie deux fois par défaut). Ce qu'il ne faut pas faire : une boucle qui réessaie immédiatement et sans fin, ce qui aggrave la saturation et vide ton budget.",
          },
        ],
      },
      {
        id: "streaming",
        title: "Le streaming",
        blocks: [
          {
            type: "flow",
            title: "Le streaming : recevoir la réponse au fil de l'eau",
            nodes: [
              {
                label: "Demander",
                detail: "Tu ajoutes `\"stream\": true` à la requête. Le reste ne change pas.",
              },
              {
                label: "Ouverture",
                detail: "Au lieu d'un seul bloc JSON à la fin, le serveur garde la connexion ouverte et envoie des événements (technique des server-sent events). Un premier événement annonce le début du message.",
              },
              {
                label: "Fragments",
                detail: "Une série d'événements apporte chacun un petit morceau de texte. Ton code les affiche ou les accumule à mesure.",
              },
              {
                label: "Clôture",
                detail: "Les derniers événements donnent la raison d'arrêt et le compte final de tokens, puis signalent la fin du message.",
              },
            ],
            caption: "Le streaming ne rend pas le modèle plus rapide : il te montre la boucle token par token au lieu de t'en cacher l'attente.",
          },
          {
            type: "text",
            body: "Deux raisons d'utiliser le streaming : l'utilisateur voit le texte arriver au lieu de fixer un écran vide, et les longues réponses ne risquent pas de dépasser un délai d'attente réseau. Contrepartie : ton code doit assembler les fragments, et une erreur peut survenir en cours de route, après un début de réponse.",
          },
          {
            type: "exercise",
            title: "Écris le troisième tour à la main",
            minutes: 4,
            prompt: "Sans clé d'API, sur papier ou dans un éditeur. Tu construis un assistant de révision. Prompt système : « Tu es un tuteur d'histoire. Pose une question à la fois. » Tour 1, l'élève écrit : « Interroge-moi sur la Révolution française. » Le modèle répond : « En quelle année a eu lieu la prise de la Bastille ? » Tour 2, l'élève écrit : « 1789 ». Écris le corps JSON complet de la requête du tour 2 (modèle `nom-du-modele`, 200 tokens de sortie au maximum). Puis réponds : quels éléments de cette requête seront refacturés en entrée au tour 3 ?",
            hints: [
              "Le prompt système ne va pas dans la liste des messages (format Anthropic).",
              "La question posée par le modèle doit figurer dans la liste, avec le bon rôle.",
            ],
            solution: "Corps attendu : `model` = « nom-du-modele », `max_tokens` = 200, `system` = le texte du tuteur, et `messages` avec trois entrées dans l'ordre : user « Interroge-moi sur la Révolution française. », assistant « En quelle année a eu lieu la prise de la Bastille ? », user « 1789 ». Au tour 3, tout sera relu et refacturé en entrée : le prompt système, ces trois messages, la réponse du tour 2 et le nouveau message de l'élève. Si tu as oublié le message `assistant`, le modèle reçoit « 1789 » sans savoir à quelle question ça répond.",
          },
        ],
      },
    ],
    summary: [
      "L'API donne accès au modèle « nu » : c'est ton programme qui fournit le prompt système, l'historique et les réglages que l'application gérait pour toi.",
      "Une requête contient un endpoint, une clé, un modèle, une limite de tokens de sortie, un prompt système et une liste de messages avec des rôles. Les noms de champs varient selon le fournisseur.",
      "Dans la réponse, lis d'abord la raison d'arrêt (complète, tronquée, appel d'outil, refus), puis le contenu, puis le compte de tokens.",
      "L'API est sans état : tu renvoies tout l'historique à chaque tour, et tu le repaies en tokens d'entrée.",
      "La clé d'API reste côté serveur, dans une variable d'environnement, jamais dans le navigateur ni dans un dépôt.",
      "Une erreur 429 signale une limite de débit : on attend puis on réessaie avec une attente croissante. Le streaming envoie la réponse par fragments.",
    ],
    questions: [
      {
        id: "api-cest-quoi:q1",
        type: "match",
        concept: "anatomie-requete",
        prompt: "Associe chaque élément d'une requête à son rôle.",
        left: [
          { id: "l1", text: "Endpoint" },
          { id: "l2", text: "Clé d'API" },
          { id: "l3", text: "Prompt système" },
          { id: "l4", text: "Limite de tokens de sortie" },
        ],
        right: [
          { id: "r1", text: "L'adresse à laquelle la requête est envoyée" },
          { id: "r2", text: "Le secret qui t'identifie et sert à te facturer" },
          { id: "r3", text: "Les consignes permanentes données au modèle" },
          { id: "r4", text: "Le plafond au-delà duquel la réponse est coupée" },
        ],
        answer: ["r1", "r2", "r3", "r4"],
        explanation: "Ces éléments existent chez tous les fournisseurs, même si les noms de champs changent.",
      },
      {
        id: "api-cest-quoi:q2",
        type: "true_false",
        concept: "sans-etat",
        statement: "Avec une API sans état, le serveur conserve les messages précédents : il suffit d'envoyer le nouveau message à chaque tour.",
        answer: false,
        explanation: "Sans état signifie l'inverse : rien n'est conservé entre deux requêtes. C'est ton code qui renvoie l'historique complet.",
      },
      {
        id: "api-cest-quoi:q3",
        type: "mcq",
        concept: "raison-arret",
        prompt: "Ton programme demande un objet JSON de 40 champs. La réponse s'arrête au champ 31 et le JSON est invalide. Que vérifies-tu en premier ?",
        options: [
          {
            id: "a",
            text: "La raison d'arrêt : si elle indique que la limite de tokens de sortie est atteinte, la réponse a été tronquée",
          },
          {
            id: "b",
            text: "La clé d'API, qui a peut-être été révoquée",
            feedback: "Une clé invalide donne une erreur 401 et aucune réponse du modèle.",
          },
          {
            id: "c",
            text: "Le prompt système, qui est sans doute trop long",
            feedback: "Un prompt système long augmente l'entrée, il ne coupe pas la sortie.",
          },
          {
            id: "d",
            text: "La connexion réseau, qui a dû se couper",
            feedback: "Possible, mais une réponse reçue avec une raison d'arrêt explicite est l'indice le plus direct.",
          },
        ],
        answer: "a",
        explanation: "Une sortie coupée au milieu d'une structure est le symptôme typique d'une limite de sortie trop basse. La raison d'arrêt le confirme en une ligne.",
      },
      {
        id: "api-cest-quoi:q4",
        type: "multi",
        concept: "cle-api",
        prompt: "Quels emplacements sont acceptables pour une clé d'API ?",
        options: [
          { id: "a", text: "Une variable d'environnement lue par ton serveur" },
          { id: "b", text: "Le gestionnaire de secrets de ton hébergeur" },
          {
            id: "c",
            text: "Une constante dans le JavaScript chargé par le navigateur",
            feedback: "Tout ce que le navigateur charge est lisible par le visiteur.",
          },
          {
            id: "d",
            text: "Un fichier de configuration poussé dans un dépôt Git",
            feedback: "La clé reste dans l'historique du dépôt, même si tu supprimes le fichier ensuite.",
          },
        ],
        answer: ["a", "b"],
        explanation: "La clé ne doit exister que là où seuls ton serveur et toi pouvez la lire.",
      },
      {
        id: "api-cest-quoi:q5",
        type: "fill_choice",
        concept: "erreurs-debit",
        prompt: "Complète la phrase.",
        sentence: "Quand l'API répond par une erreur 429, ton code doit ___ avant de réessayer.",
        options: [
          { id: "a", text: "attendre, en allongeant le délai à chaque nouvel échec" },
          { id: "b", text: "renvoyer aussitôt la même requête en boucle" },
          { id: "c", text: "changer de clé d'API" },
        ],
        answer: "a",
        explanation: "429 signifie que tu as dépassé une limite de débit. L'en-tête `retry-after` indique combien attendre ; réessayer immédiatement prolonge le blocage.",
      },
      {
        id: "api-cest-quoi:q6",
        type: "ordering",
        concept: "sans-etat",
        prompt: "Remets dans l'ordre ce que fait ton programme pour un tour de conversation par API.",
        items: [
          { id: "a", text: "Ajouter le nouveau message de l'utilisateur à la liste des messages" },
          { id: "b", text: "Envoyer la requête avec la liste complète" },
          { id: "c", text: "Contrôler la raison d'arrêt de la réponse" },
          { id: "d", text: "Ajouter la réponse du modèle à la liste, avec le rôle assistant" },
        ],
        answer: ["a", "b", "c", "d"],
        explanation: "La liste des messages vit dans ton programme. Elle s'allonge de deux entrées par tour : le message de l'utilisateur, puis la réponse du modèle.",
      },
      {
        id: "api-cest-quoi:q7",
        type: "true_false",
        concept: "streaming",
        statement: "Activer le streaming fait générer la réponse complète plus vite par le modèle.",
        answer: false,
        explanation: "Le streaming change la livraison, pas la génération : tu reçois les fragments à mesure qu'ils sont produits, ce qui réduit l'attente perçue.",
      },
      {
        id: "api-cest-quoi:q8",
        type: "written",
        concept: "facturation",
        prompt: "Un collègue s'étonne : « Mon chatbot coûte de plus en plus cher à chaque message d'une même conversation, alors que les messages sont courts. » Explique pourquoi en une ou deux phrases.",
        placeholder: "Parce que l'API…",
        criteria: [
          {
            id: "historique",
            label: "L'historique est renvoyé à chaque tour",
            anyOf: [
              "historique",
              "renvo",
              "tout ce qui précède",
              "tout ce qui precede",
              "messages précédents",
              "messages precedents",
              "sans état",
              "sans etat",
              "stateless",
              "relit",
              "relu",
              "conversation entière",
              "conversation entiere",
            ],
          },
          {
            id: "entree",
            label: "Ces tokens sont facturés en entrée",
            anyOf: ["entrée", "entree", "input", "token", "factur", "pay"],
          },
        ],
        minCriteria: 2,
        modelAnswer: "L'API est sans état : à chaque tour, le programme renvoie tout l'historique, que le modèle relit. Ces tokens d'entrée sont refacturés à chaque message, donc le coût par tour augmente avec la longueur de la conversation.",
        explanation: "Le coût d'un tour dépend de tout ce que le modèle lit, pas seulement du dernier message.",
      },
    ],
    reviewQuestions: [
      {
        id: "api-cest-quoi:r1",
        type: "mcq",
        concept: "sans-etat",
        prompt: "Par l'API, tu envoies d'abord « Je m'appelle Karim. », puis, dans une requête séparée ne contenant que ce message, « Comment je m'appelle ? ». Que répond le modèle ?",
        options: [
          { id: "a", text: "Qu'il ne le sait pas : la seconde requête ne contient pas le premier échange" },
          {
            id: "b",
            text: "« Karim », car le serveur relie les requêtes d'une même clé",
            feedback: "La clé sert à t'identifier et à te facturer, pas à relier des conversations.",
          },
          {
            id: "c",
            text: "Une erreur 400",
            feedback: "La requête est valide. Il lui manque simplement le contexte.",
          },
        ],
        answer: "a",
        explanation: "Chaque requête est indépendante. Pour que le modèle « se souvienne », le premier échange doit figurer dans la liste des messages.",
      },
      {
        id: "api-cest-quoi:r2",
        type: "ranking",
        concept: "cle-api",
        prompt: "Classe ces pratiques de la plus risquée à la moins risquée pour ta clé d'API.",
        scale: ["La plus risquée", "La moins risquée"],
        items: [
          { id: "a", text: "Clé écrite dans le JavaScript d'un site public" },
          { id: "b", text: "Clé dans un fichier de config d'un dépôt privé partagé avec dix personnes" },
          {
            id: "c",
            text: "Clé dans une variable d'environnement de ton serveur, avec un plafond de dépenses",
          },
        ],
        answer: ["a", "b", "c"],
        explanation: "Dans le navigateur, la clé est publique. Dans un dépôt, même privé, elle est copiée chez chaque collaborateur et reste dans l'historique. Côté serveur avec un plafond, l'exposition et les dégâts possibles sont limités.",
      },
      {
        id: "api-cest-quoi:r3",
        type: "match",
        concept: "raison-arret",
        prompt: "Associe chaque situation à la raison d'arrêt correspondante (noms de l'API Messages d'Anthropic).",
        left: [
          { id: "l1", text: "La réponse est complète" },
          { id: "l2", text: "La réponse est coupée au milieu d'une phrase" },
          { id: "l3", text: "Le modèle veut qu'on exécute une fonction" },
        ],
        right: [{ id: "r1", text: "end_turn" }, { id: "r2", text: "max_tokens" }, { id: "r3", text: "tool_use" }],
        answer: ["r1", "r2", "r3"],
        explanation: "La raison d'arrêt dit à ton code quoi faire ensuite : utiliser, relancer avec plus de marge, ou exécuter un outil.",
      },
      {
        id: "api-cest-quoi:r4",
        type: "true_false",
        concept: "sans-etat",
        statement: "Par l'API, si tu n'envoies aucun prompt système, le modèle applique quand même celui de l'application de chat du même éditeur.",
        answer: false,
        explanation: "Le prompt système de l'application appartient à l'application. Par l'API, le modèle ne reçoit que ce que contient ta requête.",
      },
    ],
    sources: [
      {
        title: "Using the Messages API",
        publisher: "Anthropic, documentation Claude",
        url: "https://platform.claude.com/docs/en/build-with-claude/working-with-messages",
        verified: "2026-10-14",
      },
      {
        title: "Claude API errors",
        publisher: "Anthropic, documentation Claude",
        url: "https://platform.claude.com/docs/en/api/errors",
        verified: "2026-10-14",
      },
      {
        title: "Rate limits",
        publisher: "Anthropic, documentation Claude",
        url: "https://platform.claude.com/docs/en/api/rate-limits",
        verified: "2026-10-14",
      },
      {
        title: "Conversation state",
        publisher: "OpenAI, documentation API",
        url: "https://developers.openai.com/api/docs/guides/conversation-state",
        verified: "2026-10-14",
      },
    ],
  },
  {
    id: "sorties-structurees-et-outils",
    title: "Sorties structurées et appel d'outils",
    objective: "Obtenir d'un modèle une sortie exploitable par un programme (JSON conforme à un schéma) et mettre en place la boucle d'appel d'outils, en sachant qui exécute quoi.",
    theme: "api",
    difficulty: 4,
    format: "atelier",
    durationMin: 15,
    xp: 50,
    skills: [
      "Écrire un schéma JSON pour contraindre une sortie",
      "Dérouler la boucle complète d'un appel d'outil",
      "Rédiger une définition d'outil que le modèle utilise correctement",
      "Valider les arguments avant d'exécuter",
    ],
    sections: [
      {
        id: "texte-libre",
        title: "Le texte libre casse les programmes",
        blocks: [
          {
            type: "text",
            body: "Atelier du jour : un petit service qui trie les messages du support d'une boutique en ligne. Pour chaque message, ton code doit récupérer une catégorie, une urgence et, s'il y en a un, un numéro de commande. Première tentative : tu demandes ça en français au modèle, par l'API.",
          },
          {
            type: "example",
            label: "Trois réponses à la même consigne",
            good: false,
            content: "1) « Catégorie : livraison. Urgence : haute. Commande : 48213 »\n2) « Il s'agit d'un problème de livraison assez urgent concernant la commande n° 48213. »\n3) « **Catégorie** : Livraison (retard) — urgence élevée »",
            note: "Les trois sont justes pour un humain. Pour un programme, ce sont trois formats différents : « haute », « assez urgent », « élevée ». Ton code d'extraction casse au premier écart.",
          },
        ],
      },
      {
        id: "schema",
        title: "JSON et schéma",
        blocks: [
          {
            type: "definition",
            term: "JSON",
            body: "Un format texte pour représenter des données structurées : des objets (paires nom-valeur entre accolades), des listes, des chaînes, des nombres, des booléens. Tous les langages savent le lire et l'écrire.",
          },
          {
            type: "definition",
            term: "Schéma JSON (JSON Schema)",
            body: "Une description, elle-même en JSON, de la forme attendue : quels champs, de quel type, lesquels sont obligatoires, quelles valeurs sont permises. C'est un contrat entre celui qui produit la donnée et celui qui la lit.",
          },
          {
            type: "code",
            lang: "json",
            code: "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"categorie\": { \"type\": \"string\", \"enum\": [\"livraison\", \"paiement\", \"produit\", \"autre\"] },\n    \"urgence\": { \"type\": \"string\", \"enum\": [\"basse\", \"normale\", \"haute\"] },\n    \"numero_commande\": { \"type\": [\"string\", \"null\"], \"description\": \"Numéro cité dans le message, sinon null\" }\n  },\n  \"required\": [\"categorie\", \"urgence\", \"numero_commande\"],\n  \"additionalProperties\": false\n}",
            caption: "Le schéma de l'atelier. Les `enum` ferment la liste des valeurs : plus de « assez urgent ».",
          },
          {
            type: "keypoint",
            body: "Un `enum` vaut mieux qu'une consigne. « Réponds par basse, normale ou haute » est une demande ; un `enum` dans un schéma appliqué par l'API est une contrainte.",
          },
        ],
      },
      {
        id: "sorties-structurees",
        title: "Le schéma appliqué par l'API",
        blocks: [
          {
            type: "definition",
            term: "Sorties structurées (structured outputs)",
            body: "Une fonction de l'API où tu fournis un schéma JSON et où la génération est contrainte : à chaque token, seules les suites compatibles avec le schéma sont permises. La réponse est donc un JSON valide et conforme au schéma.",
          },
          {
            type: "code",
            lang: "json",
            code: "{\n  \"model\": \"nom-du-modele\",\n  \"max_tokens\": 300,\n  \"system\": \"Tu classes des messages de support d'une boutique en ligne.\",\n  \"messages\": [\n    { \"role\": \"user\", \"content\": \"Commande 48213 toujours pas livrée, c'est pour un anniversaire samedi !\" }\n  ],\n  \"output_config\": {\n    \"format\": {\n      \"type\": \"json_schema\",\n      \"schema\": { \"…\": \"le schéma de la section précédente\" }\n    }\n  }\n}",
            caption: "Format de l'API Messages d'Anthropic. La réponse arrive dans un bloc de texte contenant : {\"categorie\": \"livraison\", \"urgence\": \"haute\", \"numero_commande\": \"48213\"}",
          },
          {
            type: "table",
            headers: ["", "Anthropic (API Messages)", "OpenAI (API Responses)"],
            rows: [
              [
                "Où va le schéma",
                "`output_config.format`, type `json_schema`",
                "`text.format`, type `json_schema`, avec `strict: true`",
              ],
              [
                "Mode plus faible",
                "—",
                "Mode JSON (`json_object`) : JSON valide garanti, mais pas le respect d'un schéma",
              ],
              [
                "Contraintes de schéma",
                "Sous-ensemble de JSON Schema ; `additionalProperties` à `false` sur les objets",
                "Sous-ensemble de JSON Schema ; `additionalProperties: false` et tous les champs listés dans `required` (un champ facultatif se modélise avec le type `null`)",
              ],
            ],
            caption: "Même principe, noms différents. Vérifie toujours la page « schémas supportés » de ton fournisseur.",
          },
        ],
      },
      {
        id: "forme-et-fond",
        title: "Bien formé n'est pas juste",
        blocks: [
          {
            type: "mistake",
            title: "« Le schéma est garanti, donc je ne valide plus rien »",
            why: "La garantie porte sur la forme, avec des exceptions documentées : réponse coupée par la limite de tokens (JSON incomplet), refus du modèle, contraintes non appliquées (chez Anthropic : `minimum`, `maxLength`…), casse d'une valeur d'`enum` parfois modifiée.",
            fix: "Teste la raison d'arrêt, analyse le JSON en gérant l'échec, valide-le contre ton schéma, puis applique tes règles métier (le numéro de commande existe-t-il vraiment ?).",
          },
          {
            type: "text",
            body: "Retiens la distinction : le schéma garantit que `urgence` vaut « basse », « normale » ou « haute ». Il ne garantit pas que « haute » soit le bon choix, ni que « 48213 » figure bien dans le message. Une sortie structurée peut être parfaitement formée et fausse. La relecture que tu as apprise pour le texte s'applique aux données.",
          },
          {
            type: "check",
            question: {
              id: "sorties-structurees-et-outils:c1",
              type: "multi",
              concept: "valider-sortie",
              prompt: "Tu utilises les sorties structurées avec un schéma. Quelles vérifications restent nécessaires dans ton code ?",
              options: [
                { id: "a", text: "Contrôler la raison d'arrêt (réponse tronquée ou refus)" },
                { id: "b", text: "Vérifier les règles métier, par exemple que le numéro de commande existe" },
                {
                  id: "c",
                  text: "Valider les contraintes que l'API n'applique pas, comme une valeur minimale",
                },
                {
                  id: "d",
                  text: "Retirer à la main les phrases d'introduction autour du JSON",
                  feedback: "C'était le problème du texte libre. Avec une sortie contrainte, il n'y a pas de texte autour.",
                },
              ],
              answer: ["a", "b", "c"],
              explanation: "La contrainte règle la forme. Le contenu, la complétude et les règles hors schéma restent à ta charge.",
            },
          },
        ],
      },
      {
        id: "appel-outils",
        title: "Le modèle demande, ton code exécute",
        blocks: [
          {
            type: "text",
            body: "Le tri fonctionne. Étape suivante : le client demande où en est sa commande. Le modèle ne peut pas le savoir, l'information est dans ta base. Tu vas lui donner un **outil**.",
          },
          {
            type: "definition",
            term: "Appel d'outils (tool use, function calling)",
            body: "Un mécanisme où tu décris au modèle des fonctions disponibles (nom, description, schéma des paramètres). Quand il juge qu'une fonction est utile, il ne l'exécute pas : il produit une **demande d'appel** structurée, avec le nom de l'outil et les arguments. Ton code l'exécute et renvoie le résultat.",
          },
          {
            type: "flow",
            title: "La boucle complète",
            loop: true,
            nodes: [
              {
                label: "1. Décrire",
                detail: "Ta requête contient le message de l'utilisateur et la liste des outils : pour chacun, un nom, une description et le schéma JSON de ses paramètres.",
              },
              {
                label: "2. Le modèle demande",
                detail: "La réponse ne contient pas la réponse finale mais une demande d'appel : nom de l'outil, arguments, identifiant d'appel. La raison d'arrêt le signale (`tool_use` chez Anthropic).",
              },
              {
                label: "3. Ton code valide",
                detail: "Tu vérifies que l'outil existe, que les arguments respectent le schéma et que cet appel est autorisé pour cet utilisateur.",
              },
              {
                label: "4. Ton code exécute",
                detail: "Ta fonction tourne chez toi : requête en base, appel à un service. Le modèle n'a accès à rien de tout ça.",
              },
              {
                label: "5. Renvoyer le résultat",
                detail: "Tu refais une requête avec tout l'historique, la demande d'appel du modèle, et le résultat rattaché au même identifiant d'appel.",
              },
              {
                label: "6. Le modèle poursuit",
                detail: "Il rédige la réponse finale à partir du résultat, ou demande un autre appel. Dans ce cas, la boucle recommence.",
              },
            ],
            caption: "Deux requêtes au minimum pour une question. L'API étant sans état, la seconde contient tout : question, demande d'appel, résultat.",
          },
        ],
      },
      {
        id: "boucle",
        title: "La boucle en pratique",
        blocks: [
          {
            type: "code",
            lang: "json",
            code: "// 1. Dans ta requête : la définition de l'outil\n\"tools\": [{\n  \"name\": \"suivi_commande\",\n  \"description\": \"Renvoie le statut de livraison d'une commande de la boutique. À utiliser quand le client demande où en est une commande et qu'un numéro est connu. Ne renvoie ni le contenu de la commande ni les informations de paiement.\",\n  \"input_schema\": {\n    \"type\": \"object\",\n    \"properties\": {\n      \"numero_commande\": { \"type\": \"string\", \"description\": \"Numéro à 5 chiffres, par exemple 48213\" }\n    },\n    \"required\": [\"numero_commande\"]\n  }\n}]\n\n// 2. Réponse du modèle : une DEMANDE, pas un résultat\n{\n  \"stop_reason\": \"tool_use\",\n  \"content\": [\n    { \"type\": \"tool_use\", \"id\": \"toolu_01Fictif\", \"name\": \"suivi_commande\",\n      \"input\": { \"numero_commande\": \"48213\" } }\n  ]\n}\n\n// 5. Ta requête suivante : l'historique + le résultat de TA fonction\n\"messages\": [\n  { \"role\": \"user\", \"content\": \"Où en est ma commande 48213 ?\" },\n  { \"role\": \"assistant\", \"content\": [ /* le bloc tool_use reçu, tel quel */ ] },\n  { \"role\": \"user\", \"content\": [\n    { \"type\": \"tool_result\", \"tool_use_id\": \"toolu_01Fictif\",\n      \"content\": \"Expédiée le 9 octobre, livraison prévue le 14 octobre.\" }\n  ] }\n]",
            caption: "Extraits au format de l'API Messages d'Anthropic (identifiant et données fictifs). Les commentaires ne font pas partie du JSON.",
          },
          {
            type: "table",
            headers: ["Étape", "Anthropic", "OpenAI (API Responses)"],
            rows: [
              [
                "Définition",
                "`name`, `description`, `input_schema`",
                "`type: \"function\"`, `name`, `description`, `parameters`",
              ],
              [
                "Demande du modèle",
                "Bloc `tool_use` avec `id`, `name`, `input` (objet JSON)",
                "Élément `function_call` avec `call_id`, `name`, `arguments` (chaîne JSON à analyser)",
              ],
              [
                "Résultat renvoyé",
                "Bloc `tool_result` avec `tool_use_id`",
                "Élément `function_call_output` avec `call_id`",
              ],
              [
                "Arguments conformes au schéma",
                "Option `strict: true` sur l'outil",
                "Option `strict: true` sur la fonction",
              ],
            ],
            caption: "Chez Google aussi, la documentation de l'API Gemini le dit sans détour : le modèle n'exécute pas la fonction lui-même.",
          },
          {
            type: "text",
            title: "Une exception à connaître",
            body: "Les fournisseurs proposent aussi des outils qu'ils exécutent eux-mêmes sur leur infrastructure, comme la recherche web ou l'exécution de code : Anthropic les appelle des outils serveur. Là, tu vois le résultat sans rien exécuter. Mais dès qu'il s'agit de **tes** fonctions, de **tes** données, c'est ton code qui exécute, toujours.",
          },
          {
            type: "check",
            question: {
              id: "sorties-structurees-et-outils:c2",
              type: "mcq",
              concept: "qui-execute",
              prompt: "Le modèle renvoie une demande d'appel pour `suivi_commande` avec le numéro 48213. À cet instant, qu'est-ce qui a été fait dans ta base de données ?",
              options: [
                {
                  id: "a",
                  text: "Rien : aucune requête n'a encore été faite, c'est à ton code de l'exécuter",
                },
                {
                  id: "b",
                  text: "Le modèle a lu la commande 48213 et attend ta confirmation",
                  feedback: "Le modèle n'a aucun accès à ta base. Il a seulement écrit un nom de fonction et des arguments.",
                },
                {
                  id: "c",
                  text: "Le fournisseur a exécuté la fonction sur ses serveurs",
                  feedback: "Vrai seulement pour les outils serveur du fournisseur, pas pour une fonction que tu as définie.",
                },
              ],
              answer: "a",
              explanation: "Une demande d'appel est du texte structuré. Tant que ton code ne l'a pas lue et exécutée, il ne s'est rien passé dans le monde réel.",
            },
          },
        ],
      },
      {
        id: "decrire-un-outil",
        title: "Bien décrire un outil",
        blocks: [
          {
            type: "text",
            body: "Le modèle choisit un outil à partir de ce que tu en dis, et de rien d'autre : il ne voit pas ton code. La description joue pour l'outil le rôle que le prompt joue pour la tâche. La documentation d'Anthropic en fait le facteur le plus important de la qualité des appels ; celle d'OpenAI propose un test simple : un stagiaire saurait-il utiliser la fonction avec seulement ce que le modèle voit ?",
          },
          {
            type: "compare",
            title: "Même outil, deux descriptions",
            columns: ["Description pauvre", "Description utile"],
            rows: [
              { label: "Nom", a: "`get`", b: "`suivi_commande`" },
              {
                label: "Description",
                a: "« Récupère une commande. »",
                b: "« Renvoie le statut de livraison d'une commande. À utiliser quand le client demande où en est une commande et qu'un numéro est connu. Ne renvoie ni le contenu ni le paiement. »",
              },
              {
                label: "Paramètre",
                a: "`id` : string",
                b: "`numero_commande` : string, « Numéro à 5 chiffres, par exemple 48213 »",
              },
            ],
          },
          {
            type: "steps",
            title: "Ce qu'une bonne définition contient",
            items: [
              {
                title: "Ce que fait l'outil, et ce qu'il renvoie",
                body: "En clair, avec l'unité ou le format du résultat.",
              },
              {
                title: "Quand l'utiliser, et quand ne pas l'utiliser",
                body: "C'est ce qui départage deux outils voisins.",
              },
              {
                title: "Le sens et le format de chaque paramètre",
                body: "Avec un exemple de valeur. Utilise des `enum` dès que la liste des valeurs est fermée.",
              },
              {
                title: "Ses limites",
                body: "Ce qu'il ne renvoie pas, pour que le modèle ne l'appelle pas en espérant autre chose.",
              },
            ],
          },
          {
            type: "mistake",
            title: "Donner cinquante outils qui se ressemblent",
            why: "Chaque définition est du texte que le modèle lit à chaque requête (et que tu paies en tokens d'entrée). Plus il y a d'outils, et plus ils sont proches (`chercher_client`, `trouver_client`, `client_par_nom`), plus le choix devient ambigu.",
            fix: "Regroupe les opérations voisines, donne des noms qui se distinguent, préfixe par service quand il y en a plusieurs, et ne fournis à chaque requête que les outils utiles à la tâche. Ne demande pas au modèle un argument que ton code connaît déjà, comme l'identifiant de l'utilisateur connecté.",
          },
        ],
      },
      {
        id: "securite",
        title: "Un outil est un pouvoir",
        blocks: [
          {
            type: "text",
            body: "Tant que le modèle n'écrit que du texte, une erreur produit un mauvais texte. Avec des outils, une erreur produit une **action** : un remboursement, un e-mail envoyé, une ligne supprimée. Les arguments sont générés par un modèle, à partir d'un texte qui vient souvent d'un inconnu. Traite-les comme n'importe quelle entrée non fiable.",
          },
          {
            type: "spectrum",
            title: "Tous les outils ne se valent pas",
            poles: ["Lecture, sans effet", "Action irréversible"],
            items: [
              {
                label: "Lire le statut d'une commande",
                position: 10,
                detail: "Peu de risque, à condition de vérifier que la commande appartient bien au client qui demande.",
              },
              {
                label: "Créer un brouillon de réponse",
                position: 35,
                detail: "Un humain relit avant l'envoi : l'erreur est rattrapable.",
              },
              {
                label: "Envoyer un e-mail au client",
                position: 65,
                detail: "Visible de l'extérieur et impossible à rappeler. À encadrer : modèles de message, confirmation.",
              },
              {
                label: "Rembourser une commande",
                position: 92,
                detail: "Argent réel, irréversible. Plafond, confirmation humaine, journal des appels.",
              },
            ],
            caption: "Plus on va à droite, plus il faut de garde-fous entre la demande du modèle et l'exécution.",
          },
          {
            type: "steps",
            title: "Garde-fous côté code",
            items: [
              {
                title: "Valider les arguments",
                body: "Contre le schéma, puis contre tes règles : format, bornes, existence de la ressource.",
              },
              {
                title: "Vérifier les droits de l'utilisateur, pas ceux du modèle",
                body: "Ta fonction applique les mêmes contrôles d'accès que si l'utilisateur avait cliqué lui-même. Le modèle ne doit pas pouvoir lire la commande d'un autre client parce qu'on le lui a demandé gentiment.",
              },
              {
                title: "Moindre privilège",
                body: "Un outil de lecture utilise un accès en lecture seule. Pas d'outil générique « exécuter du SQL » quand trois requêtes précises suffisent.",
              },
              {
                title: "Confirmation humaine pour l'irréversible",
                body: "Le modèle prépare, une personne valide.",
              },
              {
                title: "Journaliser",
                body: "Chaque appel, ses arguments, son résultat : indispensable pour comprendre après coup.",
              },
            ],
          },
          {
            type: "exercise",
            title: "Conçois l'outil de remboursement",
            minutes: 5,
            prompt: "Sur papier ou dans un éditeur. La boutique veut que l'assistant puisse proposer un remboursement. Écris la définition d'un outil `demander_remboursement` : nom, description (au moins trois phrases : ce qu'il fait, quand l'utiliser, ce qu'il ne fait pas) et schéma des paramètres. Puis liste trois contrôles que ton code effectue AVANT d'exécuter quoi que ce soit.",
            hints: [
              "Le motif peut être un `enum`.",
              "Faut-il vraiment que l'outil rembourse, ou qu'il crée une demande à valider ?",
              "L'identité du client vient-elle du modèle ou de ta session ?",
            ],
            solution: "Une bonne réponse : description « Crée une demande de remboursement pour une commande, soumise à validation par un conseiller. À utiliser quand le client demande explicitement un remboursement et que le numéro de commande est connu. N'effectue aucun paiement et ne garantit pas l'acceptation. » Paramètres : `numero_commande` (string, 5 chiffres), `motif` (enum : non_livree, defectueuse, erreur_article, autre), `commentaire` (string, facultatif). Pas de montant ni d'identifiant client fournis par le modèle : le montant vient de ta base, le client de la session. Contrôles avant exécution : 1) les arguments respectent le schéma ; 2) la commande existe et appartient au client connecté ; 3) elle n'a pas déjà été remboursée et entre dans le délai prévu. Et l'outil crée une demande, il ne déclenche pas le virement : un humain valide.",
          },
        ],
      },
    ],
    summary: [
      "Un programme ne peut pas s'appuyer sur du texte libre : il lui faut du JSON conforme à un schéma (champs, types, valeurs permises).",
      "Les sorties structurées contraignent la génération à respecter ton schéma. Elles garantissent la forme, pas la justesse : contrôle la raison d'arrêt et valide côté code.",
      "Appel d'outils : tu décris des outils, le modèle DEMANDE un appel, TON code valide et exécute, tu renvoies le résultat, le modèle poursuit.",
      "Le modèle choisit un outil d'après son nom, sa description et son schéma : dis ce qu'il fait, quand l'utiliser, ce qu'il ne fait pas.",
      "Un outil est un pouvoir : valide les arguments, applique les droits de l'utilisateur, limite les privilèges, fais confirmer l'irréversible.",
    ],
    questions: [
      {
        id: "sorties-structurees-et-outils:q1",
        type: "ordering",
        concept: "boucle-outils",
        prompt: "Remets dans l'ordre les étapes d'un appel d'outil.",
        items: [
          { id: "a", text: "Ta requête décrit les outils disponibles" },
          { id: "b", text: "Le modèle renvoie une demande d'appel avec des arguments" },
          { id: "c", text: "Ton code valide les arguments et exécute la fonction" },
          { id: "d", text: "Tu renvoies le résultat au modèle dans une nouvelle requête" },
          { id: "e", text: "Le modèle rédige la réponse finale" },
        ],
        answer: ["a", "b", "c", "d", "e"],
        explanation: "Décrire, demander, exécuter, renvoyer, conclure. L'exécution est le seul moment où quelque chose se passe réellement, et c'est ton code qui la fait.",
      },
      {
        id: "sorties-structurees-et-outils:q2",
        type: "true_false",
        concept: "qui-execute",
        statement: "Quand le modèle renvoie une demande d'appel pour une fonction que tu as définie, la fonction a déjà été exécutée par le fournisseur.",
        answer: false,
        explanation: "Pour tes propres fonctions, le modèle ne fait que produire un nom et des arguments. Seuls les outils serveur du fournisseur (recherche web, par exemple) sont exécutés chez lui.",
      },
      {
        id: "sorties-structurees-et-outils:q3",
        type: "mcq",
        concept: "schema",
        prompt: "Tu veux que le champ `priorite` ne puisse valoir que « basse », « normale » ou « haute ». Quel est le moyen le plus fiable ?",
        options: [
          { id: "a", text: "Un `enum` dans le schéma, appliqué par les sorties structurées" },
          {
            id: "b",
            text: "Écrire la consigne en majuscules dans le prompt système",
            feedback: "Une consigne reste une demande : le modèle peut s'en écarter.",
          },
          {
            id: "c",
            text: "Donner trois exemples dans le prompt",
            feedback: "Les exemples aident, mais ne garantissent pas la valeur.",
          },
          {
            id: "d",
            text: "Baisser la limite de tokens de sortie",
            feedback: "Cela coupe la réponse, sans effet sur les valeurs permises.",
          },
        ],
        answer: "a",
        explanation: "Un schéma appliqué par l'API contraint la génération. Une consigne en langage naturel ne fait qu'orienter.",
      },
      {
        id: "sorties-structurees-et-outils:q4",
        type: "ai_analysis",
        concept: "decrire-outil",
        prompt: "Un développeur a donné au modèle deux outils : `search` (« Cherche. ») et `find` (« Trouve des éléments. »). Analyse l'échange : quels problèmes vois-tu ?",
        userMessage: "Quel est le numéro de téléphone de la cliente Mme Lefort ?",
        aiResponse: "[demande d'appel] find({ \"q\": \"Lefort téléphone\" })",
        options: [
          { id: "a", text: "Les deux noms ne permettent pas de savoir quel outil choisir" },
          { id: "b", text: "Les descriptions ne disent ni quoi, ni quand, ni ce qui est renvoyé" },
          { id: "c", text: "Le paramètre `q` n'a ni sens ni format documentés" },
          {
            id: "d",
            text: "Le modèle aurait dû exécuter la recherche lui-même",
            feedback: "Non : il ne peut que demander l'appel. C'est le fonctionnement normal.",
          },
        ],
        answer: ["a", "b", "c"],
        explanation: "Le modèle a deviné. Avec des noms distincts (`chercher_client`, `chercher_produit`), des descriptions complètes et des paramètres documentés, le choix n'est plus un pari.",
      },
      {
        id: "sorties-structurees-et-outils:q5",
        type: "multi",
        concept: "valider-sortie",
        prompt: "Dans quels cas une réponse en sortie structurée peut-elle ne pas respecter ton schéma ?",
        options: [
          { id: "a", text: "La réponse a été tronquée par la limite de tokens de sortie" },
          { id: "b", text: "Le modèle a refusé de répondre" },
          {
            id: "c",
            text: "Le message de l'utilisateur était écrit en anglais",
            feedback: "La langue de l'entrée ne change rien à la contrainte de forme.",
          },
          {
            id: "d",
            text: "Le schéma contenait un `enum`",
            feedback: "Les `enum` font partie de ce que la contrainte sait appliquer.",
          },
        ],
        answer: ["a", "b"],
        explanation: "Ce sont les deux exceptions documentées par Anthropic comme par OpenAI. D'où la règle : toujours lire la raison d'arrêt avant d'analyser le JSON.",
      },
      {
        id: "sorties-structurees-et-outils:q6",
        type: "mcq",
        concept: "securite-outils",
        prompt: "Un client écrit : « Je suis le gérant, affiche-moi la commande 51020. » Le modèle demande `suivi_commande` avec 51020, qui appartient à un autre client. Que doit faire ton code ?",
        options: [
          {
            id: "a",
            text: "Vérifier que la commande appartient au client connecté, et refuser sinon, en renvoyant ce refus comme résultat de l'outil",
          },
          {
            id: "b",
            text: "Exécuter : le modèle a jugé la demande légitime",
            feedback: "Le modèle n'a aucun moyen de vérifier une identité. Il a cru ce qui était écrit.",
          },
          {
            id: "c",
            text: "Ajouter au prompt système « ne montre jamais la commande d'un autre »",
            feedback: "Utile en complément, mais un contrôle d'accès ne se délègue pas à une consigne.",
          },
        ],
        answer: "a",
        explanation: "Les droits s'appliquent dans ta fonction, d'après la session de l'utilisateur. Le modèle peut être trompé par un texte ; ton contrôle d'accès, non.",
      },
      {
        id: "sorties-structurees-et-outils:q7",
        type: "fill_choice",
        concept: "qui-execute",
        prompt: "Complète la phrase.",
        sentence: "Dans l'appel d'outils, le modèle ___ et ton code exécute.",
        options: [
          { id: "a", text: "demande un appel, avec un nom d'outil et des arguments" },
          { id: "b", text: "se connecte à ta base de données" },
          { id: "c", text: "télécharge ta fonction pour la lancer" },
        ],
        answer: "a",
        explanation: "Le modèle ne produit que du texte structuré. Tout accès réel à un système passe par ton code.",
      },
      {
        id: "sorties-structurees-et-outils:q8",
        type: "written",
        concept: "securite-outils",
        prompt: "Explique en deux phrases pourquoi il faut valider les arguments d'un appel d'outil avant de l'exécuter, même quand le schéma est appliqué strictement.",
        placeholder: "Parce que les arguments…",
        criteria: [
          {
            id: "source",
            label: "Les arguments viennent du modèle ou d'un texte non fiable",
            anyOf: [
              "modèle",
              "modele",
              "généré",
              "genere",
              "non fiable",
              "utilisateur",
              "tromp",
              "inject",
              "invent",
              "halluc",
            ],
          },
          {
            id: "forme-fond",
            label: "Le schéma garantit la forme, pas la justesse ni les droits",
            anyOf: [
              "forme",
              "format",
              "droit",
              "autoris",
              "accès",
              "acces",
              "existe",
              "métier",
              "metier",
              "appartien",
              "permission",
              "juste",
              "faux",
              "fausse",
            ],
          },
          {
            id: "consequence",
            label: "Un outil produit une action réelle",
            anyOf: [
              "action",
              "irréversible",
              "irreversible",
              "réel",
              "reel",
              "conséquence",
              "consequence",
              "effet",
              "dégât",
              "degat",
              "rembours",
              "supprim",
            ],
          },
        ],
        minCriteria: 2,
        modelAnswer: "Les arguments sont générés par le modèle à partir d'un texte qui peut être faux ou malveillant : le schéma garantit leur forme, pas qu'ils soient justes ni que l'utilisateur ait le droit de faire cette action. Comme un outil déclenche une action réelle, parfois irréversible, c'est à mon code de contrôler avant d'exécuter.",
        explanation: "Forme correcte ne veut pas dire appel légitime. Le contrôle des règles métier et des droits reste dans ton code.",
      },
    ],
    reviewQuestions: [
      {
        id: "sorties-structurees-et-outils:r1",
        type: "mcq",
        concept: "boucle-outils",
        prompt: "Après avoir exécuté l'outil, que doit contenir ta requête suivante pour que le modèle puisse conclure ?",
        options: [
          {
            id: "a",
            text: "L'historique, la demande d'appel du modèle et le résultat rattaché à l'identifiant de cet appel",
          },
          {
            id: "b",
            text: "Seulement le résultat de l'outil",
            feedback: "L'API est sans état : sans la question et la demande d'appel, le résultat n'a aucun contexte.",
          },
          {
            id: "c",
            text: "Rien : le modèle récupère le résultat tout seul",
            feedback: "Le modèle n'a aucun accès à ton système. Il ne connaît que ce que tu lui envoies.",
          },
        ],
        answer: "a",
        explanation: "L'identifiant d'appel relie le résultat à la demande. Le tout doit figurer dans la liste des messages, puisque rien n'est conservé côté serveur.",
      },
      {
        id: "sorties-structurees-et-outils:r2",
        type: "true_false",
        concept: "valider-sortie",
        statement: "Une sortie structurée conforme au schéma est forcément exacte sur le fond.",
        answer: false,
        explanation: "Le schéma impose des champs et des types. Le modèle peut mettre « basse » là où il fallait « haute », ou un numéro de commande qui n'est pas dans le message.",
      },
      {
        id: "sorties-structurees-et-outils:r3",
        type: "ranking",
        concept: "securite-outils",
        prompt: "Classe ces outils de celui qui demande le plus de garde-fous à celui qui en demande le moins.",
        scale: ["Le plus de garde-fous", "Le moins de garde-fous"],
        items: [
          { id: "a", text: "Supprimer le compte d'un client" },
          { id: "b", text: "Envoyer un e-mail au client" },
          { id: "c", text: "Enregistrer un brouillon de réponse pour relecture" },
          { id: "d", text: "Lire les horaires d'ouverture du magasin" },
        ],
        answer: ["a", "b", "c", "d"],
        explanation: "Le critère : l'action est-elle réversible, visible de l'extérieur, et que coûte une erreur ? Une donnée publique en lecture n'engage à rien ; une suppression est définitive.",
      },
      {
        id: "sorties-structurees-et-outils:r4",
        type: "match",
        concept: "decrire-outil",
        prompt: "Associe chaque défaut d'une définition d'outil à son effet probable.",
        left: [
          { id: "l1", text: "Description d'une seule phrase vague" },
          { id: "l2", text: "Deux outils aux noms presque identiques" },
          { id: "l3", text: "Paramètre sans format ni exemple" },
        ],
        right: [
          { id: "r1", text: "Le modèle ne sait pas quand appeler l'outil" },
          { id: "r2", text: "Le modèle choisit l'un ou l'autre au hasard" },
          { id: "r3", text: "Les arguments arrivent dans un format inattendu" },
        ],
        answer: ["r1", "r2", "r3"],
        explanation: "Le modèle ne voit que la définition. Chaque trou dans la définition devient une devinette.",
      },
    ],
    sources: [
      {
        title: "Tool use with Claude",
        publisher: "Anthropic, documentation Claude",
        url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview",
        verified: "2026-10-14",
      },
      {
        title: "Structured outputs",
        publisher: "Anthropic, documentation Claude",
        url: "https://platform.claude.com/docs/en/build-with-claude/structured-outputs",
        verified: "2026-10-14",
      },
      {
        title: "Function calling",
        publisher: "OpenAI, documentation API",
        url: "https://developers.openai.com/api/docs/guides/function-calling",
        verified: "2026-10-14",
      },
      {
        title: "Structured model outputs",
        publisher: "OpenAI, documentation API",
        url: "https://developers.openai.com/api/docs/guides/structured-outputs",
        verified: "2026-10-14",
      },
    ],
  },
  {
    id: "cadrer-un-projet-ia",
    title: "Cadrer un projet avec l'IA",
    objective: "Remplir une fiche de cadrage d'une page qui dit quel problème tu résous, pourquoi l'IA convient ou non, comment tu mesureras la réussite et par quelle version minimale commencer.",
    theme: "projets",
    difficulty: 3,
    format: "atelier",
    durationMin: 15,
    xp: 45,
    skills: [
      "Formuler un problème et son bénéficiaire avant de parler de solution",
      "Juger si une tâche est un bon cas pour l'IA",
      "Définir un critère de réussite mesurable et une version minimale",
      "Repérer les données sensibles et prévoir des garde-fous",
    ],
    sections: [
      {
        id: "probleme",
        title: "Un chatbot, pour quoi faire ?",
        blocks: [
          {
            type: "text",
            body: "Une association d'aide aux devoirs reçoit une quarantaine de messages de parents par semaine. La présidente annonce en réunion : « Il nous faut un chatbot. » Trois mois plus tard, le chatbot existe, répond à côté une fois sur trois, et les bénévoles relisent tout. Personne n'avait écrit ce qu'on attendait de lui. Le **cadrage** est le quart d'heure qui évite ces trois mois : avant de construire quoi que ce soit, on écrit sur une page ce qu'on veut obtenir et comment on saura si c'est obtenu.",
          },
          {
            type: "definition",
            term: "Cadrage",
            body: "La description écrite d'un projet avant sa réalisation : le problème, la personne qui le subit, le résultat attendu et la façon de le mesurer, ce qu'on fait d'abord, les données en jeu et les risques. Une page suffit ; si elle est impossible à remplir, le projet n'est pas prêt.",
          },
        ],
      },
      {
        id: "formuler",
        title: "Le problème, pas la solution",
        blocks: [
          {
            type: "compare",
            title: "Une solution n'est pas un problème",
            columns: ["Formulé comme une solution", "Formulé comme un problème"],
            rows: [
              {
                a: "« Il nous faut un chatbot. »",
                b: "« Les deux bénévoles du secrétariat passent environ quatre heures par semaine à répondre à des questions dont la réponse est déjà dans le règlement. »",
              },
              {
                a: "« On devrait utiliser l'IA pour les devis. »",
                b: "« Chaque devis me prend quarante minutes de rédaction, et j'en refuse faute de temps. »",
              },
              {
                a: "« Je veux un assistant pour réviser. »",
                b: "« Je relis mes cours sans rien retenir : je ne sais pas ce que je ne sais pas avant l'examen. »",
              },
            ],
          },
          {
            type: "text",
            body: "Un problème bien formulé contient trois éléments : **qui** le subit, **ce qui se passe aujourd'hui** (si possible avec un ordre de grandeur que tu as réellement observé), et **ce que ça coûte** en temps, en argent ou en qualité. La colonne de droite permet de comparer plusieurs solutions. Pour l'association, une page « questions fréquentes » bien faite réglerait peut-être la moitié du problème, sans aucune IA.",
          },
          {
            type: "check",
            question: {
              id: "cadrer-un-projet-ia:c1",
              type: "mcq",
              concept: "probleme",
              prompt: "Laquelle de ces phrases est un problème correctement formulé ?",
              options: [
                {
                  id: "a",
                  text: "« Les nouveaux salariés mettent trois semaines à trouver seuls les procédures, et interrompent leurs collègues plusieurs fois par jour. »",
                },
                {
                  id: "b",
                  text: "« Il faudrait un agent IA branché sur nos procédures. »",
                  feedback: "C'est une solution. On ne sait ni qui a un problème ni lequel.",
                },
                {
                  id: "c",
                  text: "« Nos concurrents utilisent déjà l'IA. »",
                  feedback: "C'est une inquiétude, pas un problème à résoudre pour quelqu'un.",
                },
              ],
              answer: "a",
              explanation: "On y lit qui (les nouveaux salariés et leurs collègues), ce qui se passe (trois semaines, des interruptions) et le coût (du temps perdu des deux côtés).",
            },
          },
        ],
      },
      {
        id: "bon-cas",
        title: "Un bon cas pour l'IA ?",
        blocks: [
          {
            type: "text",
            body: "Un modèle de langage produit un texte plausible à partir d'un autre texte. Il le fait vite, à grande échelle, et se trompe parfois sans prévenir. Ces trois propriétés donnent quatre questions à poser à ton problème.",
          },
          {
            type: "table",
            headers: ["Question", "Bon signe", "Mauvais signe"],
            rows: [
              [
                "Est-ce une tâche de langage ?",
                "Lire, résumer, classer, reformuler, rédiger, extraire une information d'un texte",
                "Un calcul exact, une règle fixe (« si le montant dépasse 500 €, alors… »), une recherche dans une base : un tableur ou un programme classique le fait mieux et sans erreur",
              ],
              [
                "Quelle tolérance à l'erreur ?",
                "Un humain relit avant que le résultat serve, ou l'erreur est visible et réparable",
                "Le résultat part tel quel et une erreur touche la santé, l'argent ou les droits de quelqu'un",
              ],
              [
                "Y a-t-il du volume ?",
                "La tâche revient souvent, ou porte sur beaucoup de textes",
                "Deux fois par an : le temps de mise au point dépasse le temps gagné",
              ],
              [
                "Quelle valeur ?",
                "Le temps ou la qualité gagnés sont nettement supérieurs au temps de vérification",
                "Tout relire prend autant de temps que tout faire",
              ],
            ],
            caption: "Quatre « bon signe » : bon candidat. Un « mauvais signe » sur la tolérance à l'erreur : change la place de l'IA dans le projet, ou renonce.",
          },
          {
            type: "spectrum",
            title: "Tolérance à l'erreur : où se place ton projet ?",
            poles: ["Erreur bénigne", "Erreur grave"],
            items: [
              {
                label: "Proposer des titres pour une lettre d'information",
                position: 5,
                detail: "Tu choisis parmi les propositions : une mauvaise idée ne coûte rien.",
              },
              {
                label: "Rédiger un brouillon de réponse, relu par un bénévole",
                position: 30,
                detail: "L'humain valide avant l'envoi. L'IA fait gagner le temps de rédaction, pas la responsabilité.",
              },
              {
                label: "Répondre directement aux parents, sans relecture",
                position: 65,
                detail: "Une réponse fausse sur un horaire ou un tarif engage l'association.",
              },
              {
                label: "Décider seul d'accepter ou refuser une inscription",
                position: 95,
                detail: "Une décision qui touche les droits d'une personne ne se délègue pas à un système qui peut se tromper sans le signaler.",
              },
            ],
            caption: "Le même problème peut être déplacé vers la gauche en changeant le rôle de l'IA : brouillon plutôt que décision.",
          },
        ],
      },
      {
        id: "langage-ou-regle",
        title: "Langage ou règle ?",
        blocks: [
          {
            type: "mistake",
            title: "Mettre de l'IA là où une règle suffit",
            why: "L'IA attire parce qu'elle semble tout faire. Mais « envoyer un rappel sept jours avant l'échéance » ou « calculer le total d'une facture » sont des règles exactes : un modèle de langage les exécutera moins bien, moins vite et plus cher qu'un outil classique.",
            fix: "Découpe la tâche en étapes, et demande-toi pour chaque étape : est-ce du langage ou une règle ? Ne confie à l'IA que les étapes de langage.",
          },
          {
            type: "check",
            question: {
              id: "cadrer-un-projet-ia:c2",
              type: "multi",
              concept: "bon-cas",
              prompt: "Un cabinet comptable veut traiter les courriels entrants. Quelles étapes sont de bons cas pour l'IA ?",
              options: [
                { id: "a", text: "Classer chaque courriel par sujet (facture, relance, question)" },
                { id: "b", text: "Proposer un brouillon de réponse relu par un collaborateur" },
                {
                  id: "c",
                  text: "Calculer le montant de TVA à déclarer",
                  feedback: "C'est un calcul exact à fort enjeu : un logiciel comptable, pas un modèle de langage.",
                },
                {
                  id: "d",
                  text: "Envoyer un accusé de réception à chaque message",
                  feedback: "C'est une règle fixe : une réponse automatique classique suffit.",
                },
              ],
              answer: ["a", "b"],
              explanation: "Classer et rédiger un brouillon sont des tâches de langage, à fort volume, avec une relecture humaine. Le calcul et l'envoi systématique sont des règles.",
            },
          },
        ],
      },
      {
        id: "reussite",
        title: "Un critère mesurable",
        blocks: [
          {
            type: "definition",
            term: "Critère de réussite mesurable",
            body: "Une phrase qui permet à deux personnes différentes de constater, sans débat, si le projet a atteint son but. Elle dit **quoi** on observe, **sur quoi** on l'observe et **à partir de quel seuil** on est satisfait.",
          },
          {
            type: "compare",
            title: "Du vœu au critère",
            columns: ["Vague", "Mesurable"],
            rows: [
              {
                a: "« Le chatbot doit bien répondre. »",
                b: "« Sur 30 vraies questions de parents du mois dernier, au moins 27 brouillons sont envoyables après moins d'une minute de retouche, et aucun ne contient une information contraire au règlement. »",
              },
              {
                a: "« Gagner du temps sur les devis. »",
                b: "« Un devis type me prend moins de 15 minutes, relecture comprise, sur les 10 prochains. »",
              },
              {
                a: "« Mieux réviser. »",
                b: "« Avant chaque contrôle, j'ai répondu à 20 questions sur le chapitre et je sais lesquelles j'ai ratées. »",
              },
            ],
          },
          {
            type: "text",
            body: "La documentation d'Anthropic sur l'évaluation résume un bon critère en quatre adjectifs : **précis** (on dit exactement ce qu'on veut), **mesurable** (un nombre ou une échelle définie), **atteignable** (réaliste pour l'outil et pour toi) et **pertinent** (il mesure ce qui compte pour l'utilisateur). Remarque que les critères de droite combinent souvent deux dimensions : une de qualité (« envoyable ») et une limite à ne jamais franchir (« aucune information contraire au règlement »). Les seuils sont les tiens : pars de ce que tu observes aujourd'hui.",
          },
        ],
      },
      {
        id: "version-minimale",
        title: "La version minimale",
        blocks: [
          {
            type: "definition",
            term: "Version minimale",
            body: "La plus petite chose réellement utile à la personne qui a le problème, que tu peux construire et essayer en quelques heures ou quelques jours. Elle sert à vérifier que le problème et le critère sont les bons avant d'investir davantage.",
          },
          {
            type: "example",
            label: "Version minimale pour l'association",
            good: true,
            content: "Un prompt réutilisable dans lequel un bénévole colle le règlement et la question du parent, et qui produit un brouillon de réponse avec l'article du règlement cité. Le bénévole relit et envoie lui-même.",
            note: "Pas de site, pas d'automatisation, pas de chatbot public. On découpe le projet comme une tâche : la première étape utile d'abord. Si les brouillons passent le critère sur 30 questions, on saura que l'étape suivante vaut la peine.",
          },
          {
            type: "mistake",
            title: "Commencer par la version complète",
            why: "On imagine le produit fini (un chatbot sur le site, disponible jour et nuit) et on construit tout d'un coup. On découvre à la fin que le règlement ne répond pas à la moitié des questions, ce qu'une version minimale aurait montré en une après-midi.",
            fix: "Écris la version complète dans la fiche, à la ligne « plus tard ». Puis demande-toi : quelle est la plus petite chose que je peux essayer cette semaine avec un vrai utilisateur ?",
          },
        ],
      },
      {
        id: "donnees-risques",
        title: "Données et risques",
        blocks: [
          {
            type: "text",
            body: "Un projet avec l'IA manipule des textes, et ces textes viennent de quelque part. Avant de construire, liste ce que l'outil devra lire et classe chaque élément. La CNIL rappelle une règle de base pour les outils d'IA générative fournis par un tiers : ne pas y saisir d'informations confidentielles ni de données personnelles sans y être autorisé.",
          },
          {
            type: "table",
            headers: ["Donnée nécessaire", "Sensibilité", "Décision"],
            rows: [
              ["Le règlement de l'association", "Public", "Peut être fourni tel quel"],
              [
                "Les questions des parents",
                "Personnelle : noms, situations familiales, parfois santé ou difficultés scolaires d'un enfant",
                "Retirer noms et détails identifiants avant de coller ; ne garder que la question",
              ],
              [
                "La liste des inscrits et leurs paiements",
                "Personnelle et financière",
                "Hors du projet : la version minimale n'en a pas besoin",
              ],
              [
                "Les anciennes réponses des bénévoles",
                "Interne, avec des données personnelles dedans",
                "En choisir cinq, les anonymiser, s'en servir comme exemples de ton",
              ],
            ],
            caption: "Fiche de l'association (exemple). La troisième colonne est une décision, pas un constat.",
          },
          {
            type: "steps",
            title: "Pour chaque risque, un garde-fou",
            items: [
              {
                title: "L'outil affirme quelque chose de faux",
                body: "Garde-fou : il doit citer le passage du document sur lequel il s'appuie, et dire « je ne trouve pas » sinon. Un humain relit avant tout envoi.",
              },
              {
                title: "Une donnée sensible sort",
                body: "Garde-fou : une liste écrite de ce qui ne doit jamais être collé, et une étape d'anonymisation avant chaque utilisation.",
              },
              {
                title: "On lui fait trop confiance avec le temps",
                body: "Garde-fou : un contrôle régulier sur un échantillon (par exemple cinq réponses par mois relues en détail) et un moyen simple de signaler une erreur.",
              },
              {
                title: "Le projet sert à autre chose que prévu",
                body: "Garde-fou : écrire dans la fiche ce que l'outil ne fait pas (ici : il ne décide d'aucune inscription et ne parle pas de la situation d'un enfant).",
              },
            ],
          },
          {
            type: "keypoint",
            body: "Un risque sans garde-fou écrit est un risque accepté sans le savoir. Si tu ne trouves aucun garde-fou réaliste pour un risque grave, c'est une raison valable de ne pas faire le projet.",
          },
        ],
      },
      {
        id: "fiche",
        title: "La fiche en une page",
        blocks: [
          {
            type: "table",
            headers: ["Rubrique", "Ce que tu écris", "Test de qualité"],
            rows: [
              [
                "1. Problème",
                "Qui le subit, ce qui se passe aujourd'hui, ce que ça coûte",
                "Aucun nom d'outil ou de technologie dans la phrase",
              ],
              [
                "2. Pourquoi l'IA (ou pas)",
                "Langage ? Tolérance à l'erreur ? Volume ? Valeur ?",
                "Tu as envisagé au moins une solution sans IA",
              ],
              [
                "3. Critère de réussite",
                "Ce qu'on observe, sur quoi, à partir de quel seuil",
                "Deux personnes arriveraient au même verdict",
              ],
              [
                "4. Version minimale",
                "La plus petite chose utile, essayable cette semaine",
                "Elle a un utilisateur réel et tient en une phrase",
              ],
              [
                "5. Données",
                "Ce que l'outil lit, sensibilité, décision",
                "Chaque donnée personnelle a une décision",
              ],
              [
                "6. Risques et garde-fous",
                "Deux à quatre risques, un garde-fou chacun",
                "Chaque garde-fou est une action, pas une intention",
              ],
              [
                "7. Hors périmètre et plus tard",
                "Ce que l'outil ne fait pas ; ce qu'on fera si la version minimale réussit",
                "La liste « ne fait pas » n'est pas vide",
              ],
            ],
            caption: "Le modèle à recopier. Tu le réutiliseras dans les projets suivants.",
          },
          {
            type: "compare",
            title: "Deux cadrages pour le même projet",
            columns: ["Mauvais cadrage", "Bon cadrage"],
            rows: [
              {
                label: "Problème",
                a: "« Mettre un chatbot IA sur le site. »",
                b: "« Deux bénévoles passent environ quatre heures par semaine à répondre à des questions déjà traitées dans le règlement. »",
              },
              {
                label: "Pourquoi l'IA",
                a: "« C'est moderne et les parents aiment ça. »",
                b: "« Lire une question et rédiger une réponse à partir d'un texte est une tâche de langage ; une quarantaine de messages par semaine ; un bénévole relit. Une page de questions fréquentes sera faite en parallèle. »",
              },
              {
                label: "Réussite",
                a: "« Que ça réponde bien. »",
                b: "« Sur 30 vraies questions, 27 brouillons envoyables en moins d'une minute de retouche, aucune information contraire au règlement. »",
              },
              {
                label: "Version minimale",
                a: "« Chatbot public disponible jour et nuit. »",
                b: "« Un prompt réutilisable pour les bénévoles, testé pendant deux semaines. »",
              },
              {
                label: "Données",
                a: "« On lui donnera accès à tout. »",
                b: "« Le règlement, et la question sans le nom du parent. Pas la liste des inscrits. »",
              },
              {
                label: "Risques",
                a: "(rubrique vide)",
                b: "« Réponse fausse : citation de l'article obligatoire et relecture. Donnée d'un enfant : anonymisation avant collage. »",
              },
            ],
          },
          {
            type: "exercise",
            title: "Remplis ta fiche",
            minutes: 5,
            prompt: "Choisis un projet réel : un problème qui revient dans tes études, ton travail ou une association. Recopie les sept rubriques et remplis-les, une à trois lignes chacune. Applique ensuite le test de qualité de chaque ligne. Si une rubrique reste vide, note la question à laquelle tu dois d'abord répondre et à qui la poser.",
            hints: [
              "Si tu n'as pas de projet, prends celui-ci : une étudiante veut de l'aide pour préparer ses fiches de révision d'histoire à partir de ses cours.",
              "Pour le critère de réussite, pars d'un chiffre que tu connais aujourd'hui (temps passé, nombre de demandes) plutôt que d'un chiffre idéal.",
            ],
            solution: "Exemple de fiche pour le projet de l'étudiante. 1) Problème : je passe mes dimanches à recopier mes cours d'histoire en fiches et je n'ai plus le temps de m'entraîner. 2) Pourquoi l'IA : résumer et poser des questions sur un texte est une tâche de langage ; un chapitre par semaine ; je relis chaque fiche avec mon cours à côté. Sans IA, je pourrais aussi travailler avec les fiches d'une camarade. 3) Réussite : pour les trois prochains chapitres, une fiche d'une page et dix questions prêtes en moins de trente minutes, relecture comprise, et aucune date ou aucun nom absent de mon cours. 4) Version minimale : un prompt réutilisable où je colle un chapitre, testé sur le chapitre de cette semaine. 5) Données : mes notes de cours (non sensibles) ; pas le polycopié du professeur si sa diffusion est restreinte, à vérifier. 6) Risques : une date inventée, garde-fou : chaque date de la fiche est recherchée dans mon cours ; je n'apprends plus en recopiant, garde-fou : je réponds aux dix questions sans regarder la fiche. 7) Hors périmètre : il ne rédige pas mes dissertations. Plus tard : étendre aux autres matières si les trois chapitres passent le critère. Critères de réussite de l'exercice : ta rubrique 1 ne nomme aucun outil ; ta rubrique 3 contient un nombre et un seuil ; ta rubrique 4 est faisable cette semaine ; ta rubrique 7 dit au moins une chose que l'outil ne fait pas.",
          },
          {
            type: "keypoint",
            body: "Une fiche de cadrage peut conclure « pas d'IA ici » ou « pas maintenant ». C'est un résultat réussi : tu viens d'économiser le projet entier.",
          },
        ],
      },
    ],
    summary: [
      "On cadre avant de construire : une page qui dit le problème, pour qui, et comment on saura que c'est réussi.",
      "Un problème se formule sans nommer de solution : qui le subit, ce qui se passe, ce que ça coûte.",
      "Bon cas pour l'IA : tâche de langage, erreur tolérable ou relue, volume suffisant, gain supérieur au temps de vérification.",
      "Un critère de réussite dit quoi on observe, sur quoi, et à partir de quel seuil.",
      "On commence par la version minimale : la plus petite chose utile, essayée avec un vrai utilisateur.",
      "Chaque donnée personnelle reçoit une décision, chaque risque un garde-fou ; la fiche dit aussi ce que l'outil ne fait pas.",
    ],
    questions: [
      {
        id: "cadrer-un-projet-ia:q1",
        type: "mcq",
        concept: "probleme",
        prompt: "Un gérant de magasin dit : « Je veux une IA qui répond aux avis clients. » Quelle est la meilleure première question à lui poser ?",
        options: [
          { id: "a", text: "« Qu'est-ce qui pose problème aujourd'hui avec les avis, et pour qui ? »" },
          {
            id: "b",
            text: "« Quel modèle voulez-vous utiliser ? »",
            feedback: "On choisit l'outil après avoir compris le problème, pas avant.",
          },
          {
            id: "c",
            text: "« Combien d'avis faut-il traiter par seconde ? »",
            feedback: "Question technique prématurée : on ne sait pas encore ce qu'il faut résoudre.",
          },
          {
            id: "d",
            text: "« Voulez-vous des réponses courtes ou longues ? »",
            feedback: "C'est un détail de format, utile bien plus tard.",
          },
        ],
        answer: "a",
        explanation: "Il a formulé une solution. Le cadrage commence par remonter au problème : qui le subit, ce qui se passe, ce que ça coûte.",
      },
      {
        id: "cadrer-un-projet-ia:q2",
        type: "ranking",
        concept: "tolerance-erreur",
        prompt: "Classe ces usages selon la gravité d'une erreur de l'IA.",
        scale: ["Erreur la plus grave", "Erreur la plus bénigne"],
        items: [
          { id: "a", text: "Décider automatiquement d'accorder ou non une aide financière" },
          { id: "b", text: "Envoyer sans relecture une réponse sur les tarifs à un client" },
          { id: "c", text: "Rédiger un brouillon de réponse relu par un salarié" },
          { id: "d", text: "Proposer cinq idées de noms pour un événement" },
        ],
        answer: ["a", "b", "c", "d"],
        explanation: "Plus le résultat touche les droits ou l'argent de quelqu'un et moins un humain le relit, plus l'erreur est grave. Des idées parmi lesquelles tu choisis ne coûtent rien.",
      },
      {
        id: "cadrer-un-projet-ia:q3",
        type: "multi",
        concept: "bon-cas",
        prompt: "Quels signes indiquent qu'une tâche est un bon cas pour l'IA ?",
        options: [
          { id: "a", text: "Elle consiste à lire et reformuler des textes" },
          { id: "b", text: "Elle revient plusieurs dizaines de fois par semaine" },
          {
            id: "c",
            text: "Elle suit une règle exacte du type « si… alors… »",
            feedback: "Une règle exacte s'exécute mieux avec un outil classique, sans risque d'erreur.",
          },
          { id: "d", text: "Un humain compétent relit le résultat avant qu'il serve" },
        ],
        answer: ["a", "b", "d"],
        explanation: "Langage, volume, relecture : trois bons signes. Une règle exacte est le signe inverse.",
      },
      {
        id: "cadrer-un-projet-ia:q4",
        type: "fill_choice",
        concept: "critere-reussite",
        prompt: "Complète pour obtenir un critère de réussite mesurable.",
        sentence: "« Sur 20 comptes rendus de réunion réels, ___ »",
        options: [
          { id: "a", text: "au moins 18 reprennent toutes les décisions prises, sans en ajouter aucune" },
          {
            id: "b",
            text: "le résultat est globalement satisfaisant",
            feedback: "Deux personnes ne s'accorderaient pas sur « globalement satisfaisant ».",
          },
          { id: "c", text: "l'IA fait de son mieux", feedback: "Ce n'est pas observable." },
        ],
        answer: "a",
        explanation: "On y trouve ce qu'on observe (les décisions reprises, aucune ajoutée), sur quoi (20 comptes rendus réels) et le seuil (18).",
      },
      {
        id: "cadrer-un-projet-ia:q5",
        type: "true_false",
        concept: "version-minimale",
        statement: "La version minimale d'un projet est une maquette pour montrer l'idée, sans utilisateur réel.",
        answer: false,
        explanation: "Elle doit être réellement utile à la personne qui a le problème : c'est en l'utilisant pour de vrai qu'on apprend si le problème et le critère sont les bons.",
      },
      {
        id: "cadrer-un-projet-ia:q6",
        type: "match",
        concept: "fiche",
        prompt: "Associe chaque phrase à la rubrique de la fiche où elle va.",
        left: [
          { id: "l1", text: "« L'outil ne donne aucun avis médical. »" },
          { id: "l2", text: "« Les noms des patients sont retirés avant tout envoi. »" },
          { id: "l3", text: "« Un prompt réutilisable testé par une secrétaire pendant une semaine. »" },
          { id: "l4", text: "« Les secrétaires passent une heure par jour à reformuler des consignes. »" },
        ],
        right: [
          { id: "r1", text: "Hors périmètre" },
          { id: "r2", text: "Données" },
          { id: "r3", text: "Version minimale" },
          { id: "r4", text: "Problème" },
        ],
        answer: ["r1", "r2", "r3", "r4"],
        explanation: "Ce que l'outil ne fait pas, la décision sur une donnée sensible, la plus petite chose utile, et le constat de départ : quatre rubriques distinctes.",
      },
      {
        id: "cadrer-un-projet-ia:q7",
        type: "written",
        concept: "garde-fous",
        prompt: "Une mairie veut que l'IA réponde directement aux habitants sur leurs droits à une aide sociale. Donne un risque et un garde-fou concret.",
        placeholder: "Le risque est… Le garde-fou serait…",
        criteria: [
          {
            id: "risque",
            label: "Un risque identifié (réponse fausse, donnée sensible, décision sur des droits)",
            anyOf: [
              "faux",
              "fausse",
              "erreur",
              "tromp",
              "invent",
              "hallucin",
              "donnée",
              "donnee",
              "personnel",
              "sensible",
              "confidenti",
              "droit",
              "discrimin",
            ],
          },
          {
            id: "garde",
            label: "Un garde-fou qui est une action",
            anyOf: [
              "relu",
              "relecture",
              "relire",
              "humain",
              "agent",
              "valid",
              "cite",
              "citation",
              "source",
              "anonym",
              "masqu",
              "retir",
              "brouillon",
              "contrôl",
              "control",
              "vérifi",
              "verifi",
              "renvo",
              "orient",
            ],
          },
        ],
        minCriteria: 2,
        modelAnswer: "Risque : une réponse fausse fait croire à un habitant qu'il n'a pas droit à une aide. Garde-fou : l'IA rédige seulement un brouillon qui cite le texte officiel, et un agent le relit avant l'envoi ; elle ne décide de rien.",
        explanation: "L'erreur touche les droits d'une personne : on déplace l'IA vers un rôle de brouillon relu, on impose la citation du texte, et on protège les données de situation personnelle.",
      },
    ],
    reviewQuestions: [
      {
        id: "cadrer-un-projet-ia:r1",
        type: "mcq",
        concept: "version-minimale",
        prompt: "Une libraire veut « un assistant qui recommande des livres aux clients sur le site ». Quelle version minimale est la plus pertinente ?",
        options: [
          {
            id: "a",
            text: "Un prompt qu'elle utilise elle-même en boutique pendant deux semaines pour préparer des suggestions à partir de son catalogue",
          },
          {
            id: "b",
            text: "Le chatbot complet sur le site, mais avec un design provisoire",
            feedback: "Tout est construit : ce n'est pas minimal, seul l'habillage l'est.",
          },
          {
            id: "c",
            text: "Une présentation qui explique le futur assistant",
            feedback: "Elle n'est utile à personne et ne teste rien.",
          },
        ],
        answer: "a",
        explanation: "C'est la plus petite chose réellement utile, avec une utilisatrice réelle qui sait juger le résultat. Elle montrera vite si le catalogue suffit à faire de bonnes suggestions.",
      },
      {
        id: "cadrer-un-projet-ia:r2",
        type: "true_false",
        concept: "bon-cas",
        statement: "Une fiche de cadrage qui conclut qu'un tableur suffit est un cadrage raté.",
        answer: false,
        explanation: "C'est un cadrage réussi : il a évité de construire un outil inadapté. La fiche sert à décider, y compris à décider de ne pas utiliser l'IA.",
      },
      {
        id: "cadrer-un-projet-ia:r3",
        type: "multi",
        concept: "critere-reussite",
        prompt: "Lesquels de ces critères de réussite sont mesurables ?",
        options: [
          { id: "a", text: "« Sur 50 courriels, au moins 45 sont rangés dans la bonne catégorie. »" },
          {
            id: "b",
            text: "« Les utilisateurs sont contents. »",
            feedback: "Rien ne dit comment on le constate ni à partir de quand.",
          },
          {
            id: "c",
            text: "« Aucun brouillon envoyé ce mois-ci ne contient de prix absent de la grille tarifaire. »",
          },
          { id: "d", text: "« L'outil est intelligent. »", feedback: "Ce n'est pas observable." },
        ],
        answer: ["a", "c"],
        explanation: "Les deux critères mesurables disent ce qu'on observe, sur quel ensemble, et le seuil (45 sur 50 ; zéro).",
      },
    ],
    sources: [
      {
        title: "Define success criteria and build evaluations",
        publisher: "Anthropic, documentation Claude",
        url: "https://platform.claude.com/docs/en/test-and-evaluate/define-success",
        verified: "2026-10-14",
      },
      {
        title: "Les questions-réponses de la CNIL sur l'utilisation d'un système d'IA générative",
        publisher: "CNIL",
        url: "https://www.cnil.fr/fr/les-questions-reponses-de-la-cnil-sur-lutilisation-dun-systeme-dia-generative",
        verified: "2026-10-13",
      },
    ],
  },
];
