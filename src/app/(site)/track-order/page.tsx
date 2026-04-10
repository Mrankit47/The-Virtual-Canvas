'use client';

import { useState, useEffect, Suspense } from 'react';
import { PageTransition } from '@/components/layout/PageTransition';
import { getOrderTracking } from '@/app/actions/trackOrder';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { env } from '@/config/env';

function TrackOrderInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialId = searchParams.get('id') || '';
  
  const [trackingId, setTrackingId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialId) handleTrack(initialId);
    
    // Load Razorpay Script
    const existingScript = document.getElementById('razorpay-checkout-js');
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = 'razorpay-checkout-js';
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [initialId]);

  const handleTrack = async (idToTrack: string) => {
    if (!idToTrack) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await getOrderTracking(idToTrack);
      if (res.error) setError(res.error);
      else setOrder(res.data);
    } catch {
      setError("❌ Unexpected tracking error collapsed.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-Trigger Payment for high-conversion redirects
  useEffect(() => {
    if (order && searchParams.get('pay') === 'true' && order.paymentStatus !== 'paid') {
      handlePayment();
      // Remove param from URL
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('pay');
      router.replace(`/track-order?id=${order.orderId}`);
    }
  }, [order, searchParams]);

  const handlePayment = async () => {
    if (!order) return;
    
    if (!(window as any).Razorpay) {
      alert("Razorpay SDK not loaded yet. Please wait a moment or refresh the page.");
      return;
    }

    if (!env.NEXT_PUBLIC_RAZORPAY_KEY || env.NEXT_PUBLIC_RAZORPAY_KEY.includes('YOUR_KEY')) {
      alert("Razorpay Public Key is missing. Please check your configuration.");
      return;
    }

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: order.price,
          orderId: order.orderId
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const options = {
        key: env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: data.amount,
        currency: "INR",
        name: "The Virtual Canvas",
        description: `Payment for Order ${order.orderId}`,
        order_id: data.id,
        handler: async function (response: any) {
          await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, orderId: order.orderId })
          });
          window.location.reload();
        },
        prefill: {
          name: order.customerName,
          email: order.email || '',
          contact: order.phone || ''
        },
        theme: { color: "#000000" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      alert(error.message || "An unexpected error occurred during payment.");
    }
  };

  // Status step logic
  const stepMap: Record<string, number> = {
    pending: 1,
    discussion: 2,
    progress: 3,
    in_progress: 3,
    review: 4,
    completed: 5
  };

  return (
    <main className="min-h-[85vh] flex flex-col items-center pt-40 px-6 max-w-2xl mx-auto">
      <h1 className="font-serif text-5xl tracking-tighter mb-4 text-ink">Track Order</h1>
      <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] opacity-60 mb-12 text-center">
        Enter your ID to view production status
      </p>

      <form onSubmit={(e) => { e.preventDefault(); handleTrack(trackingId); router.push(`/track-order?id=${trackingId}`); }} className="w-full flex gap-2 mb-12 relative shadow-sm">
        <input 
          type="text" 
          placeholder="e.g TVC-481-9921" 
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
          className="flex-1 bg-ink/5 border border-ink/20 py-4 px-6 outline-none focus:border-ink transition-colors font-sans text-sm uppercase tracking-widest placeholder:normal-case shadow-inner"
        />
        <button type="submit" disabled={loading || !trackingId} className="bg-ink text-canvas px-8 text-[10px] uppercase tracking-widest hover:bg-ink/80 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[140px]">
          {loading ? 'Locating...' : 'Track Order'}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="w-full space-y-4">
             <div className="w-full h-40 bg-ink/5 animate-pulse border border-ink/10"></div>
          </motion.div>
        )}
        
        {error && (
          <motion.div key="error" initial={{opacity:0, y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="w-full p-8 border border-red-500/30 bg-red-500/5 text-red-700 text-xs text-center font-medium flex flex-col items-center gap-4">
            <span>{error}</span>
            <button onClick={() => handleTrack(trackingId)} className="border border-red-700/50 px-6 py-3 text-[10px] uppercase tracking-widest hover:bg-red-700 hover:text-white transition-colors">Retry Query</button>
          </motion.div>
        )}

        {order && (
          <motion.div key="result" initial={{opacity:0, y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="w-full bg-ink/5 p-8 md:p-12 border border-ink/10 shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-ink/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
             
             <div className="flex justify-between items-start mb-8 border-b border-ink/10 pb-8">
               <div>
                 <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Customer</p>
                 <h2 className="font-serif text-2xl tracking-tight capitalize">{order.customerName}</h2>
               </div>
               <div className="text-right">
                 <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Order ID</p>
                 <p className="font-sans font-medium text-sm tracking-tight text-ink/80 bg-ink/5 px-3 py-1 border border-ink/10">{order.orderId}</p>
               </div>
             </div>

             <div className="flex flex-col gap-6">
               <div className="mb-4">
                 <p className="text-[10px] uppercase tracking-widest opacity-50 mb-8 border-b border-ink/10 pb-2">Production Timeline</p>
                 <div className="w-full flex justify-between items-start relative px-2 md:px-0">
                   <div className="absolute top-[10px] left-0 w-full h-[2px] bg-ink/10 -z-10"></div>
                   {[
                     { id: 'pending', label: 'Pending' },
                     { id: 'discussion', label: 'Discussion' },
                     { id: 'progress', label: 'In Progress' },
                     { id: 'review', label: 'Review' },
                     { id: 'completed', label: 'Completed' }
                   ].map((step, idx) => {
                     const currentStep = stepMap[order.orderStatus] || 1;
                     const active = idx < currentStep;
                     const pulse = idx === (currentStep - 1) && step.id !== 'completed';
                     return (
                       <div key={step.id} className="flex flex-col items-center gap-4 relative bg-transparent">
                         <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-[3px] flex items-center justify-center ${active ? 'bg-ink border-transparent' : 'bg-canvas border-ink/20'}`}>
                           {active && <div className={`w-2 h-2 bg-white rounded-full ${pulse ? 'animate-ping' : ''}`}></div>}
                         </div>
                         <span className={`text-[7px] md:text-[9px] uppercase tracking-widest font-bold text-center w-12 md:w-20 leading-relaxed ${active ? 'opacity-100' : 'opacity-40'}`}>{step.label}</span>
                       </div>
                     )
                   })}
                 </div>
               </div>

               <div className="flex justify-between items-center mt-4 bg-canvas/40 p-6 border border-ink/5">
                 <div>
                   <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Final Price</p>
                   <p className="font-serif text-3xl md:text-4xl">₹{order.price}.00</p>
                 </div>
                 <div className="text-right">
                   {order.paymentStatus === 'paid' ? (
                     <span className="text-[10px] uppercase tracking-widest font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full border border-green-200">✓ Paid</span>
                   ) : (
                     <button onClick={handlePayment} className="bg-ink text-canvas px-6 py-3 text-[10px] uppercase tracking-widest hover:bg-ink group relative">
                       <span className="relative z-10">Pay with Razorpay</span>
                     </button>
                   )}
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-ink/10 bg-white/50">
                      <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Status</p>
                      <p className="text-xs font-bold uppercase">{order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</p>
                  </div>
                  <div className="p-4 border border-ink/10 bg-white/50">
                      <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Date</p>
                      <p className="text-xs font-mono">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function TrackOrderPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="pt-40 text-center uppercase tracking-widest text-[10px] opacity-40">Loading...</div>}>
         <TrackOrderInner />
      </Suspense>
    </PageTransition>
  );
}
