'use client';

import { StatsCardSkeleton } from '@/components/dashboard/DashboardSkeleton';

export default function Loading() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div className="h-10 w-64 bg-ink/5 rounded-xl animate-pulse" />
        <div className="h-4 w-32 bg-ink/5 rounded-xl animate-pulse" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-ink/5 overflow-hidden">
        <div className="p-6 border-b border-ink/5 flex justify-between items-center">
          <div className="h-6 w-32 bg-ink/5 rounded-lg animate-pulse" />
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="h-10 w-full bg-ink/5 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
