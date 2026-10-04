export default function Loading() {
  return (
    <div className="grid max-w-5xl gap-6" aria-busy="true" aria-label="Chargement">
      <div className="skeleton h-14 w-2/3 max-w-md" />
      <div className="skeleton h-5 w-1/3 max-w-xs" />
      <div className="grid gap-4 pt-6">
        {[0, 1, 2].map((i) => <div key={i} className="skeleton h-28 max-w-xl" style={{ marginLeft: `${i * 2}rem` }} />)}
      </div>
    </div>
  );
}
