'use client';

import { useEffect } from 'react';
import { useOrderStore } from '@/store/useOrderStore';
import StatsCard from '@/components/dashboard/StatsCard';
import { Wallet, DollarSign, CheckCircle, Clock } from 'lucide-react';

export default function ArtistEarningsPage() {
  const { orders, isLoading, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const completedOrders = orders.filter((o: any) => o.orderStatus === 'completed');
  const totalEarnings = completedOrders.reduce((acc: number, o: any) => acc + (o.price || 0), 0);
  const pendingEarnings = orders.filter((o: any) => o.orderStatus !== 'completed').reduce((acc: number, o: any) => acc + (o.price || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-12">
        <div className="h-10 w-48 bg-ink/5 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-ink/5 rounded-2xl animate-pulse" />
          <div className="h-32 bg-ink/5 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-playfair text-ink leading-tight">Earnings & Revenue</h1>
          <p className="text-sm text-ink/40 mt-1 uppercase tracking-widest font-medium">Financial summary of your studio commissions</p>
        </div>
        <div className="px-6 py-4 bg-ink text-white rounded-3xl shadow-xl shadow-ink/10 flex items-center gap-4">
          <Wallet size={24} />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40">Total Payouts</p>
            <p className="text-xl font-bold font-mono">₹{totalEarnings.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard title="Completed Revenue" value={`₹${totalEarnings.toLocaleString()}`} icon={<CheckCircle size={20} className="text-green-600" />} color="bg-green-500" />
        <StatsCard title="Pending Value" value={`₹${pendingEarnings.toLocaleString()}`} icon={<Clock size={20} className="text-yellow-600" />} color="bg-yellow-500" />
      </div>

      <div className="bg-white rounded-3xl border border-ink/5 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-ink/5">
          <h2 className="text-lg font-bold font-playfair text-ink">Earning History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-ink/40 font-mono text-[10px] uppercase">
              <tr>
                <th className="px-8 py-4">Commission ID</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Completed On</th>
                <th className="px-8 py-4 text-right">Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {completedOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-ink/20 text-xs uppercase tracking-widest font-bold">
                    No completed earnings yet.
                  </td>
                </tr>
              ) : (
                completedOrders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-4 font-mono text-xs">{order.orderId}</td>
                    <td className="px-8 py-4">
                      <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase">Paid</span>
                    </td>
                    <td className="px-8 py-4 text-xs text-ink/40 italic">Recent</td>
                    <td className="px-8 py-4 text-right font-bold text-ink">₹{(order.price || 0).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
