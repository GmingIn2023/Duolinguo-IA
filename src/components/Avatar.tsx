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
  return (
    <>
      <ellipse cx="32" cy="39" rx="25" ry="18" fill="var(--gecko)" />
      <circle cx="18" cy="23" r="10" fill="var(--gecko)" />
      <circle cx="46" cy="23" r="10" fill="var(--gecko)" />
      <circle cx="18" cy="23" r="6.4" fill="#fff" />
      <circle cx="46" cy="23" r="6.4" fill="#fff" />
      <rect x="16.4" y="18.5" width="3.2" height="9" rx="1.6" fill="var(--ink)" />
      <rect x="44.4" y="18.5" width="3.2" height="9" rx="1.6" fill="var(--ink)" />
      <path d="M21 44q11 7 22 0" stroke="var(--ink)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <circle cx="13" cy="41" r="2.6" fill="var(--gecko-deep)" />
      <circle cx="51" cy="41" r="2.6" fill="var(--gecko-deep)" />
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
