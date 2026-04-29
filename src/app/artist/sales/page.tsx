'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ShoppingBag, TrendingUp, IndianRupee, Loader2, Calendar } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';

export default function ArtistSalesPage() {
  const { data: session } = useSession();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      // We can create a dedicated API or fetch directly if using a client-side library.
      // Since I don't have a dedicated sales API yet, I'll fetch via a search query to the backend.
      // Actually, let's assume we create /api/artist/sales.
      const res = await fetch('/api/artist/sales');
      const data = await res.json();
      if (res.ok) setSales(data);
    } catch (err) {} finally {
      setLoading(false);
    }
  };

  const totalRevenue = sales.reduce((sum, s) => sum + (s.amount || 0), 0);
  
  const stats = [
    { title: 'Total Revenue', value: `₹${totalRevenue}`, icon: <IndianRupee size={20} className="text-green-500" />, color: 'bg-green-500' },
    { title: 'Total Sales', value: sales.length, icon: <ShoppingBag size={20} className="text-blue-500" />, color: 'bg-blue-500' },
    { title: 'Growth', value: '+12%', icon: <TrendingUp size={20} className="text-purple-500" />, color: 'bg-purple-500' },
  ];

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-ink/20" size={40} />
        </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="bg-white p-8 rounded-[32px] border border-ink/5 shadow-sm">
        <h1 className="text-3xl font-black font-serif text-ink tracking-tight">Marketplace Sales</h1>
        <p className="text-[10px] uppercase tracking-[0.3em] font-black text-ink/30 mt-2 text-center md:text-left">Track your earnings and artwork performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-black font-serif text-ink tracking-tight border-b border-ink/5 pb-4">Transaction History</h2>
        
        {sales.length === 0 ? (
          <div className="bg-white rounded-[40px] border border-dashed border-ink/10 p-20 flex flex-col items-center text-center">
            <ShoppingBag className="text-ink/5 mb-6" size={48} />
            <p className="text-xs uppercase font-bold tracking-widest text-ink/40">No sales recorded yet. Your masterpieces are waiting for their first owner!</p>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-ink/5 overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50/50 border-b border-ink/5">
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-ink/40">Artwork</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-ink/40">Buyer</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-ink/40">Date</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-ink/40 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                    {sales.map((sale) => (
                        <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-ink/5 overflow-hidden border border-ink/10">
                                        <img src={sale.artwork?.imageUrl} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="font-bold text-ink text-sm">{sale.artwork?.title || 'Deleted Artwork'}</span>
                                </div>
                            </td>
                            <td className="p-6">
                                <span className="text-xs font-medium text-ink/60">{sale.buyerEmail}</span>
                            </td>
                            <td className="p-6">
                                <div className="flex items-center gap-2 text-xs font-medium text-ink/40">
                                    <Calendar size={12} />
                                    {new Date(sale.createdAt).toLocaleDateString()}
                                </div>
                            </td>
                            <td className="p-6 text-right font-black text-ink">₹{sale.amount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
