/** XP earned today against the daily goal, as a ring around a bolt. Full ring: goal reached. */
export function GoalRing({ value, goal, size = 40 }: { value: number; goal: number; size?: number }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const share = Math.min(1, goal ? value / goal : 0);
  const done = share >= 1;
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }} title={`Objectif du jour : ${Math.min(value, goal)} sur ${goal} XP`}>
      <svg viewBox="0 0 36 36" width={size} height={size} aria-hidden>
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--sunk)" strokeWidth="4" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={done ? "var(--good)" : "var(--bird)"} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - share)} transform="rotate(-90 18 18)" style={{ transition: "stroke-dashoffset 700ms var(--ease-out)" }} />
        <path d="M19.5 10.5 13.5 19h4l-1 6.5 6-8.5h-4z" fill={done ? "var(--good)" : "var(--ink)"} />
      </svg>
      <span className="sr-only">Objectif du jour : {Math.min(value, goal)} sur {goal} XP</span>
    </span>
  );
}
