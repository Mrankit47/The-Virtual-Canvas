'use client';

import { useEffect } from 'react';
import { useOrderStore } from '@/store/useOrderStore';
import OrderCard from '@/components/dashboard/OrderCard';
import { OrderCardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ClipboardList } from 'lucide-react';

export default function ArtistOrdersPage() {
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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-playfair text-ink">Assigned Task Queue</h1>
        <p className="text-xs font-mono text-ink/40 uppercase tracking-widest">{orders.length} ACTIVE JOBS</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-ink/10 p-20 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
            <ClipboardList className="text-ink/20" size={32} />
          </div>
          <h3 className="text-lg font-bold text-ink">No assignments yet</h3>
          <p className="text-sm text-ink/40 max-w-xs mt-2">
            Once the administrator assigns a new job to your studio, it will appear here.
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
  );
}
