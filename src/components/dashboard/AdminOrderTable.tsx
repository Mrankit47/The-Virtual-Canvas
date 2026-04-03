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
    <table className="w-full text-left text-sm">
      <thead className="bg-gray-50 text-ink/40 font-mono text-[10px] uppercase">
        <tr>
          <th className="px-6 py-3">Order ID</th>
          <th className="px-6 py-3">Customer</th>
          <th className="px-6 py-3">Artist Assignment</th>
          <th className="px-6 py-3">Status</th>
          <th className="px-6 py-3">Payment</th>
          <th className="px-6 py-3">Amount</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-ink/5">
        {orders.map((order: any) => {
          const amount = order.orderType === 'cart' ? (order.totalAmount || order.price) : order.price;
          const isUpdating = updatingId === order._id;

          return (
            <tr key={order._id} className="hover:bg-gray-50 transition-colors group">
              <td className="px-6 py-4">
                <span className="font-mono text-xs text-ink/40">#{order.orderId}</span>
              </td>
              
              <td className="px-6 py-4">
                <div className="font-medium text-sm text-ink">{order.customerName}</div>
                <div className="text-[10px] text-ink/40 uppercase tracking-widest">{order.userEmail}</div>
              </td>

              <td className="px-6 py-4">
                {order.assignedArtist ? (
                  <div className="flex items-center gap-2 group/artist">
                    <div className="w-7 h-7 rounded-lg bg-ink/5 border border-ink/10 flex items-center justify-center text-ink/40">
                      <User size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-ink">{order.assignedArtist.name}</div>
                      <div className="text-[9px] text-ink/30 truncate max-w-[120px]">{order.assignedArtist.email}</div>
                    </div>
                    {/* Re-assign Option */}
                    <select
                        disabled={isUpdating}
                        onChange={(e) => handleAssign(order._id, e.target.value)}
                        className="ml-2 bg-transparent border-none text-[9px] font-bold text-ink/20 group-hover/artist:text-ink/60 focus:ring-0 cursor-pointer w-20 appearance-none"
                    >
                        <option value="">Change?</option>
                        {artists.filter(a => a._id !== order.assignedArtist?._id).map(a => (
                            <option key={a._id} value={a._id}>{a.name}</option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isUpdating ? (
                      <Loader2 size={16} className="animate-spin text-ink/20" />
                    ) : (
                      <select
                        onChange={(e) => handleAssign(order._id, e.target.value)}
                        className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-[10px] font-bold rounded-lg px-2 py-1 focus:ring-0 cursor-pointer"
                      >
                        <option value="">Assign Artist</option>
                        {artists.map(a => (
                          <option key={a._id} value={a._id}>{a.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </td>

              <td className="px-6 py-4">
                <select
                  disabled={isUpdating}
                  value={order.orderStatus}
                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  className={`px-2 py-1 rounded-lg text-[10px] uppercase font-bold tracking-tighter border-none focus:ring-0 cursor-pointer ${
                    order.orderStatus === 'completed' ? 'bg-green-100 text-green-700' :
                    order.orderStatus === 'progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                </select>
              </td>

              <td className="px-6 py-4">
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-tighter font-bold ${
                  order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {order.paymentStatus}
                </span>
              </td>

              <td className="px-6 py-4">
                <div className="font-bold text-ink">₹{(amount || 0).toLocaleString()}</div>
                <div className="text-[9px] text-ink/20 uppercase tracking-widest">{order.orderType || 'commission'}</div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
