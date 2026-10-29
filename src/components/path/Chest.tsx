/** The chapter review drawn as a small chest: shut and grey while locked, open once passed. */
export function Chest({ state, size = 40 }: { state: "locked" | "ready" | "open"; size?: number }) {
  const locked = state === "locked";
  const wood = locked ? "var(--line)" : "var(--peach)";
  const woodDeep = locked ? "var(--edge)" : "var(--peach-deep)";
  const metal = locked ? "#bdbdb6" : "var(--bird-deep)";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      {state === "open" ? (
        <>
          <path d="M8 18 12 6h24l4 12z" fill={woodDeep} />
          <path d="M14 9h20l2 7H12z" fill="var(--bird)" />
        </>
      ) : (
        <path d="M7 21c0-8 6-12 17-12s17 4 17 12z" fill={wood} />
      )}
      <rect x="7" y="20" width="34" height="20" rx="4" fill={wood} />
      <rect x="7" y="34" width="34" height="6" rx="3" fill={woodDeep} />
      <rect x="13" y="20" width="4" height="20" fill={metal} />
      <rect x="31" y="20" width="4" height="20" fill={metal} />
      <rect x="20" y="17" width="8" height="10" rx="2.5" fill={metal} />
      <circle cx="24" cy="22" r="1.8" fill={locked ? "var(--muted)" : "var(--ink)"} />
    </svg>
  );
}
