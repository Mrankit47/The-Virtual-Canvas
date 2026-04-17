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
import { urlFor } from '@/lib/sanity';


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
    <div className="space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 bg-white p-6 sm:p-8 rounded-[32px] border border-ink/5 shadow-sm">
        <div className="flex items-center gap-5 sm:gap-6 min-w-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-ink/5 border border-ink/10 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
            {session?.user?.image ? (
              <img 
                src={typeof session.user.image === 'string' ? session.user.image : urlFor(session.user.image).url()} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="text-ink/10"><PlusCircle size={28} /></div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-ink leading-tight tracking-tight">Artist Studio, {session?.user?.name?.split(' ')[0] || 'Creator'}</h1>
            <p className="text-[10px] sm:text-xs text-ink/30 mt-1.5 uppercase tracking-[0.2em] font-black leading-none">Studio Operations & Queue Control</p>
          </div>
        </div>
        <Link 
          href="/artist/upload" 
          className="w-full lg:w-auto flex items-center justify-center gap-3 px-8 py-4 border-2 border-ink text-ink rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-ink hover:text-white transition-all active:scale-95 transition-all shadow-xl shadow-ink/5"
        >
          <PlusCircle size={18} />
          Upload New Work
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Jobs Section */}
      <div className="space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between border-b border-ink/5 pb-4">
          <h2 className="text-xl sm:text-2xl font-black font-serif text-ink tracking-tight">Assigned Tasks</h2>
          <p className="text-[10px] uppercase tracking-[0.3em] font-black text-ink/20">Studio Queue</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-[40px] border border-dashed border-ink/10 p-12 sm:p-20 flex flex-col items-center text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
              <ClipboardList className="text-ink/10" size={32} />
            </div>
            <h3 className="text-xl font-black text-ink mb-2 tracking-tight">No assignments yet</h3>
            <p className="text-xs sm:text-sm text-ink/40 max-w-xs mb-2 uppercase font-bold tracking-widest">
              Wait for the administrator to assign a new project to your studio queue.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {orders.map((order: any) => (
              <OrderCard key={order._id} order={order} role="artist" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
