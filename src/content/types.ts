export type TrackId = "bird" | "gecko" | "fox";
export type Level = 1 | 2 | 3;

export type Option = { id: string; text: string; feedback?: string };
export type Item = { id: string; text: string };

type QuestionBase = { id: string; explanation: string };

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

export type Block =
  | { type: "text"; title?: string; body: string }
  | { type: "illustration"; id: IllustrationId; caption: string }
  | { type: "example"; label: string; good?: boolean; content: string }
  | { type: "keypoint"; body: string }
  | { type: "tools"; toolIds: ToolId[] };

export type Lesson = {
  id: string;
  title: string;
  objective: string;
  level: Level;
  durationMin: number;
  xp: number;
  skills: string[];
  /** Lesson ids that must be completed first (within the learner's track). */
  prerequisites: string[];
  blocks: Block[];
  questions: Question[];
  /** Set when the lesson relies on facts that age (tool features, pricing...). */
  volatile?: { toolIds: ToolId[] };
};

export type Track = {
  id: TrackId;
  animal: string;
  name: string;
  audience: string;
  pitch: string;
  lessonIds: string[];
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
