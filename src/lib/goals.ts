import type { TrackId } from "@/content/types";

/** What a learner says they want to do; it decides the suggested track. Kept apart from the question bank so client code can use it without downloading the bank. */
export type Goal = "discover" | "practice" | "build";
export const TRACK_FOR_GOAL: Record<Goal, TrackId> = { discover: "bird", practice: "gecko", build: "fox" };
export const isGoal = (v: unknown): v is Goal => v === "discover" || v === "practice" || v === "build";
