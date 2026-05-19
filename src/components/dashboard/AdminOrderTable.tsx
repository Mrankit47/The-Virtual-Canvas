'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, CheckCircle2, Clock, AlertCircle, ShoppingBag, 
  Loader2, Filter, FileText, Printer, ChevronDown, 
  ChevronUp, Mail, Phone, MapPin, Calendar, Info, X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface AdminOrderTableProps {
  initialOrders: any[];
  artists: any[];
}

type MainTab = 'artwork' | 'commission' | 'assigned';
type ArtworkSubTab = 'admin' | 'artist';

export default function AdminOrderTable({ initialOrders, artists }: AdminOrderTableProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Categorization States
  const [activeTab, setActiveTab] = useState<MainTab>('artwork');
  const [artworkSubTab, setArtworkSubTab] = useState<ArtworkSubTab>('admin');
  
  // Detail & Print Modal States
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any | null>(null);
  const [selectedOrderForSticker, setSelectedOrderForSticker] = useState<any | null>(null);

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
        setOrders(orders.map(o => o._id === orderId ? { 
          ...o, 
          assignedArtist: artists.find(a => a._id === artistId), 
          orderStatus: 'assigned' 
        } : o));
        
        // Auto update current opened modals if any
        if (selectedOrderForDetail?._id === orderId) {
          setSelectedOrderForDetail((prev: any) => ({
            ...prev,
            assignedArtist: artists.find(a => a._id === artistId),
            orderStatus: 'assigned'
          }));
        }

        router.refresh();
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
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });

      if (res.ok) {
        setOrders(orders.map(o => o._id === orderId ? { ...o, orderStatus: status } : o));
        
        // Auto update current opened modals if any
        if (selectedOrderForDetail?._id === orderId) {
          setSelectedOrderForDetail((prev: any) => ({
            ...prev,
            orderStatus: status
          }));
        }

        router.refresh();
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper: check if a cart item was uploaded by an artist
  const isItemArtistUpload = (item: any, order: any) => {
    // Check in the resolved cartItemDetails array
    const resolvedItem = order.cartItemDetails?.find((d: any) => d && d._id === item.artworkId);
    if (resolvedItem) {
      return resolvedItem.isArtistUpload === true || resolvedItem.artist != null;
    }
    return false;
  };

  // Filter Orders based on Hierarchy & Tabs
  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'artwork':
        // Only Cart Purchase or Direct Buy orders
        const artworkOrders = orders.filter(o => o.orderType === 'cart' || o.orderType === 'direct');
        
        if (artworkSubTab === 'admin') {
          // Admin uploaded items (direct buy artwork is admin, or cart items are admin)
          return artworkOrders.filter(o => {
            if (o.orderType === 'direct') {
              return !o.artworkId?.isArtistUpload;
            }
            // For cart, check if at least one item belongs to admin (or default to admin if empty)
            if (!o.cartItems || o.cartItems.length === 0) return true;
            return o.cartItems.some((item: any) => !isItemArtistUpload(item, o));
          });
        } else {
          // Artist uploaded items
          return artworkOrders.filter(o => {
            if (o.orderType === 'direct') {
              return o.artworkId?.isArtistUpload === true;
            }
            if (!o.cartItems || o.cartItems.length === 0) return false;
            return o.cartItems.some((item: any) => isItemArtistUpload(item, o));
          });
        }

      case 'commission':
        // Only custom commission artwork orders
        return orders.filter(o => o.orderType === 'commission' || o.orderType === 'studio' || !o.orderType);

      case 'assigned':
        // Only orders that have an artist assigned
        return orders.filter(o => o.assignedArtist != null);

      default:
        return orders;
    }
  };

  const filteredList = getFilteredOrders();

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6">
      
      {/* ── Level 1: Main Category Tabs ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 border border-ink/5 rounded-3xl shrink-0">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveTab('artwork')}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 flex items-center gap-2 ${
              activeTab === 'artwork' 
                ? 'bg-ink text-white border-ink shadow-lg shadow-ink/15' 
                : 'bg-white text-ink/60 border-ink/5 hover:text-ink'
            }`}
          >
            <ShoppingBag size={14} />
            Artwork Orders
          </button>
          <button 
            onClick={() => setActiveTab('commission')}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 flex items-center gap-2 ${
              activeTab === 'commission' 
                ? 'bg-ink text-white border-ink shadow-lg shadow-ink/15' 
                : 'bg-white text-ink/60 border-ink/5 hover:text-ink'
            }`}
          >
            <FileText size={14} />
            Commission Artwork Orders
          </button>
          <button 
            onClick={() => setActiveTab('assigned')}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 flex items-center gap-2 ${
              activeTab === 'assigned' 
                ? 'bg-ink text-white border-ink shadow-lg shadow-ink/15' 
                : 'bg-white text-ink/60 border-ink/5 hover:text-ink'
            }`}
          >
            <User size={14} />
            Artist Assigned Orders
          </button>
        </div>
        
        <div className="text-[10px] font-mono text-ink/40 uppercase tracking-widest font-black shrink-0 text-right pr-2">
          {filteredList.length} Segmented {filteredList.length === 1 ? 'Order' : 'Orders'}
        </div>
      </div>

      {/* ── Level 2: Sub-tabs for Artwork Orders ────────────────────────── */}
      {activeTab === 'artwork' && (
        <div className="flex gap-2 p-2 bg-gray-100/50 border border-ink/5 rounded-2xl w-fit">
          <button 
            onClick={() => setArtworkSubTab('admin')}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
              artworkSubTab === 'admin' 
                ? 'bg-white text-ink shadow-sm' 
                : 'text-ink/40 hover:text-ink/75'
            }`}
          >
            Admin Artworks Order
          </button>
          <button 
            onClick={() => setArtworkSubTab('artist')}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
              artworkSubTab === 'artist' 
                ? 'bg-white text-ink shadow-sm' 
                : 'text-ink/40 hover:text-ink/75'
            }`}
          >
            Artist Artworks Order
          </button>
        </div>
      )}

      {/* ── Mobile View: Premium Cards ─────────────────────────────────── */}
      <div className="lg:hidden space-y-4">
        {filteredList.length === 0 ? (
          <div className="py-16 text-center text-ink/20 text-[10px] uppercase tracking-widest font-black bg-white rounded-3xl border border-ink/5">
            No orders found in this section
          </div>
        ) : filteredList.map((order: any) => {
          const amount = order.orderType === 'cart' ? (order.totalAmount || order.price) : order.price;
          const isUpdating = updatingId === order._id;

          return (
            <div 
              key={order._id} 
              onClick={() => setSelectedOrderForDetail(order)}
              className="bg-white border border-ink/5 rounded-3xl p-5 shadow-sm relative overflow-hidden group transition-all hover:shadow-lg cursor-pointer"
            >
               <div className="absolute top-0 left-0 w-1 bg-ink/5 group-hover:bg-ink transition-colors duration-300" />
               <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-mono text-ink/30 tracking-wider mb-1">#{order.orderId}</p>
                    <h3 className="text-sm font-black text-ink leading-tight truncate">{order.customerName}</h3>
                    <p className="text-[10px] text-ink/30 uppercase tracking-widest mt-1 truncate">{order.userEmail}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-serif font-black text-ink">₹{(amount || 0).toLocaleString()}</p>
                    <span className="text-[8px] uppercase tracking-widest font-black opacity-30 mt-0.5 inline-block">{order.orderType || 'commission'}</span>
                  </div>
               </div>

               <div className="flex justify-between items-center pt-4 border-t border-ink/5">
                  <div className="flex items-center gap-2">
                     <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold border ${
                       order.orderStatus === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                       order.orderStatus === 'progress' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                       order.orderStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                       'bg-amber-50 text-amber-700 border-amber-100'
                     }`}>
                       {order.orderStatus}
                     </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold border ${
                      order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrderForSticker(order);
                      }}
                      className="p-2 rounded-xl border border-ink/5 bg-gray-50 hover:bg-ink hover:text-white transition-all text-ink/40 flex items-center justify-center"
                      title="Receipt Sticker"
                    >
                      <Printer size={12} />
                    </button>
                  </div>
               </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop View: Premium Table ─────────────────────────────────── */}
      <div className="hidden lg:block w-full overflow-hidden rounded-[24px] border border-ink/5 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-ink/40 font-mono text-[10px] uppercase border-b border-ink/5">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Assigned Artist</th>
              <th className="px-6 py-4">Fulfillment</th>
              <th className="px-6 py-4">Payment</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-ink/20 text-xs font-black uppercase tracking-widest">
                  No orders found in this section
                </td>
              </tr>
            ) : filteredList.map((order: any) => {
              const amount = order.orderType === 'cart' ? (order.totalAmount || order.price) : order.price;
              const isUpdating = updatingId === order._id;

              return (
                <tr 
                  key={order._id} 
                  className="hover:bg-gray-50/30 transition-colors group cursor-pointer"
                  onClick={() => setSelectedOrderForDetail(order)}
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-ink/40 group-hover:text-ink transition-colors">#{order.orderId}</span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-ink">{order.customerName}</div>
                    <div className="text-[10px] text-ink/30 uppercase tracking-widest mt-0.5">{order.userEmail}</div>
                  </td>

                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    {order.assignedArtist ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-ink/5 border border-ink/10 flex items-center justify-center text-ink/40">
                          <User size={14} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-ink leading-none">{order.assignedArtist.name}</div>
                          <select
                              disabled={isUpdating}
                              onChange={(e) => handleAssign(order._id, e.target.value)}
                              className="bg-transparent border-none text-[9px] font-black text-ink/30 hover:text-ink/60 focus:ring-0 cursor-pointer p-0 appearance-none mt-1"
                          >
                              <option value="">(Change)</option>
                              {artists.filter(a => a._id !== order.assignedArtist?._id).map(a => (
                                  <option key={a._id} value={a._id}>{a.name}</option>
                              ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <select
                        onChange={(e) => handleAssign(order._id, e.target.value)}
                        className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-[10px] font-black uppercase tracking-wider rounded-lg px-2 py-1 focus:ring-0 cursor-pointer hover:bg-yellow-100 transition-colors"
                      >
                        <option value="">+ Assign Artist</option>
                        {artists.map(a => (
                          <option key={a._id} value={a._id}>{a.name}</option>
                        ))}
                      </select>
                    )}
                  </td>

                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      disabled={isUpdating}
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className={`px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider border-none focus:ring-0 cursor-pointer shadow-sm transition-all ${
                        order.orderStatus === 'completed' ? 'bg-emerald-500 text-white' :
                        order.orderStatus === 'progress' ? 'bg-sky-500 text-white' :
                        order.orderStatus === 'paid' ? 'bg-emerald-600 text-white' :
                        'bg-amber-400 text-white'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="assigned">Assigned</option>
                      <option value="progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold border ${
                      order.paymentStatus === 'paid' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm' 
                        : 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-black text-sm text-ink">₹{(amount || 0).toLocaleString()}</div>
                    <div className="text-[8px] text-ink/20 uppercase tracking-widest mt-0.5">{order.orderType || 'commission'}</div>
                  </td>

                  <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setSelectedOrderForDetail(order)}
                        className="p-2 rounded-lg border border-ink/5 bg-gray-50 hover:bg-ink hover:text-white transition-all text-ink/40"
                        title="View Details"
                      >
                        <Info size={13} />
                      </button>
                      <button 
                        onClick={() => setSelectedOrderForSticker(order)}
                        className="p-2 rounded-lg border border-ink/5 bg-gray-50 hover:bg-ink hover:text-white transition-all text-ink/40"
                        title="Receipt Sticker"
                      >
                        <Printer size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Modal 1: Comprehensive Order Details Popup ────────────────── */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 bg-ink/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[32px] border border-ink/5 shadow-2xl overflow-hidden relative max-h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-ink/5 flex justify-between items-start shrink-0">
              <div>
                <span className="text-[8px] uppercase tracking-[0.25em] font-black text-ink/30">Order Administration Panel</span>
                <h3 className="text-xl font-serif font-black text-ink mt-1">ID: #{selectedOrderForDetail.orderId}</h3>
              </div>
              <button 
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-2 rounded-xl hover:bg-gray-100 text-ink/40 hover:text-ink transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              
              {/* Image Preview & Basic Parameters */}
              <div className="flex flex-col sm:flex-row gap-6 bg-gray-50 p-5 rounded-3xl border border-ink/5 items-center">
                <div className="w-28 h-28 bg-ink/5 rounded-2xl border border-ink/5 overflow-hidden shadow-sm shrink-0 flex items-center justify-center">
                  {selectedOrderForDetail.referenceImage || selectedOrderForDetail.artworkId?.image || selectedOrderForDetail.cartItems?.[0]?.imageUrl ? (
                    <img 
                      src={selectedOrderForDetail.referenceImage || selectedOrderForDetail.artworkId?.image || selectedOrderForDetail.cartItems?.[0]?.imageUrl} 
                      alt="Deliverable thumbnail" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag size={28} className="text-ink/15" />
                  )}
                </div>
                
                <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                  <div className="flex flex-wrap gap-2 items-center justify-center sm:justify-start">
                    <span className="px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold bg-ink text-white">{selectedOrderForDetail.orderType}</span>
                     <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold border ${
                       selectedOrderForDetail.orderStatus === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                       selectedOrderForDetail.orderStatus === 'progress' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                       selectedOrderForDetail.orderStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                       'bg-amber-50 text-amber-700 border-amber-100'
                     }`}>{selectedOrderForDetail.orderStatus}</span>
                  </div>
                  <h4 className="text-base font-black text-ink leading-tight">
                    {selectedOrderForDetail.customerName}
                  </h4>
                  <p className="text-[10px] text-ink/40 font-mono select-all truncate">{selectedOrderForDetail.email}</p>
                </div>
              </div>

              {/* Requirements & Customization parameters */}
              <div className="space-y-3">
                <h5 className="text-[9px] uppercase font-black tracking-[0.2em] text-ink/20 border-b border-ink/5 pb-1">Requirements</h5>
                <p className="text-xs text-ink/70 font-semibold leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-2xl border border-ink/5">
                  {selectedOrderForDetail.description || 'No custom requirement notes recorded.'}
                </p>
              </div>

              {/* Cart Artworks List */}
              {selectedOrderForDetail.orderType === 'cart' && selectedOrderForDetail.cartItemDetails && selectedOrderForDetail.cartItemDetails.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-[9px] uppercase font-black tracking-[0.2em] text-ink/20 border-b border-ink/5 pb-1">Items Included</h5>
                  <div className="space-y-2.5">
                    {selectedOrderForDetail.cartItemDetails.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between gap-4 bg-gray-50 p-3 rounded-xl border border-ink/5">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-ink truncate">{item.title}</p>
                          <span className="text-[8px] uppercase tracking-widest font-extrabold text-ink/30 mt-0.5 inline-block">
                            Uploaded By: {item.isArtistUpload ? `Artist (${item.artist?.name || 'Unknown'})` : 'Admin'}
                          </span>
                        </div>
                        <p className="font-mono text-xs font-black text-ink shrink-0">₹{item.price?.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logistics & Contact Specifications */}
              <div className="space-y-3">
                <h5 className="text-[9px] uppercase font-black tracking-[0.2em] text-ink/20 border-b border-ink/5 pb-1">Courier Logistics Parameters</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] font-black text-ink/30 uppercase tracking-widest block mb-1">Mobile Number</span>
                    <span className="font-bold text-ink">{selectedOrderForDetail.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-ink/30 uppercase tracking-widest block mb-1">Pincode Identifier</span>
                    <span className="font-bold text-ink">{selectedOrderForDetail.pincode || '000000'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[9px] font-black text-ink/30 uppercase tracking-widest block mb-1">Fulfillment Address</span>
                    <p className="bg-gray-50 p-3.5 rounded-xl border border-ink/5 font-semibold text-ink leading-relaxed">
                      {selectedOrderForDetail.address || 'No shipping address specified.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Breakdowns */}
              {(() => {
                let detailStudioMeta: any = null;
                if (selectedOrderForDetail.adminNotes) {
                  try {
                    detailStudioMeta = JSON.parse(selectedOrderForDetail.adminNotes);
                  } catch {}
                }
                
                const dbArtworkPrice = detailStudioMeta
                  ? Math.round(detailStudioMeta.basePrice * detailStudioMeta.sizeMultiplier + detailStudioMeta.paperExtraCost)
                  : (selectedOrderForDetail.orderType === 'cart' ? selectedOrderForDetail.price : selectedOrderForDetail.price);
                  
                const dbFramePrice = detailStudioMeta?.addPhotoFrame ? (detailStudioMeta.framePrice || 0) : 0;
                const dbOrigFramePrice = detailStudioMeta?.addPhotoFrame ? (detailStudioMeta.baseFramePrice || 0) : 0;
                
                const dbDelCharge = selectedOrderForDetail.shippingCharges !== undefined
                  ? selectedOrderForDetail.shippingCharges
                  : (detailStudioMeta?.shippingCharges || 0);
                  
                const dbIsFreeFrame = detailStudioMeta?.addPhotoFrame && detailStudioMeta.baseFramePrice > 0 && detailStudioMeta.framePrice === 0;
                const dbIsFreeShipping = dbDelCharge === 0 && selectedOrderForDetail.couponCode;

                return (
                  <div className="space-y-3 bg-gray-50 p-5 rounded-3xl border border-ink/5">
                    <h5 className="text-[9px] uppercase font-black tracking-[0.2em] text-ink/30 border-b border-ink/10 pb-1.5">Financial Ledger</h5>
                    <div className="space-y-2 text-xs">
                      
                      <div className="flex justify-between font-semibold text-ink/75">
                        <span>Artwork Base Cost</span>
                        <span>₹{dbArtworkPrice.toLocaleString()}</span>
                      </div>
                      
                      {detailStudioMeta?.addPhotoFrame && (
                        <div className="flex justify-between font-semibold text-ink/75">
                          <span>Premium Frame Charge</span>
                          <span>
                            {dbIsFreeFrame ? (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm text-[10px]"><s>₹{dbOrigFramePrice}</s> FREE (Promo)</span>
                            ) : (
                              `+ ₹${dbFramePrice.toLocaleString()}`
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between font-semibold text-ink/75">
                        <span>Delivery & Shipping ({selectedOrderForDetail.shippingZone || detailStudioMeta?.shippingZone || 'Standard'})</span>
                        <span>
                          {dbIsFreeShipping ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm text-[10px]">FREE (Promo)</span>
                          ) : (
                            dbDelCharge === 0 ? 'FREE' : `+ ₹${dbDelCharge.toLocaleString()}`
                          )}
                        </span>
                      </div>
                      
                      {selectedOrderForDetail.discountAmount > 0 && (
                        <div className="flex justify-between font-bold text-emerald-700 bg-emerald-50 p-2 border border-emerald-100 rounded-lg">
                          <span>Promo Applied ({selectedOrderForDetail.couponCode || 'PROMO'})</span>
                          <span>- ₹{(selectedOrderForDetail.discountAmount || 0).toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between font-black text-sm text-ink pt-2.5 border-t border-ink/10">
                        <span>Net Total Paid</span>
                        <span>₹{((selectedOrderForDetail.orderType === 'cart' ? (selectedOrderForDetail.totalAmount || selectedOrderForDetail.price) : selectedOrderForDetail.price) || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-ink/5 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => {
                  setSelectedOrderForSticker(selectedOrderForDetail);
                }}
                className="px-5 py-2.5 border border-ink/10 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-ink hover:text-white transition-all flex items-center gap-2"
              >
                <Printer size={13} /> Sticker Receipt
              </button>
              <button 
                onClick={() => setSelectedOrderForDetail(null)}
                className="px-5 py-2.5 bg-ink text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-ink/90 transition-all shadow-md shadow-ink/15 active:scale-95"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Modal 2: Flipkart/Amazon Thermal Label Sticker Receipt ─────── */}
      {selectedOrderForSticker && (
        <div className="fixed inset-0 bg-ink/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-[32px] border border-ink/5 shadow-2xl p-6 relative flex flex-col my-8">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-ink/5 shrink-0">
              <h4 className="text-xs font-black uppercase tracking-wider text-ink/30">Logistic Thermal Label Preview</h4>
              <button 
                onClick={() => setSelectedOrderForSticker(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-ink/40 hover:text-ink transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sticker Area (This is formatted for 4x6 printing) */}
            <div className="my-6 p-4 border border-dashed border-ink/25 bg-white rounded-xl overflow-hidden self-center">
              <div 
                id="thermal-label-print-area" 
                className="w-full max-w-[3.5in] border-2 border-black p-4 bg-white text-black font-sans text-xs space-y-4"
                style={{ fontFamily: 'monospace, system-ui' }}
              >
                {/* Embedded Style only parsed on window print */}
                <style>{`
                  @media print {
                    body * {
                      visibility: hidden !important;
                    }
                    #thermal-label-print-area, #thermal-label-print-area * {
                      visibility: visible !important;
                    }
                    #thermal-label-print-area {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      max-width: 4in !important;
                      border: none !important;
                      box-shadow: none !important;
                      margin: 0 !important;
                      padding: 0 !important;
                    }
                  }
                `}</style>

                {/* Top Logistic Barcode Graphic Placeholder */}
                <div className="text-center space-y-1">
                  <div className="text-base font-black tracking-[0.25em] uppercase font-serif">THE VIRTUAL CANVAS</div>
                  <div className="h-8 bg-black w-full flex items-center justify-between px-2 text-[8px] font-bold text-white uppercase tracking-widest shrink-0">
                    <span>* {selectedOrderForSticker.orderId} *</span>
                    <span>LOGISTICS</span>
                  </div>
                </div>

                {/* Prepaid Block */}
                <div className="flex justify-between items-center border-b-2 border-black pb-2 text-xs">
                  <div>
                    <p className="font-extrabold text-[9px] uppercase tracking-wider">PAYMENT OPTION</p>
                    <p className="text-sm font-black border-2 border-black px-2 py-0.5 mt-0.5 uppercase w-fit bg-black text-white">
                      {selectedOrderForSticker.paymentStatus === 'paid' ? 'PREPAID - UPI' : 'CASH ON DELIV'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-[9px] uppercase tracking-wider">ORDER CATEGORY</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider mt-1">{selectedOrderForSticker.orderType || 'commission'}</p>
                  </div>
                </div>

                {/* QR Code in Center */}
                <div className="flex justify-between items-center gap-4 border-b-2 border-black pb-3">
                  <div className="shrink-0 border border-black p-1 bg-white">
                    {/* Live SVG QR Code containing order details */}
                    <QRCodeSVG 
                      value={JSON.stringify({
                        id: selectedOrderForSticker.orderId,
                        client: selectedOrderForSticker.customerName,
                        phone: selectedOrderForSticker.phone,
                        pincode: selectedOrderForSticker.pincode,
                        amount: selectedOrderForSticker.orderType === 'cart' ? (selectedOrderForSticker.totalAmount || selectedOrderForSticker.price) : selectedOrderForSticker.price,
                        status: selectedOrderForSticker.orderStatus
                      })} 
                      size={80}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="min-w-0 text-[10px] leading-snug space-y-1">
                    <p className="font-black text-[9px] uppercase tracking-wider border-b border-black w-fit mb-1">SCAN STICKER</p>
                    <p className="truncate"><span className="font-bold">ID:</span> #{selectedOrderForSticker.orderId}</p>
                    <p><span className="font-bold">DATE:</span> {new Date(selectedOrderForSticker.createdAt).toLocaleDateString(undefined, { dateStyle: 'short' })}</p>
                    <p className="text-[9px] font-semibold text-gray-600">Scan QR Code above to verify full fulfillment parameters and logistics integrity.</p>
                  </div>
                </div>

                {/* Customer Details Block */}
                <div className="border-b-2 border-black pb-3 text-xs space-y-2">
                  <div>
                    <span className="font-black text-[8px] uppercase tracking-wider block">DELIVER TO:</span>
                    <p className="text-sm font-black uppercase mt-0.5">{selectedOrderForSticker.customerName}</p>
                  </div>
                  <div>
                    <span className="font-black text-[8px] uppercase tracking-wider block">SHIPPING ADDRESS:</span>
                    <p className="text-[11px] leading-relaxed font-bold mt-0.5">{selectedOrderForSticker.address}</p>
                  </div>
                  <div className="flex justify-between items-center pt-1.5">
                    <div>
                      <span className="font-black text-[8px] uppercase tracking-wider block">CONTACT NUMBER:</span>
                      <p className="text-xs font-black mt-0.5 select-all">{selectedOrderForSticker.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-[8px] uppercase tracking-wider block">PINCODE:</span>
                      <p className="text-lg font-black tracking-widest mt-0.5 border border-black px-2.5 py-0.5 bg-black text-white">{selectedOrderForSticker.pincode}</p>
                    </div>
                  </div>
                </div>

                {/* Price Matrix Sticker Footer */}
                {(() => {
                  let studioMeta: any = null;
                  if (selectedOrderForSticker.adminNotes) {
                    try {
                      studioMeta = JSON.parse(selectedOrderForSticker.adminNotes);
                    } catch {}
                  }
                  
                  const artworkBasePrice = studioMeta
                    ? Math.round(studioMeta.basePrice * studioMeta.sizeMultiplier + studioMeta.paperExtraCost)
                    : (selectedOrderForSticker.orderType === 'cart' ? selectedOrderForSticker.price : selectedOrderForSticker.price);
                  
                  const frameCharge = studioMeta?.addPhotoFrame ? (studioMeta.framePrice || 0) : 0;
                  const origFrameCharge = studioMeta?.addPhotoFrame ? (studioMeta.baseFramePrice || 0) : 0;
                  
                  const delCharge = selectedOrderForSticker.shippingCharges !== undefined
                    ? selectedOrderForSticker.shippingCharges
                    : (studioMeta?.shippingCharges || 0);
                    
                  const isFreeFrame = studioMeta?.addPhotoFrame && studioMeta.baseFramePrice > 0 && studioMeta.framePrice === 0;
                  const isFreeShipping = delCharge === 0 && selectedOrderForSticker.couponCode;

                  return (
                    <div className="text-[10px] space-y-1.5 pt-2 border-t-2 border-black">
                      <div className="flex justify-between">
                        <span>ARTWORK BASE VALUE:</span>
                        <span className="font-bold">₹{artworkBasePrice.toLocaleString()}</span>
                      </div>
                      
                      {studioMeta?.addPhotoFrame && (
                        <div className="flex justify-between">
                          <span>PREMIUM FRAME:</span>
                          <span className="font-bold font-mono">
                            {isFreeFrame ? (
                              <span><s>₹{origFrameCharge}</s> FREE</span>
                            ) : (
                              `+ ₹${frameCharge.toLocaleString()}`
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span>SHIPPING CHARGES:</span>
                        <span className="font-bold font-mono">
                          {isFreeShipping ? (
                            <span>FREE</span>
                          ) : (
                            delCharge === 0 ? 'FREE' : `+ ₹${delCharge.toLocaleString()}`
                          )}
                        </span>
                      </div>
                      
                      {selectedOrderForSticker.discountAmount > 0 && (
                        <div className="flex justify-between font-bold">
                          <span>COUPON SAVINGS ({selectedOrderForSticker.couponCode || 'PROMO'}):</span>
                          <span className="font-bold font-mono">- ₹{(selectedOrderForSticker.discountAmount || 0).toLocaleString()}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between font-black text-sm border-t-2 border-black pt-1.5">
                        <span>NET TOTAL PAID:</span>
                        <span className="font-mono">₹{((selectedOrderForSticker.orderType === 'cart' ? (selectedOrderForSticker.totalAmount || selectedOrderForSticker.price) : selectedOrderForSticker.price) || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-3 border-t border-ink/5 shrink-0">
              <button 
                onClick={() => setSelectedOrderForSticker(null)}
                className="flex-1 py-3 border border-ink/10 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-150 transition-all text-center"
              >
                Close Preview
              </button>
              <button 
                onClick={triggerPrint}
                className="flex-1 py-3 bg-ink text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-ink/90 transition-all shadow-md shadow-ink/15 active:scale-95 flex items-center justify-center gap-2"
              >
                <Printer size={13} /> Print Sticker
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
