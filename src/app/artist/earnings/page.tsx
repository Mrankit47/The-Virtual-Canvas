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
    <div className="space-y-10 sm:space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-[32px] border border-ink/5 shadow-sm">
        <div className="min-w-0">
          <h1 className="text-3xl font-black font-serif text-ink tracking-tight">Earnings & Revenue</h1>
          <p className="text-[10px] sm:text-xs text-ink/30 mt-1 uppercase tracking-[0.2em] font-black leading-none">Studio Financial Intelligence & Payouts</p>
        </div>
        <div className="px-8 py-5 bg-ink text-white rounded-[24px] shadow-2xl shadow-ink/20 flex items-center gap-6 transition-transform hover:scale-[1.02]">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <Wallet size={24} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black">Gross Revenue</p>
            <p className="text-2xl font-black font-mono tracking-tighter">₹{totalEarnings.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <StatsCard title="Realized Earnings" value={`₹${totalEarnings.toLocaleString()}`} icon={<CheckCircle size={20} className="text-emerald-600" />} color="bg-emerald-500" />
        <StatsCard title="Pipeline Value" value={`₹${pendingEarnings.toLocaleString()}`} icon={<Clock size={20} className="text-amber-600" />} color="bg-amber-500" />
      </div>

      <div className="bg-white rounded-[32px] border border-ink/5 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-ink/5">
          <h2 className="text-xl font-black font-serif text-ink tracking-tight">Earning History</h2>
        </div>

        {/* Mobile View for Earnings */}
        <div className="lg:hidden p-4 sm:p-6 space-y-4">
          {completedOrders.length === 0 ? (
            <div className="py-12 text-center text-ink/20 text-[10px] uppercase tracking-[0.3em] font-black">
              No realized earnings found
            </div>
          ) : completedOrders.map((order: any) => (
            <div key={order._id} className="bg-gray-50/50 border border-ink/5 p-5 rounded-3xl space-y-5 group">
              <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-mono text-ink/30 mb-1">#{order.orderId?.slice(-8).toUpperCase()}</p>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Paid Out</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-ink font-serif tracking-tighter">₹{(order.price || 0).toLocaleString()}</p>
                    <p className="text-[9px] text-ink/30 uppercase tracking-widest font-black mt-1">Settled</p>
                  </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View for Earnings */}
        <div className="hidden lg:block overflow-x-auto px-8 pb-8">
          <table className="w-full text-left text-sm">
            <thead className="text-ink/20 font-black text-[10px] uppercase tracking-[0.2em] border-b border-ink/5">
              <tr>
                <th className="px-8 py-5">Commission Identity</th>
                <th className="px-8 py-5">Payout Status</th>
                <th className="px-8 py-5">Settlement Window</th>
                <th className="px-8 py-5 text-right">Net Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {completedOrders.map((order: any) => (
                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5 font-mono text-xs text-ink/40 group-hover:text-ink transition-colors">{order.orderId}</td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">Paid</span>
                  </td>
                  <td className="px-8 py-5 text-xs text-ink/30 font-black uppercase tracking-widest">Immediate Settlement</td>
                  <td className="px-8 py-5 text-right font-black text-ink text-lg font-serif">₹{(order.price || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
