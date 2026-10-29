/**
 * L'atelier du prompt: a mission gives a need, the learner picks a few cards to build the request,
 * sees the likely answer change, then sends it and gets 1 to 3 stars.
 */
export type CardKind = "role" | "contexte" | "tache" | "format" | "limite";

export type AtelierCard = {
  id: string;
  kind: CardKind;
  text: string;
  /** key: needed for 3 stars · plus: a bonus · neutral: harmless · trap: costs a star */
  effect: "key" | "plus" | "neutral" | "trap";
  /** What the card brings to the likely answer. In parentheses: a note about the answer, shown apart. */
  adds: string;
  /** Shown after sending, for missing keys, traps and other picks. */
  why: string;
  /** Cards of the same group exclude each other (two ways to phrase the task). */
  group?: string;
};

export type Mission = { id: string; title: string; brief: string; cards: AtelierCard[] };

export const KIND_LABEL: Record<CardKind, string> = {
  role: "Rôle",
  contexte: "Contexte",
  tache: "Tâche",
  format: "Format",
  limite: "Consigne",
};

/** Room for every key card, plus one: choosing what to leave out is the game. */
export const maxCards = (m: Mission) => m.cards.filter((c) => c.effect === "key").length + 1;

/** Picks or drops a card. A card of a group replaces the other card of that group; a full hand ignores new cards. */
export function toggleCard(m: Mission, picked: string[], id: string): string[] {
  if (picked.includes(id)) return picked.filter((p) => p !== id);
  const card = m.cards.find((c) => c.id === id);
  if (!card) return picked;
  const kept = card.group ? picked.filter((p) => m.cards.find((c) => c.id === p)?.group !== card.group) : picked;
  if (kept.length >= maxCards(m)) return picked;
  return [...kept, id];
}

/** A request can be sent once it says what to do. */
export const canSend = (m: Mission, picked: string[]) => picked.some((id) => m.cards.find((c) => c.id === id)?.kind === "tache");

/** The likely answer: the task first, then what the other cards add, in the order they were picked. */
export function likelyAnswer(m: Mission, picked: string[]): { lines: string[]; notes: string[] } {
  const cards = picked.map((id) => m.cards.find((c) => c.id === id)).filter((c): c is AtelierCard => !!c);
  const ordered = [...cards.filter((c) => c.kind === "tache"), ...cards.filter((c) => c.kind !== "tache")];
  const parts = ordered.map((c) => c.adds).filter(Boolean);
  return { lines: parts.filter((p) => !p.startsWith("(")), notes: parts.filter((p) => p.startsWith("(")).map((p) => p.slice(1, -1)) };
}

export type MissionResult = { stars: 1 | 2 | 3; missing: AtelierCard[]; traps: AtelierCard[]; others: AtelierCard[] };

/** Three stars with every key card and no trap; one missing key costs a star, a trap costs a star. */
export function gradeMission(m: Mission, picked: string[]): MissionResult {
  const chosen = new Set(picked);
  const missing = m.cards.filter((c) => c.effect === "key" && !chosen.has(c.id));
  const traps = m.cards.filter((c) => c.effect === "trap" && chosen.has(c.id));
  const others = m.cards.filter((c) => (c.effect === "plus" || c.effect === "neutral") && chosen.has(c.id));
  const base = missing.length === 0 ? 3 : missing.length === 1 ? 2 : 1;
  const stars = Math.max(1, base - (traps.length ? 1 : 0)) as 1 | 2 | 3;
  return { stars, missing, traps, others };
}

/** The same order on the server and in the browser: a shuffle seeded by the mission id. */
export function dealCards(m: Mission): AtelierCard[] {
  let seed = [...m.id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const cards = [...m.cards];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
