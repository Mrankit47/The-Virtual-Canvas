'use client';

import { OrderCardSkeleton, StatsCardSkeleton } from '@/components/dashboard/DashboardSkeleton';

export default function Loading() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div className="h-10 w-48 bg-ink/5 rounded-xl animate-pulse" />
        <div className="h-4 w-32 bg-ink/5 rounded-xl animate-pulse" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      <div className="space-y-4">
        <div className="h-6 w-32 bg-ink/5 rounded-lg animate-pulse mb-6" />
        <OrderCardSkeleton />
        <OrderCardSkeleton />
        <OrderCardSkeleton />
      </div>
    </div>
  );
}
