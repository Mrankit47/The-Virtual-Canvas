'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import StatsCard from '@/components/dashboard/StatsCard';
import OrderCard from '@/components/dashboard/OrderCard';
import { useOrderStore } from '@/store/useOrderStore';
import { 
  ClipboardList, 
  Activity, 
  CheckCircle2, 
  PlusCircle
} from 'lucide-react';
import { StatsCardSkeleton, OrderCardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import Link from 'next/link';

export default function ArtistDashboard() {
  const { data: session } = useSession();
  const { orders, isLoading, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const stats = [
    { title: 'Total Assigned', value: orders.length, icon: <ClipboardList size={20} className="text-indigo-500" />, color: 'bg-indigo-500' },
    { title: 'Active Tasks', value: orders.filter((o: any) => o.orderStatus === 'progress' || o.orderStatus === 'assigned').length, icon: <Activity size={20} className="text-blue-500" />, color: 'bg-blue-500' },
    { title: 'Jobs Completed', value: orders.filter((o: any) => o.orderStatus === 'completed').length, icon: <CheckCircle2 size={20} className="text-green-500" />, color: 'bg-green-500' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row justify-between gap-6 animate-pulse">
          <div className="h-10 w-64 bg-ink/5 rounded-xl" />
          <div className="h-10 w-48 bg-ink/5 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
        <div className="space-y-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-playfair text-ink leading-tight">Artist Studio, {session?.user?.name || 'Creator'}</h1>
          <p className="text-sm text-ink/40 mt-1 uppercase tracking-widest font-medium">Fulfill your assigned artwork commissions</p>
        </div>
        <Link 
          href="/artist/upload" 
          className="flex items-center justify-center gap-2 px-6 py-3 border border-ink text-ink rounded-2xl text-sm font-bold hover:bg-ink hover:text-white transition-all shadow-xl shadow-ink/5"
        >
          <PlusCircle size={18} />
          Upload New Work
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Jobs Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-playfair text-ink underline decoration-ink/10 underline-offset-8 decoration-4">Assigned Tasks</h2>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-ink/10 p-20 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
              <ClipboardList className="text-ink/20" size={32} />
            </div>
            <h3 className="text-lg font-bold text-ink">No assignments yet</h3>
            <p className="text-sm text-ink/40 max-w-xs mt-2">
              Wait for the administrator to assign a new project to your studio queue.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order: any) => (
              <OrderCard key={order._id} order={order} role="artist" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
