import type { TrackId } from "@/content/types";

/** Geometric mascots, one per track. Built from exact shapes so they scale crisply. */
export function Avatar({ track, size = 56, className = "" }: { track: TrackId; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={LABEL[track]} className={className}>
      {track === "bird" && <Bird />}
      {track === "gecko" && <Gecko />}
      {track === "fox" && <Fox />}
    </svg>
  );
}

const LABEL: Record<TrackId, string> = { bird: "Bird, la mascotte débutant", gecko: "Gecko, la mascotte étudiant", fox: "Fox, la mascotte travail" };

function Bird() {
  return (
    <>
      <path d="M30 9c3-4 8-4 9 0-3-1-5 0-6 3z" fill="var(--ink)" />
      <circle cx="31" cy="34" r="21" fill="var(--bird)" />
      <path d="M14 38c4 10 15 13 22 9-9-1-15-6-17-15z" fill="var(--bird-deep)" />
      <path d="M50 30l11 5-11 5z" fill="var(--ink)" />
      <circle cx="39" cy="28" r="4.2" fill="var(--ink)" />
      <circle cx="40.4" cy="26.6" r="1.4" fill="#fff" />
      <path d="M24 55v6M34 55v6" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round" />
    </>
  );
}

function Gecko() {
  // gecko traits: flat wide head, side eyes with vertical slit pupils, spots, toe pads, curled tail
  return (
    <>
      <path d="M44 46q16 2 14 13-2 5-8 2" stroke="var(--gecko-deep)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <g fill="var(--gecko)">
        <path d="M17 44l-6 9M19 46l0 11M21 44l6 9M43 44l-6 9M45 46l0 11M47 44l6 9" stroke="var(--gecko)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="11" cy="53.5" r="2.6" /><circle cx="19" cy="57.5" r="2.6" /><circle cx="27" cy="53.5" r="2.6" />
        <circle cx="37" cy="53.5" r="2.6" /><circle cx="45" cy="57.5" r="2.6" /><circle cx="53" cy="53.5" r="2.6" />
        <ellipse cx="32" cy="31" rx="26" ry="16" />
      </g>
      <circle cx="24" cy="21" r="2.2" fill="var(--gecko-deep)" />
      <circle cx="32" cy="18" r="2.2" fill="var(--gecko-deep)" />
      <circle cx="40" cy="21" r="2.2" fill="var(--gecko-deep)" />
      <circle cx="11" cy="27" r="6.6" fill="#fff" />
      <circle cx="53" cy="27" r="6.6" fill="#fff" />
      <rect x="10" y="22" width="2.4" height="10" rx="1.2" fill="var(--ink)" />
      <rect x="51.6" y="22" width="2.4" height="10" rx="1.2" fill="var(--ink)" />
      <circle cx="29" cy="27" r="1.1" fill="var(--ink)" />
      <circle cx="35" cy="27" r="1.1" fill="var(--ink)" />
      <path d="M15 36q17 7 34 0" stroke="var(--ink)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </>
  );
}

function Fox() {
  return (
    <>
      <path d="M8 6l18 15-15 9z" fill="var(--fox)" />
      <path d="M56 6L38 21l15 9z" fill="var(--fox)" />
      <path d="M11 13l9 7-7 5z" fill="var(--ink)" />
      <path d="M53 13l-9 7 7 5z" fill="var(--ink)" />
      <path d="M6 27Q32 10 58 27L32 59z" fill="var(--fox)" />
      <path d="M6 27l26 32-8-22z" fill="#fff" />
      <path d="M58 27L32 59l8-22z" fill="#fff" />
      <circle cx="23" cy="31" r="3" fill="var(--ink)" />
      <circle cx="41" cy="31" r="3" fill="var(--ink)" />
      <path d="M28.5 52h7L32 58z" fill="var(--ink)" />
    </>
  );
}
