export function SkeletonCard() {
  return (
    <div className="glass-strong rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-16 rounded-md bg-muted" />
        <div className="h-4 w-24 rounded-md bg-muted" />
      </div>
      <div className="h-6 w-3/4 rounded-md bg-muted mb-2" />
      <div className="h-4 w-full rounded-md bg-muted mb-1" />
      <div className="h-4 w-2/3 rounded-md bg-muted" />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="glass-strong rounded-2xl p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-20 rounded-md bg-muted" />
        <div className="h-8 w-8 rounded-lg bg-muted" />
      </div>
      <div className="h-8 w-16 rounded-md bg-muted" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="p-3">
          <div className="h-4 rounded bg-muted animate-pulse" style={{ width: `${40 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
