import type { TrackId } from "@/content/types";

/** happy: default · cheer: a right answer, a finished lesson · oops: a miss · think: waiting for an answer */
export type Mood = "happy" | "cheer" | "oops" | "think";

/** Geometric mascots, one per track, with a few expressions. Built from exact shapes so they scale crisply. */
export function Avatar({ track, size = 56, mood = "happy", className = "" }: { track: TrackId; size?: number; mood?: Mood; className?: string }) {
  const motion = mood === "cheer" ? "mascot-hop" : mood === "oops" ? "mascot-droop" : "";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={LABEL[track]} className={`${motion} ${className}`} key={mood}>
      {track === "bird" && <Bird mood={mood} />}
      {track === "gecko" && <Gecko mood={mood} />}
      {track === "fox" && <Fox mood={mood} />}
    </svg>
  );
}

const LABEL: Record<TrackId, string> = { bird: "Bird, la mascotte Découvrir", gecko: "Gecko, la mascotte Pratiquer", fox: "Fox, la mascotte Construire" };

/** A closed, smiling eye (cheer) drawn as an arc. */
const Arc = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <path d={`M${cx - r},${cy + 1} Q${cx},${cy - r * 1.4} ${cx + r},${cy + 1}`} stroke="var(--ink)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
);

function Bird({ mood }: { mood: Mood }) {
  return (
    <>
      <path d="M30 9c3-4 8-4 9 0-3-1-5 0-6 3z" fill="var(--ink)" />
      <circle cx="31" cy="34" r="21" fill="var(--bird)" />
      <path d={mood === "cheer" ? "M12 30c-5-6-4-13 1-15 0 7 3 11 8 13z" : "M14 38c4 10 15 13 22 9-9-1-15-6-17-15z"} fill="var(--bird-deep)" />
      <path d={mood === "oops" ? "M50 33l10 6-10 3z" : "M50 30l11 5-11 5z"} fill="var(--ink)" />
      {mood === "cheer" ? (
        <Arc cx={39} cy={28} r={4} />
      ) : (
        <g className="mascot-blink">
          <circle cx="39" cy={mood === "oops" ? 30 : 28} r="4.2" fill="var(--ink)" />
          <circle cx={mood === "think" ? 41.4 : 40.4} cy={mood === "think" ? 25.8 : mood === "oops" ? 28.6 : 26.6} r="1.4" fill="#fff" />
        </g>
      )}
      {mood === "oops" && <path d="M34 22l8-2" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" />}
      <path d="M24 55v6M34 55v6" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round" />
    </>
  );
}

function Gecko({ mood }: { mood: Mood }) {
  const mouth = mood === "cheer" ? "M15 35q17 11 34 0" : mood === "oops" ? "M19 39q13-5 26 0" : mood === "think" ? "M22 37h20" : "M15 36q17 7 34 0";
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
      {mood === "cheer" ? (
        <>
          <Arc cx={11} cy={28} r={3.6} />
          <Arc cx={53} cy={28} r={3.6} />
        </>
      ) : (
        <g className="mascot-blink">
          <rect x={mood === "think" ? 12 : 10} y={mood === "oops" ? 24 : 22} width="2.4" height={mood === "oops" ? 8 : 10} rx="1.2" fill="var(--ink)" />
          <rect x={mood === "think" ? 53.6 : 51.6} y={mood === "oops" ? 24 : 22} width="2.4" height={mood === "oops" ? 8 : 10} rx="1.2" fill="var(--ink)" />
        </g>
      )}
      <circle cx="29" cy="27" r="1.1" fill="var(--ink)" />
      <circle cx="35" cy="27" r="1.1" fill="var(--ink)" />
      <path d={mouth} stroke="var(--ink)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </>
  );
}

function Fox({ mood }: { mood: Mood }) {
  return (
    <>
      <path d={mood === "oops" ? "M6 10l20 11-15 9z" : "M8 6l18 15-15 9z"} fill="var(--fox)" />
      <path d={mood === "oops" ? "M58 10L38 21l15 9z" : "M56 6L38 21l15 9z"} fill="var(--fox)" />
      <path d="M11 13l9 7-7 5z" fill="var(--ink)" />
      <path d="M53 13l-9 7 7 5z" fill="var(--ink)" />
      <path d="M6 27Q32 10 58 27L32 59z" fill="var(--fox)" />
      <path d="M6 27l26 32-8-22z" fill="#fff" />
      <path d="M58 27L32 59l8-22z" fill="#fff" />
      {mood === "cheer" ? (
        <>
          <Arc cx={23} cy={32} r={3.4} />
          <Arc cx={41} cy={32} r={3.4} />
        </>
      ) : mood === "think" ? (
        <g className="mascot-blink">
          <circle cx="23" cy="31" r="3" fill="var(--ink)" />
          <path d="M38 31h6" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round" />
        </g>
      ) : (
        <g className="mascot-blink">
          <circle cx="23" cy={mood === "oops" ? 32 : 31} r="3" fill="var(--ink)" />
          <circle cx="41" cy={mood === "oops" ? 32 : 31} r="3" fill="var(--ink)" />
        </g>
      )}
      {mood === "oops" && <path d="M18 25l8 2M46 25l-8 2" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />}
      <path d="M28.5 52h7L32 58z" fill="var(--ink)" />
    </>
  );
}

/** The mascot with a speech bubble, for quiz feedback and empty states. */
export function MascotSays({ track, mood = "happy", line, size = 52 }: { track: TrackId; mood?: Mood; line: string; size?: number }) {
  return (
    <div className="flex items-end gap-3">
      <Avatar track={track} mood={mood} size={size} />
      <p className="bubble pop-in mb-2" key={line} aria-live="polite">{line}</p>
    </div>
  );
}
