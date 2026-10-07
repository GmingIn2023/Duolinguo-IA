export default function Loading() {
  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 pt-24" aria-busy="true" aria-label="Chargement du cours">
      <div className="skeleton h-16 w-3/4" />
      <div className="skeleton h-6 w-1/2" />
      <div className="grid grid-cols-3 gap-3 pt-4">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20" />)}</div>
    </div>
  );
}
