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

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', pincode: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Coupon States (initialized from search params if present)
  const [couponInput, setCouponInput] = useState(couponFromCart);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    freeDelivery?: boolean;
  } | null>(
    couponFromCart ? { code: couponFromCart, discountAmount: discountFromCart } : null
  );
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [currentFinalTotal, setCurrentFinalTotal] = useState(totalFromCart || subtotal);

  // Shipping States
  const [shippingCharges, setShippingCharges] = useState(0);
  const [shippingZoneName, setShippingZoneName] = useState('');
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  // Dynamic Shipping Calculation when Pincode changes
  useEffect(() => {
    const cleanPin = form.pincode.replace(/\D/g, '');
    if (cleanPin.length === 6) {
      const fetchShipping = async () => {
        try {
          setIsCalculatingShipping(true);
          const res = await fetch('/api/shipping/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pincode: cleanPin, subtotal }),
          });
          const data = await res.json();
          if (res.ok) {
            setShippingCharges(data.rate);
            setShippingZoneName(data.zoneName);
          }
        } catch (err) {
          console.error('Failed to calculate shipping:', err);
        } finally {
          setIsCalculatingShipping(false);
        }
      };
      fetchShipping();
    } else {
      setShippingCharges(0);
      setShippingZoneName('');
    }
  }, [form.pincode, subtotal]);

  // Sync final total whenever appliedCoupon, subtotal, or shippingCharges changes
  useEffect(() => {
    const finalShipping = appliedCoupon?.freeDelivery ? 0 : shippingCharges;
    if (appliedCoupon) {
      setCurrentFinalTotal(Math.max(0, subtotal - appliedCoupon.discountAmount + finalShipping));
    } else {
      setCurrentFinalTotal(subtotal + finalShipping);
    }
  }, [subtotal, appliedCoupon, shippingCharges]);

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
    if (!form.address.trim() || form.address.length < 10) e.address = 'Full shipping address required';
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode)) e.pincode = 'Invalid 6-digit pin code';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    
    try {
      setIsValidatingCoupon(true);
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput, total: subtotal }),
      });
      
      const data = await res.json();
      
      if (data.valid) {
        setAppliedCoupon({
          code: couponInput.trim().toUpperCase(),
          discountAmount: data.discountAmount,
          freeDelivery: Boolean(data.freeDelivery)
        });
        addToast(data.message, 'success');
      } else {
        addToast(data.message || 'Invalid coupon code', 'error');
      }
    } catch (err) {
      addToast('Failed to validate coupon', 'error');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    addToast('Coupon removed', 'info');
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
          address: form.address,
          pincode: form.pincode,
          items,
          clientTotal: currentFinalTotal,
          couponCode: appliedCoupon?.code || undefined,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Order creation failed');

      const { orderId, totalAmount } = orderData;

      // Step 2: Create Razorpay order (existing API)
      const payRes = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount, orderId, couponCode: appliedCoupon?.code }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error || 'Payment init failed');

      // Step 3: Open Razorpay
      const options = {
        key: env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: payData.amount,
        currency: 'INR',
        name: 'The Virtual Canvas',
        description: `Order ${orderId} - ${itemCount} item${itemCount > 1 ? 's' : ''}`,
        order_id: payData.id,
        handler: async (response: any) => {
          // Step 4: Verify payment (existing API)
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, orderId }),
          });

          if (verifyRes.ok) {
            clearCart(); 
            if (appliedCoupon?.code) {
              try {
                await fetch('/api/coupon/use', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code: appliedCoupon.code }),
                });
              } catch {}
            }
            addToast('Payment successful!', 'success');
            const successUrl = `/cart-success?id=${encodeURIComponent(orderId)}&amount=${totalAmount}&count=${itemCount}`;
            router.push(successUrl);
          } else {
            addToast('Payment verification failed.', 'error');
            router.push(`/track-order?id=${encodeURIComponent(orderId)}`);
          }
        },
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#000000' },
        modal: {
          ondismiss: () => {
            addToast('Payment cancelled.', 'info');
            router.push(`/track-order?id=${encodeURIComponent(orderId)}`);
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
        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-ink/40">{itemCount} artwork{itemCount > 1 ? 's' : ''} • ₹{currentFinalTotal.toLocaleString()}</p>
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
                <div className="flex flex-col gap-1">
                  <textarea
                    placeholder="Shipping Address"
                    value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                    rows={2}
                    className="w-full bg-transparent border-b border-ink/20 py-3 outline-none focus:border-ink transition-colors font-sans text-sm resize-none"
                  />
                  {errors.address && <span className="text-red-500 text-[10px] uppercase tracking-widest">{errors.address}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <input
                    type="text" placeholder="Pin Code"
                    value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    maxLength={6}
                    className="w-full bg-transparent border-b border-ink/20 py-3 outline-none focus:border-ink transition-colors font-sans text-sm font-mono tracking-widest"
                  />
                  {errors.pincode && <span className="text-red-500 text-[10px] uppercase tracking-widest">{errors.pincode}</span>}
                  {isCalculatingShipping && (
                    <span className="text-ink/40 text-[9px] uppercase tracking-wider animate-pulse mt-1">Calculating delivery charges...</span>
                  )}
                  {!isCalculatingShipping && shippingZoneName && (
                    <span className="text-emerald-600 text-[9px] uppercase tracking-wider font-bold mt-1 inline-flex items-center gap-1">
                      Delivery Zone: {shippingZoneName} (
                      {appliedCoupon?.freeDelivery ? (
                        <>
                          <span className="line-through text-ink/40 font-normal">₹{shippingCharges}</span>
                          <span className="ml-1">FREE (Promo) ✓</span>
                        </>
                      ) : (shippingCharges === 0 ? 'Free Shipping Applied ✓' : `+₹${shippingCharges}`)}
                      )
                    </span>
                  )}
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
                  <p className="font-sans text-xs text-ink/50 leading-relaxed">
                    {form.email} · {form.phone}<br/>
                    <span className="opacity-70">{form.address}</span> · <span className="font-mono">{form.pincode}</span>
                  </p>
                </div>
                <div className="p-6">
                  <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-4">Artworks</p>
                  {items.map((item) => (
                     <div key={item.artworkId} className="flex justify-between py-2 text-sm">
                      <span className="font-serif text-ink truncate max-w-[300px]">{item.title}</span>
                      <span className="font-serif text-ink/70 font-bold flex-shrink-0 ml-4">₹{item.price.toLocaleString()}.00</span>
                    </div>
                  ))}
                  
                  {/* Coupon Section directly in Review */}
                  <div className="mt-8 pt-6 border-t border-ink/5">
                    <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-3">Apply Promotion</p>
                    {!appliedCoupon ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="ENTER CODE"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          className="flex-1 bg-transparent border-b border-ink/20 py-2 text-xs font-sans font-bold uppercase outline-none focus:border-ink transition-colors placeholder:tracking-widest placeholder:text-ink/30"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={isValidatingCoupon || !couponInput.trim()}
                          className="text-[10px] uppercase tracking-widest text-ink font-bold hover:opacity-70 transition-opacity disabled:opacity-30 whitespace-nowrap"
                        >
                          {isValidatingCoupon ? 'Checking...' : 'Apply'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-green-50/50 border border-green-100 rounded-sm">
                        <div className="flex items-center gap-3">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                           <span className="font-sans text-xs text-green-700 font-bold tracking-widest">{appliedCoupon.code}</span>
                        </div>
                        <button onClick={removeCoupon} className="text-red-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-widest transition-colors">
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="w-full h-[1px] bg-ink/10 my-6" />
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-ink/40">Subtotal</span>
                      <span className="font-serif text-ink/60">₹{subtotal.toLocaleString()}.00</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="font-sans text-[10px] uppercase font-bold tracking-widest">Coupon Savings</span>
                        <span className="font-serif font-bold text-green-700">−₹{appliedCoupon.discountAmount.toLocaleString()}.00</span>
                      </div>
                    )}
                    {form.pincode.replace(/\D/g, '').length === 6 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-ink/40">Delivery ({shippingZoneName || 'Calculating...'})</span>
                        <span className="font-serif text-ink/65 font-semibold">
                          {appliedCoupon?.freeDelivery ? (
                            <>
                              <span className="line-through text-ink/40 font-normal text-xs mr-1.5">₹{shippingCharges.toLocaleString()}.00</span>
                              <span className="text-emerald-700 font-bold">FREE (Promo)</span>
                            </>
                          ) : (shippingCharges === 0 ? 'FREE' : `+₹${shippingCharges.toLocaleString()}.00`)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between mt-2 pt-4 border-t border-ink/5">
                      <span className="font-serif text-xl text-ink">Total</span>
                      <span className="font-serif text-2xl text-ink font-bold">₹{currentFinalTotal.toLocaleString()}</span>
                    </div>
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
                  <p className="font-serif text-3xl text-ink">₹{currentFinalTotal.toLocaleString()}</p>
                  <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-2">
                    {itemCount} artwork{itemCount > 1 ? 's' : ''} · Secured via Razorpay
                  </p>
                  {appliedCoupon && (
                    <p className="text-[9px] text-green-600 font-bold uppercase tracking-widest mt-1">₹{appliedCoupon.discountAmount.toLocaleString()} Discount Applied ✓</p>
                  )}
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
                  {isSubmitting ? 'Processing...' : `Pay ₹${currentFinalTotal.toLocaleString()}`}
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
