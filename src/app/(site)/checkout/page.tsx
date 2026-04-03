'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useUIStore } from '@/store/useUIStore';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/layout/PageTransition';
import { env } from '@/config/env';
import Link from 'next/link';

function CheckoutInner() {
  const { items, itemCount, clearCart } = useCart();
  const { addToast } = useUIStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const couponFromCart = searchParams.get('coupon') || '';
  const discountFromCart = Number(searchParams.get('discount') || '0');
  const totalFromCart = Number(searchParams.get('total') || '0');

  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const finalTotal = totalFromCart || subtotal;

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load Razorpay script
  useEffect(() => {
    const existing = document.getElementById('rzp-script-checkout');
    if (!existing) {
      const s = document.createElement('script');
      s.id = 'rzp-script-checkout';
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) e.phone = 'Valid phone required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async () => {
    if (!(window as any).Razorpay) {
      addToast('Payment gateway loading... please wait.', 'error');
      return;
    }

    if (!env.NEXT_PUBLIC_RAZORPAY_KEY || env.NEXT_PUBLIC_RAZORPAY_KEY.includes('YOUR_KEY')) {
      addToast('Razorpay key missing in .env.local', 'error');
      return;
    }

    if (itemCount === 0) {
      addToast('Your cart is empty', 'error');
      router.push('/cart');
      return;
    }

    try {
      setIsSubmitting(true);

      // Step 1: Create cart order in Sanity (server re-validates total + coupon)
      const orderRes = await fetch('/api/cart-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.name,
          email: form.email,
          phone: form.phone,
          items,
          clientTotal: finalTotal,
          couponCode: couponFromCart || undefined,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Order creation failed');

      const { orderId, totalAmount } = orderData;

      // Step 2: Create Razorpay order (existing API)
      const payRes = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount, orderId }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error || 'Payment init failed');

      // Step 3: Open Razorpay
      const options = {
        key: env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: payData.amount,
        currency: 'INR',
        name: 'The Virtual Canvas',
        description: `Cart Order ${orderId} — ${itemCount} artwork${itemCount > 1 ? 's' : ''}`,
        order_id: payData.id,
        handler: async (response: any) => {
          // Step 4: Verify payment (existing API)
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, orderId }),
          });

          if (verifyRes.ok) {
            clearCart(); // Clear cart on success
            // Increment coupon usage if applied
            if (couponFromCart) {
              try {
                await fetch('/api/coupon/use', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code: couponFromCart }),
                });
              } catch {}
            }
            addToast('Payment successful! Order confirmed.', 'success');
            router.push(`/cart-success?id=${orderId}&amount=${totalAmount}&count=${itemCount}`);
          } else {
            addToast('Payment verification failed. Check tracking page.', 'error');
            router.push(`/track-order?id=${orderId}`);
          }
        },
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#000000' },
        modal: {
          ondismiss: () => {
            addToast('Payment cancelled. Your order is saved — pay later via Track Order.', 'info');
            router.push(`/track-order?id=${orderId}`);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      addToast(`❌ ${err.message || 'Something went wrong'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (itemCount === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <p className="font-serif text-2xl text-ink/40 mb-6">Your cart is empty</p>
          <Link href="/artworks" className="text-xs uppercase tracking-widest border-b border-ink/20 pb-1 hover:border-ink transition-colors">
            Back to Artworks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-40 pb-24 px-6 md:px-12 max-w-[1100px] mx-auto">
      <header className="mb-16 text-center">
        <h1 className="font-serif text-5xl md:text-6xl tracking-tighter text-ink mb-4">Checkout</h1>
        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-ink/40">{itemCount} artwork{itemCount > 1 ? 's' : ''} • ₹{finalTotal.toLocaleString()}</p>
      </header>

      {/* Step indicator */}
      <div className="flex justify-center gap-8 mb-16">
        {['Your Details', 'Review', 'Payment'].map((label, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-serif transition-all duration-300 ${step > i + 1 ? 'bg-green-600 text-white' : step === i + 1 ? 'bg-ink text-white' : 'bg-transparent border border-ink/20 text-ink/30'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] uppercase tracking-widest hidden md:block transition-colors duration-300 ${step === i + 1 ? 'text-ink' : 'text-ink/30'}`}>{label}</span>
            {i < 2 && <div className="w-8 h-[1px] bg-ink/10" />}
          </div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Customer Info */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h2 className="font-serif text-2xl tracking-tight mb-8">Your Details</h2>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <input
                    type="text" placeholder="Full Name"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-transparent border-b border-ink/20 py-3 outline-none focus:border-ink transition-colors font-sans text-sm"
                  />
                  {errors.name && <span className="text-red-500 text-[10px] uppercase tracking-widest">{errors.name}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <input
                    type="email" placeholder="Email Address"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-transparent border-b border-ink/20 py-3 outline-none focus:border-ink transition-colors font-sans text-sm"
                  />
                  {errors.email && <span className="text-red-500 text-[10px] uppercase tracking-widest">{errors.email}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <input
                    type="tel" placeholder="Phone Number"
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-transparent border-b border-ink/20 py-3 outline-none focus:border-ink transition-colors font-sans text-sm"
                  />
                  {errors.phone && <span className="text-red-500 text-[10px] uppercase tracking-widest">{errors.phone}</span>}
                </div>
              </div>
              <div className="flex justify-between mt-12 pt-8 border-t border-ink/10">
                <Link href="/cart" className="text-[10px] uppercase tracking-widest text-ink/40 hover:text-ink transition-colors">← Back to Cart</Link>
                <button
                  onClick={() => { if (validate()) setStep(2); }}
                  className="px-10 py-4 bg-ink text-white text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  Review Order
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Order Review */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h2 className="font-serif text-2xl tracking-tight mb-8">Order Review</h2>
              <div className="border border-ink/10 rounded-sm overflow-hidden mb-8">
                <div className="p-6 border-b border-ink/10 bg-ink/[0.02]">
                  <p className="text-[10px] uppercase tracking-widest text-ink/40">Billed To</p>
                  <p className="font-serif text-lg text-ink mt-1">{form.name}</p>
                  <p className="font-sans text-xs text-ink/50">{form.email} · {form.phone}</p>
                </div>
                <div className="p-6">
                  <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-4">Artworks</p>
                  {items.map((item) => (
                    <div key={item.artworkId} className="flex justify-between py-2 text-sm">
                      <span className="font-serif text-ink truncate max-w-[300px]">{item.title}</span>
                      <span className="font-mono text-ink/60 flex-shrink-0 ml-4">₹{item.price.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="w-full h-[1px] bg-ink/10 my-4" />
                  {discountFromCart > 0 && (
                    <div className="flex justify-between text-sm text-green-600 mb-2">
                      <span>Coupon Discount ({couponFromCart})</span>
                      <span className="font-mono">−₹{discountFromCart.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-serif text-xl text-ink">Total</span>
                    <span className="font-serif text-2xl text-ink">₹{finalTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="text-[10px] uppercase tracking-widest text-ink/40 hover:text-ink transition-colors">← Edit Details</button>
                <button
                  onClick={() => setStep(3)}
                  className="px-10 py-4 bg-ink text-white text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  Continue to Payment
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h2 className="font-serif text-2xl tracking-tight mb-8">Secure Payment</h2>
              <div className="border border-ink/10 p-8 bg-ink/[0.02] flex flex-col items-center gap-6 text-center mb-8">
                <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="font-serif text-3xl text-ink">₹{finalTotal.toLocaleString()}</p>
                  <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-2">
                    {itemCount} artwork{itemCount > 1 ? 's' : ''} · Secured via Razorpay
                  </p>
                </div>
                <div className="flex gap-4 text-[9px] uppercase tracking-widest text-ink/30">
                  <span>All Cards</span><span>·</span><span>UPI</span><span>·</span><span>Net Banking</span>
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-[10px] uppercase tracking-widest text-ink/40 hover:text-ink transition-colors">← Review Order</button>
                <button
                  onClick={handlePay}
                  disabled={isSubmitting}
                  className={`px-10 py-4 text-white text-[10px] uppercase tracking-widest transition-all ${isSubmitting ? 'bg-ink/40 cursor-not-allowed' : 'bg-ink hover:opacity-90'}`}
                >
                  {isSubmitting ? 'Processing...' : `Pay ₹${finalTotal.toLocaleString()}`}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-screen pt-40 flex items-center justify-center"><p className="text-ink/40 text-xs uppercase tracking-widest">Loading checkout...</p></div>}>
        <CheckoutInner />
      </Suspense>
    </PageTransition>
  );
}
