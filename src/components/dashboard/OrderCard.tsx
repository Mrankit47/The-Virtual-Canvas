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
import { motion } from "framer-motion";
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
    <div className="bg-white rounded-3xl border border-ink/5 overflow-hidden hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] transition-all duration-500">
      <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            {/* Info Section */}
            <div className="flex gap-6 items-center w-full md:w-auto">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl ${currentStatus.bg} flex items-center justify-center relative overflow-hidden group shadow-inner shadow-black/5`}>
                {displayImage ? (
                    <div 
                      className="relative w-full h-full cursor-zoom-in"
                      onClick={() => setLightboxSrc(displayImage)}
                    >
                      <Image 
                        src={displayImage} 
                        alt={order.title || 'Artwork'} 
                        fill
                        className="object-cover rounded-2xl transition-transform duration-1000 group-hover:scale-110" 
                      />
                      {!order.artworkUrl && order.referenceImage && (
                        <div className="absolute inset-0 bg-ink/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                          <span className="text-[8px] text-white font-extrabold uppercase tracking-widest text-center px-1">Ref.</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                ) : (
                    <IconImage size={28} className={`${currentStatus.text} opacity-20`} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[9px] font-mono font-extrabold text-ink/30 px-2.5 py-1 bg-ink/5 rounded-full border border-ink/5 uppercase tracking-tighter">
                    #{order.orderId?.slice(-8).toUpperCase() || 'NEW'}
                  </span>
                  <span className={`text-[9px] uppercase font-extrabold tracking-widest px-2.5 py-1 rounded-full ${currentStatus.bg} ${currentStatus.text} border border-current opacity-70`}>
                    {String(order.orderStatus || 'pending').replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-ink truncate leading-tight">
                  {order.title || (typeof order.artworkType === 'string' ? order.artworkType : order.artworkType?.title) || 'Studio Commission'}
                </h3>
                <p className="text-[10px] uppercase tracking-widest text-ink/30 font-extrabold mt-1.5 flex items-center gap-2">
                  <Clock size={10} className="opacity-50" />
                  {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Progress Visual */}
            <div className="w-full md:w-64 space-y-4">
                <div className="flex justify-between items-end px-1">
                    <span className="text-[10px] uppercase font-extrabold text-ink/20 tracking-[0.2em]">Build Progress</span>
                    <span className="text-xs font-serif font-bold text-ink italic">{progressPercent}%</span>
                </div>
                <div className="h-2 w-full bg-ink/5 rounded-full overflow-hidden p-[1px] border border-ink/5 shadow-inner">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className={`h-full rounded-full transition-all duration-1000 ${order.orderStatus === 'completed' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-ink shadow-[0_0_15px_rgba(0,0,0,0.1)]'}`}
                    />
                </div>
            </div>

            {/* Price & Primary Action */}
            <div className="flex items-center gap-8 justify-between w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-ink/5">
                <div className="text-left md:text-right shrink-0">
                    <p className="text-[9px] uppercase tracking-widest font-extrabold opacity-20 mb-1">Total Valuation</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xs opacity-30 font-serif">₹</span>
                        <p className="text-2xl font-serif font-bold text-ink tracking-tighter">{(order.price || order.totalAmount || 0).toLocaleString()}</p>
                    </div>
                </div>

                {role === 'user' && order.orderStatus === 'pending' && (
                    <button
                        onClick={handlePayment}
                        disabled={isPaying}
                        className="group relative flex items-center gap-3 px-8 py-4 bg-ink text-white rounded-2xl text-[10px] font-extrabold uppercase tracking-[0.2em] transition-all hover:shadow-2xl active:scale-95 disabled:opacity-30 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {isPaying ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={16} />}
                        <span>Execute Payment</span>
                    </button>
                )}

                {role === 'artist' && (
                    <button
                        onClick={() => setIsUpdating(!isUpdating)}
                        className="group relative flex items-center gap-3 px-8 py-4 bg-ink text-white rounded-2xl text-[10px] font-extrabold uppercase tracking-[0.2em] transition-all hover:shadow-2xl active:scale-95 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {isUpdating ? 'Close Studio Form' : 'Update Masterwork'}
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

      {isExpanded && (order.address || order.pincode) && (
          <div className="px-8 pb-8 bg-gray-50/20">
              <div className="p-6 bg-white border border-ink/5 rounded-2xl shadow-sm">
                  <p className="text-[10px] uppercase tracking-widest font-extrabold opacity-20 mb-3 border-b border-ink/5 pb-2">Shipping Information</p>
                  <div className="flex flex-col gap-1.5">
                      <p className="text-xs text-ink/70 leading-relaxed font-medium capitalize prose prose-sm">{order.address || 'Address information missing'}</p>
                      <p className="text-[9px] font-mono font-extrabold text-ink/40 tracking-[0.2em] mt-1 bg-ink/5 w-fit px-3 py-1 rounded-sm border border-ink/5">
                        PINCODE: {order.pincode || '000000'}
                      </p>
                  </div>
              </div>
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
