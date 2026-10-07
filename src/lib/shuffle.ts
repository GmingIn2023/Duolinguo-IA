/** Deterministic shuffle so server and client render the same order. */
function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: T[], seed: string): T[] {
  const rand = seededRandom(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Shuffle a sequence, guaranteeing the result differs from the original order (when possible). */
export function shuffleAway<T>(items: T[], seed: string): T[] {
  const out = seededShuffle(items, seed);
  const same = out.every((v, i) => v === items[i]);
  return same && items.length > 1 ? [...out.slice(1), out[0]] : out;
}
