'use client';

import { useState } from "react";
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Image as IconImage,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import OrderTimeline from "./OrderTimeline";
import ArtistOrderUpdateForm from "./ArtistOrderUpdateForm";
import { useNotificationStore } from "@/store/useNotificationStore";
import Lightbox from "../ui/Lightbox";

interface OrderCardProps {
  order: any;
  role: 'admin' | 'artist' | 'user';
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function OrderCard({ order, role }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [updates, setUpdates] = useState<any[]>([]);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const statusStyles: Record<string, { bg: string; text: string; icon: any }> = {
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: AlertCircle },
    paid: { bg: 'bg-blue-50', text: 'text-blue-700', icon: CreditCard },
    assigned: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: ShoppingBag },
    progress: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock },
    completed: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle2 },
  };

  const currentStatus = statusStyles[order.orderStatus] || statusStyles.pending;
  
  const toggleTimeline = async () => {
    if (!isExpanded && updates.length === 0) {
      setIsLoadingUpdates(true);
      try {
        const res = await fetch(`/api/orders/updates?orderId=${order._id}`);
        if (res.ok) {
          const data = await res.json();
          setUpdates(data);
        }
      } catch (err) {
        console.error("Fetch updates failed:", err);
      } finally {
        setIsLoadingUpdates(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handlePayment = async () => {
    setIsPaying(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order._id }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: data.amount,
        currency: data.currency,
        name: "The Virtual Canvas",
        description: `Payment for Order #${data.order_id}`,
        order_id: data.id,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              order_id: order._id,
            }),
          });
          if (verifyRes.ok) {
              window.location.reload(); // Refresh to show paid status
          }
        },
        prefill: {
          name: order.customerName,
          email: order.userEmail,
        },
        theme: { color: "#1a1a1a" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment failed:", err);
      alert("Payment failed. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  const progressPercent = 
    order.orderStatus === 'completed' ? 100 :
    order.orderStatus === 'progress' ? 60 :
    order.orderStatus === 'assigned' ? 30 : 10;

  const displayImage = order.artworkUrl || order.referenceImage;

  return (
    <div className="bg-white rounded-3xl border border-ink/5 overflow-hidden hover:shadow-xl hover:shadow-ink/5 transition-all">
      <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            {/* Info Section */}
            <div className="flex gap-4 items-center">
              <div className={`w-14 h-14 rounded-2xl ${currentStatus.bg} flex items-center justify-center relative overflow-hidden group`}>
                {displayImage ? (
                    <div 
                      className="relative w-full h-full cursor-zoom-in group"
                      onClick={() => setLightboxSrc(displayImage)}
                    >
                      <Image 
                        src={displayImage} 
                        alt={order.title || 'Artwork'} 
                        fill
                        className="object-cover rounded-2xl transition-transform duration-500 group-hover:scale-110" 
                      />
                      {!order.artworkUrl && order.referenceImage && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[7px] text-white font-bold uppercase tracking-widest text-center px-1">Customer<br/>Reference</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                ) : (
                    <IconImage size={24} className={currentStatus.text} />
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-sans font-bold text-ink/30 px-2 py-0.5 bg-gray-50 rounded-full border border-ink/5 uppercase">
                    #{order.orderId?.slice(-6) || 'UNSET'}
                  </span>
                  <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${currentStatus.bg} ${currentStatus.text}`}>
                    {String(order.orderStatus || 'pending').replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-ink">
                  {order.title || (typeof order.artworkType === 'string' ? order.artworkType : order.artworkType?.title) || 'Commission Art'}
                </h3>
                <p className="text-[9px] uppercase tracking-widest text-ink/30 font-bold mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Progress Visual */}
            <div className="w-full md:w-56 space-y-2">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] uppercase font-bold text-ink/30 tracking-[0.2em]">Completion</span>
                    <span className="text-[11px] font-bold text-ink">{progressPercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-ink/5">
                    <div 
                        className={`h-full transition-all duration-1000 ${order.orderStatus === 'completed' ? 'bg-green-500' : 'bg-ink'}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Price & Primary Action */}
            <div className="flex items-center gap-6 justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-ink/5">
                <div className="text-right">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-ink/20">Total Amount</p>
                    <p className="text-lg font-bold text-ink">₹{(order.price || order.totalAmount || 0).toLocaleString()}</p>
                </div>

                {role === 'user' && order.orderStatus === 'pending' && (
                    <button
                        onClick={handlePayment}
                        disabled={isPaying}
                        className="flex items-center gap-2 px-6 py-3 bg-ink text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-ink/20 disabled:opacity-50"
                    >
                        {isPaying ? <Loader2 className="animate-spin" size={14} /> : <CreditCard size={14} />}
                        Pay Now
                    </button>
                )}

                {role === 'artist' && (
                    <button
                        onClick={() => setIsUpdating(!isUpdating)}
                        className="flex items-center gap-2 px-6 py-3 bg-ink text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-ink/20"
                    >
                        {isUpdating ? 'Hide Form' : 'Update Work'}
                    </button>
                )}
            </div>
          </div>
      </div>

      {/* Expanded Logic */}
      {isUpdating && role === 'artist' && (
          <div className="p-6 bg-gray-50/10 border-t border-ink/5">
              <ArtistOrderUpdateForm 
                orderId={order._id} 
                currentStatus={order.orderStatus} 
                onSuccess={() => { setIsUpdating(false); window.location.reload(); }} 
              />
          </div>
      )}

      {/* Timeline Toggle Bar (Bottom) */}
      <button 
        onClick={toggleTimeline}
        className="w-full py-3 bg-gray-50/50 hover:bg-gray-50 border-t border-ink/5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink/40 hover:text-ink transition-colors"
      >
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {isExpanded ? 'Hide History' : 'Track Commission Progress'}
        {isLoadingUpdates && <Loader2 className="animate-spin ml-2" size={12} />}
      </button>

      {/* Expanded Timeline */}
      {isExpanded && (
          <div className="p-8 bg-gray-50/20">
              <OrderTimeline 
                updates={updates} 
                currentStatus={order.orderStatus} 
                referenceImage={order.referenceImage}
                onImageClick={(src) => setLightboxSrc(src)}
              />
          </div>
      )}

      <Lightbox 
        src={lightboxSrc} 
        onClose={() => setLightboxSrc(null)} 
        alt={order.title}
      />
    </div>
  );
}
