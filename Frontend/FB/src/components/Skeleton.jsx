const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded-lg bg-surface-200/70 dark:bg-surface-200/60 ${className}`}
  />
);

export const CardSkeleton = () => (
  <div className="card space-y-4 p-4 sm:p-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-5 w-14" />
    </div>
    <Skeleton className="h-4 w-3/4" />
    <div className="flex gap-3">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-16" />
    </div>
    <div className="flex items-center justify-between border-t border-surface-100 pt-3 dark:border-surface-200/60">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  </div>
);

export const ListSkeleton = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export const StatSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-28" />
      </div>
    ))}
  </div>
);

export default Skeleton;
