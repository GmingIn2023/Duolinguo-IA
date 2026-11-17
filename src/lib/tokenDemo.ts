/** Next-word candidates for one sentence. The percentages are illustrative, not measured: the page says so. */
export const TOKEN_START = "Pour réussir une mayonnaise, commence par";
export const TOKEN_CANDIDATES = [
  { word: "sortir", p: 40, tail: "tous les ingrédients du frigo pour qu'ils soient à la même température." },
  { word: "séparer", p: 22, tail: "le jaune d'œuf du blanc, puis ajoute la moutarde." },
  { word: "mettre", p: 18, tail: "le jaune d'œuf et la moutarde dans un bol." },
  { word: "choisir", p: 12, tail: "un bol assez profond et une huile neutre." },
  { word: "bien", p: 8, tail: "sortir les ingrédients du frigo, à température ambiante." },
];

/** Weighted draw among the candidates; `r` is a number in [0, 100). */
export function pickCandidate(r: number): number {
  let acc = 0;
  for (let i = 0; i < TOKEN_CANDIDATES.length; i++) {
    acc += TOKEN_CANDIDATES[i].p;
    if (r < acc) return i;
  }
  return TOKEN_CANDIDATES.length - 1;
}

/** Weighted draw among all candidates except `excluded`, so "Relancer" never repeats the current word. */
export function pickCandidateExcept(r: number, excluded: number): number {
  const choices = TOKEN_CANDIDATES.map((candidate, index) => ({ candidate, index })).filter(({ index }) => index !== excluded);
  const total = choices.reduce((sum, { candidate }) => sum + candidate.p, 0);
  const target = (Math.min(Math.max(r, 0), 100) / 100) * total;
  let acc = 0;
  for (const { candidate, index } of choices) {
    acc += candidate.p;
    if (target < acc) return index;
  }
  return choices[choices.length - 1]?.index ?? 0;
}
