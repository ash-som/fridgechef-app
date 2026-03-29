export default function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4 p-4" id="loading-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-surface-200 p-4 space-y-3">
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton h-4 w-full" />
          <div className="flex gap-2">
            <div className="skeleton h-5 w-16" />
            <div className="skeleton h-5 w-14" />
          </div>
          <div className="skeleton h-1.5 w-full" />
        </div>
      ))}
    </div>
  );
}
