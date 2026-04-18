'use client';

import { useEffect } from 'react';
import { useOrderStore } from '@/store/useOrderStore';
import OrderCard from '@/components/dashboard/OrderCard';
import { OrderCardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function UserOrdersPage() {
  const { orders, isLoading, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-ink/5 rounded-xl animate-pulse" />
        <div className="space-y-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-[32px] border border-ink/5 shadow-sm">
        <div>
          <h1 className="text-3xl font-black font-serif text-ink tracking-tight">Order History</h1>
          <p className="text-[10px] sm:text-xs text-ink/30 mt-1 uppercase tracking-[0.2em] font-black leading-none">Complete Archive of Commissions</p>
        </div>
        <div className="px-5 py-2.5 bg-ink/5 text-ink/40 rounded-2xl text-[10px] font-black border border-ink/5 uppercase tracking-[0.2em]">
            {orders.length} Verified Records
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-dashed border-ink/10 p-12 sm:p-20 flex flex-col items-center text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
            <ShoppingBag className="text-ink/10" size={32} />
          </div>
          <h3 className="text-xl font-black text-ink mb-2 tracking-tight">No records found</h3>
          <p className="text-xs sm:text-sm text-ink/40 max-w-xs mb-10 leading-relaxed uppercase font-bold tracking-widest px-4">
            You haven't placed any artwork requests yet. Start your first legacy piece today.
          </p>
          <Link 
            href="/order" 
            className="px-10 py-4 bg-ink text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:shadow-2xl active:scale-95"
          >
            Start a Commission
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
  );
}
