'use client';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-ink/5 rounded-xl ${className}`} />
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-ink/5 shadow-sm">
      <Skeleton className="w-10 h-10 mb-4" />
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-ink/5 p-5">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex gap-4 items-center">
          <Skeleton className="w-14 h-14" />
          <div>
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="w-full md:w-64 space-y-3">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-1.5 w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
