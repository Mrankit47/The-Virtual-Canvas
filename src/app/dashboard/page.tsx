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
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-ink/5 border border-ink/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {session?.user?.image ? (
              <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
                <div className="text-ink/10"><User size={24} /></div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold font-playfair text-ink leading-tight">Welcome back, {session?.user?.name || 'User'}</h1>
            <p className="text-sm text-ink/40 mt-1 uppercase tracking-widest font-medium">Manage your artwork requests and orders</p>
          </div>
        </div>
        <Link 
          href="/order" 
          className="flex items-center justify-center gap-2 px-6 py-3 bg-ink text-white rounded-2xl text-sm font-bold shadow-xl shadow-ink/10 hover:scale-105 active:scale-95 transition-all"
        >
          <PlusCircle size={18} />
          Create New Artwork Request
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Orders Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-playfair text-ink underline decoration-ink/10 underline-offset-8 decoration-4">Recent Orders</h2>
          {orders.length > 0 && (
            <Link href="/dashboard/orders" className="text-xs font-bold text-ink/40 hover:text-ink transition-colors uppercase tracking-widest">
              View All Orders
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-ink/10 p-20 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
              <ShoppingBag className="text-ink/20" size={32} />
            </div>
            <h3 className="text-lg font-bold text-ink">No requests yet</h3>
            <p className="text-sm text-ink/40 max-w-xs mt-2">
              Transform your memories into exclusive artwork. Start your first commission today.
            </p>
            <Link 
              href="/order" 
              className="mt-8 px-8 py-3 bg-ink/5 hover:bg-ink hover:text-white text-ink rounded-xl text-sm font-bold transition-all"
            >
              Start a Commission
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order: any) => (
              <OrderCard key={order._id} order={order} role="user" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
