'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import StatsCard from '@/components/dashboard/StatsCard';
import OrderCard from '@/components/dashboard/OrderCard';
import { useOrderStore } from '@/store/useOrderStore';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  PlusCircle,
  User
} from 'lucide-react';
import { StatsCardSkeleton, OrderCardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import Link from 'next/link';
import { urlFor } from '@/lib/sanity';

export default function UserDashboard() {
  const { data: session } = useSession();
  const { orders, isLoading, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const stats = [
    { title: 'Total Orders', value: orders.length, icon: <ShoppingBag size={20} className="text-blue-500" />, color: 'bg-blue-500' },
    { title: 'In Progress', value: orders.filter((o: any) => o.orderStatus === 'progress' || o.orderStatus === 'assigned').length, icon: <Clock size={20} className="text-yellow-500" />, color: 'bg-yellow-500' },
    { title: 'Completed', value: orders.filter((o: any) => o.orderStatus === 'completed').length, icon: <CheckCircle2 size={20} className="text-green-500" />, color: 'bg-green-500' },
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
                <div className="text-ink/10"><User size={28} /></div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-ink leading-tight tracking-tight">Welcome back, {session?.user?.name?.split(' ')[0] || 'Collector'}</h1>
            <p className="text-[10px] sm:text-xs text-ink/30 mt-1.5 uppercase tracking-[0.2em] font-black leading-none">Studio Portal & Commission Control</p>
          </div>
        </div>
        <Link 
          href="/order" 
          className="w-full lg:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-ink text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-ink/10 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <PlusCircle size={18} />
          Create New Commission
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Orders Section */}
      <div className="space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between border-b border-ink/5 pb-4">
          <h2 className="text-xl sm:text-2xl font-black font-serif text-ink tracking-tight">Recent Orders</h2>
          {orders.length > 0 && (
            <Link href="/dashboard/orders" className="text-[10px] font-black text-ink/40 hover:text-ink transition-colors uppercase tracking-[0.2em] border-b border-transparent hover:border-ink/20 pb-1">
              View Database
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-[40px] border border-dashed border-ink/10 p-12 sm:p-20 flex flex-col items-center text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
              <ShoppingBag className="text-ink/10" size={32} />
            </div>
            <h3 className="text-xl font-black text-ink mb-2 tracking-tight">No commissions found</h3>
            <p className="text-xs sm:text-sm text-ink/40 max-w-xs mb-10 leading-relaxed uppercase font-bold tracking-widest px-4">
              Transform your memories into exclusive artwork. Start your first commission today.
            </p>
            <Link 
              href="/order" 
              className="px-10 py-4 bg-ink text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:shadow-2xl active:scale-95"
            >
              Begin Masterwork
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {orders.map((order: any) => (
              <OrderCard key={order._id} order={order} role="user" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
