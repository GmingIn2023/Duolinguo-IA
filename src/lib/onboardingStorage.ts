import type { Answer, TrackId } from "@/content/types";
import type { Goal } from "./placement";

/** What the level test hands over to /signup: read back by SignupForm, re-graded on the server. */
export const ONBOARDING_KEY = "gusgus.onboarding";
export type PlacementAnswer = { id: string; answer: Answer | null };
export type OnboardingPayload = { placement: PlacementAnswer[]; goal: Goal | null; track: TrackId };

/** Stores the payload for the signup page. Returns false when storage is unavailable (private window, blocked data). */
export function saveOnboarding(payload: OnboardingPayload, storage?: Pick<Storage, "setItem">): boolean {
  try {
    (storage ?? sessionStorage).setItem(ONBOARDING_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}
