const NNBSP = " "; // narrow no-break space
const NBSP = " ";

/** French typography: punctuation never wraps away from its word. */
export function frenchSpacing(text: string): string {
  return text
    .replace(/ ([?!;»])/g, `${NNBSP}$1`)
    .replace(/ :/g, `${NBSP}:`)
    .replace(/« /g, `«${NBSP}`)
    .replace(/(\p{L})-(ce|elle|elles|il|ils|tu|moi|toi|le|la|les|nous|vous|on)\b/gu, "$1\u2011$2");
}

const SKIP = new Set(["id", "answer", "prerequisites", "lessonIds", "toolIds", "type", "sources", "lastVerified"]);

/** Applies frenchSpacing to every human-readable string of a content tree. */
export function typesetContent<T>(value: T, key = ""): T {
  if (SKIP.has(key)) return value;
  if (typeof value === "string") return frenchSpacing(value) as T;
  if (Array.isArray(value)) return value.map((v) => typesetContent(v)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, typesetContent(v, k)])) as T;
  }
  return value;
}
