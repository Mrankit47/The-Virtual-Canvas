'use client';

import { useState } from 'react';
import { User, CheckCircle2, Clock, AlertCircle, ShoppingBag, Loader2 } from 'lucide-react';

interface AdminOrderTableProps {
  initialOrders: any[];
  artists: any[];
}

export default function AdminOrderTable({ initialOrders, artists }: AdminOrderTableProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleAssign = async (orderId: string, artistId: string) => {
    if (!artistId) return;
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/orders/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, artistId }),
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        // Update local state
        setOrders(orders.map(o => o._id === orderId ? { ...o, assignedArtist: artists.find(a => a._id === artistId), orderStatus: 'assigned' } : o));
      }
    } catch (err) {
      console.error('Assignment failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      // Using the artist update endpoint but as an admin (we should ensure the API allows this or create an admin one)
      // For now, let's assume the API we built or a similar one handles it
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });

      if (res.ok) {
        setOrders(orders.map(o => o._id === orderId ? { ...o, orderStatus: status } : o));
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="w-full">
      {/* ── Mobile Card View ───────────────────────────────────────────── */}
      <div className="lg:hidden space-y-6">
        {orders.map((order: any) => {
          const amount = order.orderType === 'cart' ? (order.totalAmount || order.price) : order.price;
          const isUpdating = updatingId === order._id;

          return (
            <div key={order._id} className="bg-white border border-ink/5 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-1 h-full bg-ink/10 group-hover:bg-ink transition-colors duration-500" />
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-mono text-ink/40 tracking-widest mb-1">#{order.orderId}</p>
                    <h3 className="font-serif text-lg text-ink font-bold">{order.customerName}</h3>
                    <p className="text-[11px] text-ink/40 uppercase tracking-widest leading-none mt-1">{order.userEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-serif font-bold text-ink">₹{(amount || 0).toLocaleString()}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] font-extrabold opacity-30">{order.orderType || 'commission'}</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-6 pt-6 border-t border-ink/5 relative">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-extrabold opacity-30 mb-3">Artist Status</p>
                    {order.assignedArtist ? (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-ink text-white flex items-center justify-center shadow-lg">
                           <User size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-ink">{order.assignedArtist.name}</p>
                          <select 
                            disabled={isUpdating}
                            onChange={(e) => handleAssign(order._id, e.target.value)}
                            className="text-[10px] font-bold text-ink/40 hover:text-ink transition-colors bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                          >
                            <option value="">(Re-assign Artist)</option>
                            {artists.filter(a => a._id !== order.assignedArtist?._id).map(a => (
                                <option key={a._id} value={a._id}>{a.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <select
                        onChange={(e) => handleAssign(order._id, e.target.value)}
                        className="w-full bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-extrabold uppercase tracking-widest rounded-xl px-4 py-3 focus:ring-0 cursor-pointer shadow-sm active:scale-95 transition-all"
                      >
                        <option value="">+ Allocate Master Artist</option>
                        {artists.map(a => (
                          <option key={a._id} value={a._id}>{a.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-extrabold opacity-30 mb-2">Progress Stage</p>
                      <select
                        disabled={isUpdating}
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className={`px-4 py-2 rounded-xl text-[10px] uppercase font-extrabold tracking-widest border-none focus:ring-0 cursor-pointer shadow-sm transition-all ${
                          order.orderStatus === 'completed' ? 'bg-emerald-500 text-white' :
                          order.orderStatus === 'progress' ? 'bg-sky-500 text-white' :
                          'bg-amber-400 text-white'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] uppercase tracking-widest font-extrabold opacity-30 mb-2">Payment Integrity</p>
                       <span className={`px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-extrabold border ${
                        order.paymentStatus === 'paid' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-inner shadow-emerald-700/5' 
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                       }`}>
                        {order.paymentStatus}
                       </span>
                    </div>
                  </div>
               </div>
               
               {isUpdating && (
                 <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all duration-500">
                    <Loader2 size={24} className="text-ink animate-spin" />
                 </div>
               )}
            </div>
          );
        })}
      </div>

      {/* ── Desktop Table View ────────────────────────────────────────── */}
      <div className="hidden lg:block w-full overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-ink/40 font-mono text-xs uppercase border-b border-ink/5">
            <tr>
              <th className="px-6 py-5">Order ID</th>
              <th className="px-6 py-5">Customer</th>
              <th className="px-6 py-5">Artist Assignment</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Payment</th>
              <th className="px-6 py-5">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {orders.map((order: any) => {
              const amount = order.orderType === 'cart' ? (order.totalAmount || order.price) : order.price;
              const isUpdating = updatingId === order._id;

              return (
                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="font-mono text-xs text-ink/40 group-hover:text-ink/60 transition-colors">#{order.orderId}</span>
                  </td>
                  
                  <td className="px-6 py-5">
                    <div className="font-semibold text-sm text-ink">{order.customerName}</div>
                    <div className="text-xs text-ink/40 uppercase tracking-widest mt-0.5">{order.userEmail}</div>
                  </td>

                  <td className="px-6 py-5">
                    {order.assignedArtist ? (
                      <div className="flex items-center gap-3 group/artist">
                        <div className="w-8 h-8 rounded-lg bg-ink/5 border border-ink/10 flex items-center justify-center text-ink/40 group-hover/artist:bg-ink/10 transition-colors">
                          <User size={15} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-ink">{order.assignedArtist.name}</div>
                          <div className="text-[10px] text-ink/30 truncate max-w-[140px]">{order.assignedArtist.email}</div>
                        </div>
                        <select
                            disabled={isUpdating}
                            onChange={(e) => handleAssign(order._id, e.target.value)}
                            className="ml-3 bg-transparent border-none text-[10px] font-bold text-ink/20 group-hover/artist:text-ink/60 focus:ring-0 cursor-pointer w-24 appearance-none hover:translate-x-1 transition-transform"
                        >
                            <option value="">(Change Artist)</option>
                            {artists.filter(a => a._id !== order.assignedArtist?._id).map(a => (
                                <option key={a._id} value={a._id}>{a.name}</option>
                            ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {isUpdating ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-ink/5 rounded-lg text-xs text-ink/40 italic">
                            <Loader2 size={14} className="animate-spin" />
                            Assigning...
                          </div>
                        ) : (
                          <select
                            onChange={(e) => handleAssign(order._id, e.target.value)}
                            className="bg-yellow-50/50 border border-yellow-200 text-yellow-800 text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-0 cursor-pointer hover:bg-yellow-50 transition-colors"
                          >
                            <option value="">+ Assign Artist</option>
                            {artists.map(a => (
                              <option key={a._id} value={a._id}>{a.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-5">
                    <select
                      disabled={isUpdating}
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs uppercase font-extrabold tracking-tight border-none focus:ring-0 cursor-pointer shadow-sm transition-all ${
                        order.orderStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        order.orderStatus === 'progress' ? 'bg-sky-100 text-sky-700' :
                        'bg-amber-100 text-amber-700'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="assigned">Assigned</option>
                      <option value="progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>

                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-tight font-bold border ${
                      order.paymentStatus === 'paid' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <div className="font-bold text-base text-ink">₹{(amount || 0).toLocaleString()}</div>
                    <div className="text-[10px] text-ink/20 uppercase tracking-widest mt-0.5">{order.orderType || 'commission'}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

  );
}
