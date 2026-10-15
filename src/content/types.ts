export type TrackId = "bird" | "gecko" | "fox";

/** 1 Découverte · 2 Bases · 3 Intermédiaire · 4 Avancé · 5 Expert */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type ThemeId =
  | "comprendre" // Comprendre l'IA, les modèles et les LLM
  | "prompt" // Prompt engineering et amélioration des réponses
  | "confiance" // Vérification, évaluation, limites, données
  | "outils" // Utiliser et comparer les outils
  | "workflows" // Workflows et automatisation
  | "agents" // Agents IA
  | "dev" // Développement assisté par l'IA
  | "api" // API et MCP
  | "rag" // RAG et bases de données
  | "projets"; // Projets complets

export type Option = { id: string; text: string; feedback?: string };
export type Item = { id: string; text: string };

type QuestionBase = {
  id: string;
  explanation: string;
  /**
   * The notion this question checks, shared by questions that test the same idea in a different form.
   * Reviews use it to bring a notion back under another shape.
   */
  concept?: string;
};

export type Question = QuestionBase &
  (
    | { type: "mcq"; prompt: string; options: Option[]; answer: string }
    | { type: "true_false"; statement: string; answer: boolean }
    | {
        type: "ranking";
        prompt: string;
        /** Labels for the top and bottom of the list, e.g. "Le plus risqué" / "Le moins risqué". */
        scale: [string, string];
        items: Item[];
        answer: string[];
      }
    | { type: "ordering"; prompt: string; items: Item[]; answer: string[] }
    | {
        type: "fill_choice";
        prompt: string;
        /** Sentence containing exactly one "___" blank. */
        sentence: string;
        options: Option[];
        answer: string;
      }
    | {
        type: "ai_analysis";
        prompt: string;
        userMessage: string;
        aiResponse: string;
        /** Multi-select: every option that applies. */
        options: Option[];
        answer: string[];
      }
    | {
        /** Multi-select without a conversation: every option that applies. */
        type: "multi";
        prompt: string;
        options: Option[];
        answer: string[];
      }
    | {
        /** Pair each left item with one right item. `answer[i]` is the right id for `left[i]`. */
        type: "match";
        prompt: string;
        left: Item[];
        right: Item[];
        answer: string[];
      }
    | {
        /**
         * Short written answer. Graded by ideas, not by wording: each criterion is met when the
         * answer contains one of its `anyOf` fragments (accents and case ignored).
         */
        type: "written";
        prompt: string;
        placeholder?: string;
        criteria: { id: string; label: string; anyOf: string[] }[];
        /** How many criteria must be met for the answer to count as correct. */
        minCriteria: number;
        modelAnswer: string;
      }
  );

export type QuestionType = Question["type"];

/** An answer as submitted by the learner. */
export type Answer = string | boolean | string[];

export type IllustrationId =
  | "rules-vs-examples"
  | "next-token"
  | "hallucination"
  | "prompt-anatomy"
  | "data-flow"
  | "tool-landscape"
  | "tutor-loop"
  | "review-checklist";

/**
 * Lesson body blocks. Text fields accept two inline marks: **gras** and `code`.
 * Vary them: a lesson made only of "text" blocks is a wall, not a course.
 */
export type Block =
  | { type: "text"; title?: string; body: string }
  | { type: "definition"; term: string; body: string }
  | { type: "example"; label: string; good?: boolean; content: string; note?: string }
  /** A real exchange with an assistant. `note` comments what to notice. */
  | { type: "dialogue"; label?: string; turns: { who: "user" | "ai"; text: string }[]; note?: string }
  /** Two columns side by side: avant/après, bon/mauvais, outil A/outil B. */
  | { type: "compare"; title?: string; columns: [string, string]; rows: { label?: string; a: string; b: string }[] }
  | { type: "steps"; title?: string; items: { title: string; body: string }[] }
  /** A frequent mistake, why it happens, and what to do instead. */
  | { type: "mistake"; title: string; why: string; fix: string }
  | { type: "keypoint"; body: string }
  | { type: "table"; headers: string[]; rows: string[][]; caption?: string }
  | { type: "code"; lang: string; code: string; caption?: string }
  | { type: "illustration"; id: IllustrationId; caption: string }
  /** Interactive: a chain of steps, each revealing a detail on tap. `loop` draws an arrow back to the start. */
  | { type: "flow"; title?: string; nodes: { label: string; detail: string }[]; loop?: boolean; caption?: string }
  /** Interactive: a stack, from top (closest to the user) to bottom. */
  | { type: "layers"; title?: string; layers: { label: string; detail: string }[]; caption?: string }
  /** Interactive: an annotated text (a prompt, a response, a request). Segments with a `label` are highlighted. */
  | { type: "anatomy"; title?: string; segments: { text: string; label?: string; detail?: string }[]; caption?: string }
  /** A scale between two poles with items placed on it (position 0 to 100). */
  | { type: "spectrum"; title?: string; poles: [string, string]; items: { label: string; position: number; detail?: string }[]; caption?: string }
  /** An ungraded question in the middle of the lesson, answered before moving on. */
  | { type: "check"; question: Question }
  /** Practice to do outside the app (in an assistant, on paper). The solution is revealed on demand. */
  | { type: "exercise"; title: string; prompt: string; hints?: string[]; solution: string; minutes?: number }
  | { type: "tools"; toolIds: ToolId[] };

export type Section = { id: string; title: string; blocks: Block[] };

export type LessonFormat =
  | "notion" // explication progressive d'un concept
  | "atelier" // on fabrique quelque chose pas à pas
  | "etude-de-cas" // un cas réel analysé
  | "comparatif" // mettre des options côte à côte
  | "labo" // manipuler, observer, conclure
  | "projet"; // projet guidé de bout en bout

export type Source = {
  title: string;
  publisher: string;
  url: string;
  /** ISO date the page was actually opened and checked against the lesson. */
  verified: string;
};

export type Lesson = {
  id: string;
  title: string;
  objective: string;
  theme: ThemeId;
  difficulty: Difficulty;
  format: LessonFormat;
  /** Honest reading + practice + quiz time. */
  durationMin: number;
  xp: number;
  skills: string[];
  /** Lesson ids that must be completed (or covered by the placement test) first. */
  prerequisites: string[];
  sections: Section[];
  /** Fiche de notes: the 3 to 6 things to remember. */
  summary: string[];
  /** Final quiz. */
  questions: Question[];
  /** Extra questions used only by reviews, testing the same concepts in another form. */
  reviewQuestions: Question[];
  sources: Source[];
  /** Set when the lesson relies on facts that age (tool features, pricing...). */
  volatile?: { toolIds: ToolId[] };
};

export type Theme = { id: ThemeId; name: string; short: string; pitch: string };

export type MapNodeKind = "lesson" | "checkpoint" | "finale";

export type MapNode = {
  id: string;
  kind: MapNodeKind;
  /** For lesson and finale nodes. */
  lessonId?: string;
  /** Checkpoints: the title shown and the lessons whose questions come back. */
  title?: string;
  covers?: string[];
  /** Position on the board: column (left to right) and lane (0 = centre, negative = up). */
  col: number;
  lane: number;
  unit: string;
  /** Extra visual links (prerequisites inside the track are linked automatically). */
  after?: string[];
};

export type Unit = { id: string; name: string; blurb: string };

export type Track = {
  id: TrackId;
  animal: string;
  name: string;
  audience: string;
  pitch: string;
  units: Unit[];
  nodes: MapNode[];
};

export type ToolId = "chatgpt" | "claude" | "gemini" | "deepseek" | "perplexity";

export type ToolFact = {
  id: ToolId;
  name: string;
  maker: string;
  summary: string;
  goodFor: string[];
  watchOut: string[];
  /** ISO date of last human verification. */
  lastVerified: string;
  /** Re-check after this many days. */
  reviewEveryDays: number;
  sources: string[];
};
