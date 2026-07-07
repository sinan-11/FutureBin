const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />
);

export const CardSkeleton = () => (
  <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm space-y-3">
    <div className="flex items-center gap-2">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-5 w-16" />
    </div>
    <Skeleton className="h-4 w-3/4" />
    <div className="flex gap-3">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-16" />
    </div>
    <Skeleton className="h-3 w-1/3" />
  </div>
);

export const ListSkeleton = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export default Skeleton;
