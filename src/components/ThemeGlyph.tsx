import type { ThemeId } from "@/content/types";

/**
 * One authored symbol per theme, drawn on a 24 grid with the same 2px round stroke.
 * Each encodes the theme's idea: a chain of predicted tokens, a speech bubble with a cursor, a checked seal…
 */
const PATHS: Record<ThemeId, React.ReactNode> = {
  // three tokens in a row, the last one still being chosen
  comprendre: (
    <>
      <rect x="2.5" y="9" width="5" height="6" rx="1.5" />
      <rect x="9.5" y="9" width="5" height="6" rx="1.5" />
      <rect x="16.5" y="9" width="5" height="6" rx="1.5" strokeDasharray="2 2.2" />
      <path d="M5 5.5v0M12 5.5v0" />
    </>
  ),
  // a speech bubble holding a text cursor
  prompt: (
    <>
      <path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 16.5h-8l-4.5 3.5v-3.5H4A1.5 1.5 0 0 1 2.5 15V7A1.5 1.5 0 0 1 4 5.5z" />
      <path d="M8 9l2.5 2L8 13M13 13h3.5" />
    </>
  ),
  // a shield with a check
  confiance: (
    <>
      <path d="M12 2.8l7.5 2.7v5.6c0 4.6-3 8.3-7.5 10.1-4.5-1.800-7.5-5.5-7.5-10.1V5.500z" />
      <path d="M8.500 11.800l2.500 2.500 4.500-5" />
    </>
  ),
  // four different tools on a board
  outils: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <circle cx="17.200" cy="6.800" r="3.800" />
      <path d="M3.500 20.500l3.300-7 3.300 7z" />
      <rect x="13.500" y="13.500" width="7.500" height="7.500" rx="3.750" transform="rotate(45 17.250 17.250)" />
    </>
  ),
  // steps chained by arrows
  workflows: (
    <>
      <circle cx="5" cy="6" r="2.500" />
      <circle cx="19" cy="12" r="2.500" />
      <circle cx="5" cy="18" r="2.500" />
      <path d="M7.500 6H13a3 3 0 0 1 3 3v.500M16.500 14.500V15a3 3 0 0 1-3 3H7.500" />
    </>
  ),
  // a loop that acts: arrow circling a core
  agents: (
    <>
      <path d="M19.500 12a7.500 7.500 0 1 1-2.600-5.700" />
      <path d="M17.500 2.500v4h-4" />
      <circle cx="12" cy="12" r="2.200" />
    </>
  ),
  // angle brackets around a slash
  dev: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.500 5l-3 14" />,
  // a plug meeting a socket
  api: (
    <>
      <path d="M9 3v4M15 3v4M6.500 7h11v3.500a5.500 5.500 0 0 1-11 0z" />
      <path d="M12 16v2.500a2.500 2.500 0 0 0 2.500 2.500H18" />
    </>
  ),
  // stacked documents with a lens
  rag: (
    <>
      <path d="M5 4.500h8.500L17 8v4M5 4.500v14h5.500" />
      <path d="M8 9h5M8 12.500h3" />
      <circle cx="16.200" cy="16.200" r="3.200" />
      <path d="M18.600 18.600l2.400 2.400" />
    </>
  ),
  // a flag planted on a block
  projets: (
    <>
      <path d="M6 21V3.500M6 4.500h11.500l-2.800 3.800 2.800 3.700H6" />
      <path d="M3 21h9" />
    </>
  ),
};

export function ThemeGlyph({ theme, size = 24, className = "" }: { theme: ThemeId; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {PATHS[theme]}
    </svg>
  );
}
