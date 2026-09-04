export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="stack" aria-hidden="true">
      <div className="skeleton skeleton--title" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton--card" />
      ))}
    </div>
  );
}
