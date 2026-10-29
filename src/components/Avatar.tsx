import type { TrackId } from "@/content/types";

/**
 * happy: default · cheer: a right answer, a finished lesson · oops: a miss · think: waiting for an answer ·
 * sleep: eyes closed, for quiet moments · wow: surprise, a new record
 */
export type Mood = "happy" | "cheer" | "oops" | "think" | "sleep" | "wow";

/**
 * The three mascots, drawn from flat shapes on a 100×100 grid: round bodies, big eyes with a highlight,
 * one deeper tone for volume. `animate` adds a slow breath at rest; cheer and oops play their own short
 * moves once (a hop with flapping wings, a head shake). Motion stops under reduced motion and in calm mode.
 */
export function Avatar({
  track,
  size = 56,
  mood = "happy",
  animate = false,
  decorative = false,
  className = "",
}: {
  track: TrackId;
  size?: number;
  mood?: Mood;
  animate?: boolean;
  decorative?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : LABEL[track]}
      className={`m m-${mood}${animate ? " m-alive" : ""} ${className}`}
      key={mood}
      overflow="visible"
    >
      <g className="m-body">
        {track === "bird" && <Bird mood={mood} />}
        {track === "gecko" && <Gecko mood={mood} />}
        {track === "fox" && <Fox mood={mood} />}
      </g>
      {mood === "cheer" && <Sparkles />}
      {mood === "sleep" && <Zzz />}
      {mood === "oops" && <path className="m-drop" d="M86 30c3 5 4 8 4 10a4 4 0 0 1-8 0c0-2 1-5 4-10z" fill="var(--sky)" />}
    </svg>
  );
}

const LABEL: Record<TrackId, string> = { bird: "Bird, la mascotte Découvrir", gecko: "Gecko, la mascotte Pratiquer", fox: "Fox, la mascotte Construire" };
const INK = "var(--ink)";
const WHITE = "#fff";

const STAR = "M0-7 1.8-1.8 7 0 1.8 1.8 0 7-1.8 1.8-7 0-1.8-1.8z";
function Sparkles() {
  return (
    <g className="m-sparkles" fill="var(--bird)" stroke={INK} strokeWidth="1.4" strokeLinejoin="round">
      <path d={STAR} transform="translate(10 22)" />
      <path d={STAR} transform="translate(92 18) scale(.8)" />
      <path d={STAR} transform="translate(94 56) scale(.6)" />
    </g>
  );
}

function Zzz() {
  return (
    <g className="m-zzz" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M76 14h8l-8 9h8" />
      <path d="M88 2h5l-5 6h5" strokeWidth="2" />
    </g>
  );
}

/** Two eyes: white, a pupil looking where the mood says, a highlight. Cheer and sleep close them. */
function Eyes({ l, r, radius, pupil, mood, oval = false }: { l: [number, number]; r: [number, number]; radius: number; pupil: number; mood: Mood; oval?: boolean }) {
  if (mood === "cheer") {
    return (
      <g fill="none" stroke={INK} strokeWidth="3.6" strokeLinecap="round">
        {[l, r].map(([x, y]) => <path key={x} d={`M${x - radius * 0.7} ${y + 2}q${radius * 0.7} -${radius * 1.1} ${radius * 1.4} 0`} />)}
      </g>
    );
  }
  if (mood === "sleep") {
    return (
      <g fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round">
        {[l, r].map(([x, y]) => <path key={x} d={`M${x - radius * 0.65} ${y}q${radius * 0.65} ${radius * 0.6} ${radius * 1.3} 0`} />)}
      </g>
    );
  }
  const dx = mood === "think" ? 2.6 : 1.2;
  const dy = mood === "think" ? -3 : mood === "oops" ? 3 : 0.6;
  const p = mood === "wow" ? pupil * 0.62 : pupil;
  return (
    <g className="m-look">
      {[l, r].map(([x, y]) => <circle key={`w${x}`} cx={x} cy={y} r={radius} fill={WHITE} />)}
      <g className="m-blink">
        {[l, r].map(([x, y]) =>
          oval ? (
            <ellipse key={`p${x}`} cx={x + dx} cy={y + dy} rx={p * 0.68} ry={p} fill={INK} />
          ) : (
            <circle key={`p${x}`} cx={x + dx} cy={y + dy} r={p} fill={INK} />
          ),
        )}
        {[l, r].map(([x, y]) => <circle key={`h${x}`} cx={x + dx + p * 0.38} cy={y + dy - p * 0.42} r={p * 0.34} fill={WHITE} />)}
      </g>
    </g>
  );
}

/** Worried or puzzled brows, only for the moods that need them. */
function Brows({ l, r, mood }: { l: [number, number]; r: [number, number]; mood: Mood }) {
  if (mood === "oops") {
    return (
      <g stroke={INK} strokeWidth="3" strokeLinecap="round">
        <path d={`M${l[0] - 7} ${l[1] + 2}l12 -5`} />
        <path d={`M${r[0] + 7} ${r[1] + 2}l-12 -5`} />
      </g>
    );
  }
  if (mood === "think") return <path d={`M${r[0] - 6} ${r[1] + 1}q6-5 12-1`} stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />;
  return null;
}

function Bird({ mood }: { mood: Mood }) {
  const open = mood === "cheer" || mood === "wow";
  return (
    <>
      <path d="M22 70C8 70 4 58 7 48c5 9 12 12 21 12z" fill="var(--bird-deep)" />
      <ellipse cx="40" cy="93" rx="7.5" ry="3.6" fill="var(--fox)" />
      <ellipse cx="60" cy="93" rx="7.5" ry="3.6" fill="var(--fox)" />
      <path d="M46 26c-4-8-1-15 6-17-2 6 0 11 3 15z" fill="var(--bird-deep)" />
      <path d="M53 25c1-7 7-11 14-9-5 2-8 6-8 11z" fill="var(--bird-deep)" />
      <ellipse cx="50" cy="59" rx="34" ry="33" fill="var(--bird)" />
      <path d="M17 64c6 18 19 27 33 27s27-9 33-27c-3 22-17 31-33 31S20 86 17 64z" fill="var(--bird-deep)" opacity=".45" />
      <ellipse cx="50" cy="72" rx="19" ry="15.5" fill="var(--bird-soft)" />
      <path className="m-wing m-wing-l" d="M19 56c-9 7-10 17-5 24 7-4 11-12 11-21z" fill="var(--bird-deep)" />
      <path className="m-wing m-wing-r" d="M81 56c9 7 10 17 5 24-7-4-11-12-11-21z" fill="var(--bird-deep)" />
      <Eyes l={[38, 47]} r={[62, 47]} radius={11.5} pupil={6.4} mood={mood} />
      <Brows l={[38, 34]} r={[62, 34]} mood={mood} />
      {open ? (
        <>
          <path d="M42 58c4-3 12-3 16 0l-8 4z" fill="var(--fox)" />
          <path d="M44 62h12c-1 7-4 10-6 10s-5-3-6-10z" fill="var(--fox-deep)" />
        </>
      ) : (
        <path d={mood === "oops" ? "M44 62c4-2 8-2 12 0-2 5-4 7-6 7s-4-2-6-7z" : "M43 59c4-3 10-3 14 0-2 6-4 9-7 9s-5-3-7-9z"} fill="var(--fox)" />
      )}
    </>
  );
}

function Gecko({ mood }: { mood: Mood }) {
  const mouth =
    mood === "cheer" || mood === "wow" ? null : mood === "oops" ? "M38 66q12-7 24 0" : mood === "think" ? "M42 64h16" : mood === "sleep" ? "M38 62q12 6 24 0" : "M30 60q20 14 40 0";
  return (
    <>
      <path d="M68 86c15 5 27-1 26-13-1-8-10-10-13-4-2 4 2 8 6 5" stroke="var(--gecko-deep)" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M76 88l2-5M84 86l0-6M90 80l-4-3" stroke="var(--gecko)" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="34" cy="93" rx="8" ry="3.6" fill="var(--gecko-deep)" />
      <ellipse cx="66" cy="93" rx="8" ry="3.6" fill="var(--gecko-deep)" />
      <ellipse cx="50" cy="79" rx="22" ry="15" fill="var(--gecko)" />
      <ellipse cx="50" cy="82" rx="13" ry="9" fill="var(--gecko-soft)" />
      <g className="m-wing m-wing-l">
        <path d="M30 74c-6 3-9 8-9 13" stroke="var(--gecko)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle cx="17" cy="88" r="2.6" fill="var(--gecko-deep)" />
        <circle cx="21" cy="91" r="2.6" fill="var(--gecko-deep)" />
        <circle cx="25" cy="89" r="2.6" fill="var(--gecko-deep)" />
      </g>
      <g className="m-wing m-wing-r">
        <path d="M70 74c6 3 9 8 9 13" stroke="var(--gecko)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle cx="83" cy="88" r="2.6" fill="var(--gecko-deep)" />
        <circle cx="79" cy="91" r="2.6" fill="var(--gecko-deep)" />
        <circle cx="75" cy="89" r="2.6" fill="var(--gecko-deep)" />
      </g>
      <path d="M12 48c0-17 17-28 38-28s38 11 38 28-17 28-38 28-38-11-38-28z" fill="var(--gecko)" />
      <path d="M13 54c5 13 20 21 37 21s32-8 37-21c-2 17-18 26-37 26S15 71 13 54z" fill="var(--gecko-deep)" opacity=".4" />
      <circle cx="50" cy="27" r="3" fill="var(--gecko-deep)" />
      <circle cx="42" cy="30" r="2" fill="var(--gecko-deep)" />
      <circle cx="58" cy="30" r="2" fill="var(--gecko-deep)" />
      <circle cx="26" cy="45" r="15" fill="var(--gecko-deep)" opacity=".35" />
      <circle cx="74" cy="45" r="15" fill="var(--gecko-deep)" opacity=".35" />
      <ellipse cx="22" cy="62" rx="4.6" ry="2.6" fill="var(--rose)" opacity=".8" />
      <ellipse cx="78" cy="62" rx="4.6" ry="2.6" fill="var(--rose)" opacity=".8" />
      <Eyes l={[27, 44]} r={[73, 44]} radius={12} pupil={7.2} mood={mood} oval />
      <Brows l={[27, 29]} r={[73, 29]} mood={mood} />
      <circle cx="46.5" cy="44" r="1.5" fill={INK} />
      <circle cx="53.5" cy="44" r="1.5" fill={INK} />
      {mouth && <path d={mouth} stroke={INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />}
      {mood === "cheer" && (
        <>
          <path d="M32 58q18 4 36 0q-4 14-18 14T32 58z" fill={INK} />
          <path d="M43 66q7-4 14 0q-3 5-7 5t-7-5z" fill="var(--rose)" />
        </>
      )}
      {mood === "wow" && <ellipse cx="50" cy="63" rx="4.6" ry="5.6" fill={INK} />}
    </>
  );
}

function Fox({ mood }: { mood: Mood }) {
  const droop = mood === "oops";
  return (
    <>
      <path d="M70 89c22-2 28-17 22-33-4 11-13 17-24 19z" fill="var(--fox)" />
      <path d="M92 56c4 6 3 13-2 17-3-5-3-11 2-17z" fill={WHITE} />
      <ellipse cx="41" cy="95" rx="6.5" ry="3" fill="var(--fox-deep)" />
      <ellipse cx="59" cy="95" rx="6.5" ry="3" fill="var(--fox-deep)" />
      <ellipse cx="50" cy="83" rx="20" ry="13" fill="var(--fox)" />
      <ellipse cx="50" cy="85" rx="11" ry="9" fill={WHITE} />
      <g className="m-ear m-ear-l">
        <path d={droop ? "M18 42 10 14l31 14z" : "M19 40 21 6l23 21z"} fill="var(--fox)" />
        <path d={droop ? "M22 36 18 21l14 8z" : "M24 32l1-17 12 11z"} fill={INK} opacity=".8" />
      </g>
      <g className="m-ear m-ear-r">
        <path d={droop ? "M82 42l8-28-31 14z" : "M81 40 79 6 56 27z"} fill="var(--fox)" />
        <path d={droop ? "M78 36l4-15-14 8z" : "M76 32l-1-17-12 11z"} fill={INK} opacity=".8" />
      </g>
      <path d="M12 47c0-17 16-26 38-26s38 9 38 26c0 18-17 29-38 29S12 65 12 47z" fill="var(--fox)" />
      <path d="M12 47c0 14 11 25 27 28-14-6-22-16-22-28z" fill="var(--fox-deep)" opacity=".35" />
      <path d="M20 55c10-4 22-1 30 8 8-9 20-12 30-8-4 13-15 21-30 21S24 68 20 55z" fill={WHITE} />
      <Eyes l={[36, 44]} r={[64, 44]} radius={9.5} pupil={5.6} mood={mood} />
      <Brows l={[36, 32]} r={[64, 32]} mood={mood} />
      <path d="M45 60c3-3 7-3 10 0-1 4-3 6-5 6s-4-2-5-6z" fill={INK} />
      {mood === "cheer" ? (
        <>
          <path d="M42 68h16c-1 7-4 10-8 10s-7-3-8-10z" fill={INK} />
          <path d="M45 74q5-3 10 0-2 4-5 4t-5-4z" fill="var(--rose)" />
        </>
      ) : mood === "wow" ? (
        <ellipse cx="50" cy="71" rx="3.6" ry="4.4" fill={INK} />
      ) : (
        <path d={mood === "oops" ? "M43 72q7-5 14 0" : "M50 66q-3 5-8 4M50 66q3 5 8 4"} stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )}
    </>
  );
}

/** The mascot with a speech bubble, for quiz feedback and empty states. */
export function MascotSays({ track, mood = "happy", line, size = 52, animate = true }: { track: TrackId; mood?: Mood; line: string; size?: number; animate?: boolean }) {
  return (
    <div className="flex items-end gap-3">
      <Avatar track={track} mood={mood} size={size} animate={animate} />
      <p className="bubble pop-in mb-2" key={line} aria-live="polite">{line}</p>
    </div>
  );
}
