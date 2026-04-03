'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/useUIStore';
import { PageTransition } from '@/components/layout/PageTransition';

export default function CartPage() {
  const { items, removeFromCart, total, itemCount } = useCart();
  const { addToast } = useUIStore();
  const router = useRouter();

  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponResult, setCouponResult] = useState<{
    valid: boolean;
    discountAmount?: number;
    discountedTotal?: number;
    message: string;
  } | null>(null);

  const appliedDiscount = couponResult?.valid ? (couponResult.discountAmount ?? 0) : 0;
  const finalTotal = couponResult?.valid ? (couponResult.discountedTotal ?? total) : total;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponResult(null);
    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), total }),
      });
      const data = await res.json();
      setCouponResult(data);
      if (data.valid) {
        addToast(data.message, 'success');
      } else {
        addToast(data.message, 'error');
      }
    } catch {
      addToast('Failed to apply coupon. Try again.', 'error');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponResult(null);
    setCouponCode('');
    addToast('Coupon removed', 'info');
  };

  if (itemCount === 0) {
    return (
      <PageTransition>
        <main className="min-h-[85vh] flex flex-col items-center justify-center px-6 pt-32 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-8 text-center"
          >
            <div className="w-24 h-24 border border-ink/10 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-ink/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h1 className="font-serif text-4xl md:text-5xl tracking-tighter text-ink mb-3">Your Cart is Empty</h1>
              <p className="font-sans text-xs uppercase tracking-widest text-ink/40">Discover artworks and add them to your collection</p>
            </div>
            <Link
              href="/artworks"
              className="px-10 py-4 bg-ink text-white text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Explore Artworks
            </Link>
          </motion.div>
        </main>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <main className="min-h-screen pt-40 pb-24 px-6 md:px-12 max-w-[1200px] mx-auto">
        <header className="mb-16">
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-ink/40 mb-3">Your Collection</p>
          <h1 className="font-serif text-5xl md:text-6xl tracking-tighter text-ink">
            Cart <span className="text-ink/30">({itemCount})</span>
          </h1>
        </header>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* ── Item List ─────────────────────────────────────────────────── */}
          <div className="flex-1">
            <AnimatePresence mode="popLayout">
              {items.map((item, idx) => (
                <motion.div
                  key={item.artworkId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-6 py-8 border-b border-ink/8 group"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-sm bg-ink/5 border border-ink/10">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-serif text-ink/20 text-xs">TVC</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-serif text-lg tracking-tight text-ink truncate">{item.title}</h2>
                    <p className="font-mono text-xs text-ink/40 mt-1 truncate">{item.artworkId}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-serif text-xl text-ink">₹{item.price.toLocaleString()}</p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => {
                      removeFromCart(item.artworkId);
                      addToast(`"${item.title}" removed from cart`, 'info');
                    }}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-ink/20 hover:text-ink/60 transition-colors"
                    aria-label="Remove item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ── Order Summary ─────────────────────────────────────────────── */}
          <div className="w-full lg:w-[360px] flex-shrink-0">
            <div className="sticky top-32 border border-ink/10 p-8 bg-ink/[0.02] rounded-sm">
              <h2 className="font-sans text-[10px] uppercase tracking-widest text-ink/50 mb-8">Order Summary</h2>

              {/* Line items */}
              <div className="flex flex-col gap-3 mb-6">
                {items.map((item) => (
                  <div key={item.artworkId} className="flex justify-between text-sm">
                    <span className="font-serif text-ink/70 truncate max-w-[200px]">{item.title}</span>
                    <span className="font-mono text-ink/60 flex-shrink-0 ml-4">₹{item.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="w-full h-[1px] bg-ink/10 mb-6" />

              {/* Coupon */}
              <div className="mb-6">
                <p className="font-sans text-[10px] uppercase tracking-widest text-ink/40 mb-3">Coupon Code</p>
                {couponResult?.valid ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-sm">
                    <div>
                      <span className="font-mono text-xs text-green-700 font-bold">{couponCode.toUpperCase()}</span>
                      <p className="text-[10px] text-green-600 mt-0.5">−₹{appliedDiscount.toLocaleString()} applied</p>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-green-500 hover:text-green-700 text-xs">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ENTER CODE"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      className="flex-1 bg-transparent border-b border-ink/20 py-2 text-xs font-mono uppercase outline-none focus:border-ink transition-colors placeholder:tracking-widest placeholder:text-ink/30"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="text-[10px] uppercase tracking-widest text-ink hover:opacity-70 transition-opacity disabled:opacity-30 whitespace-nowrap"
                    >
                      {applyingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponResult && !couponResult.valid && (
                  <p className="text-red-500 text-[10px] mt-2">{couponResult.message}</p>
                )}
              </div>

              {/* Totals */}
              <div className="flex flex-col gap-2 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-ink/50">Subtotal</span>
                  <span className="font-mono">₹{total.toLocaleString()}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-mono">−₹{appliedDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="w-full h-[1px] bg-ink/10 my-2" />
                <div className="flex justify-between">
                  <span className="font-serif text-lg text-ink">Total</span>
                  <span className="font-serif text-2xl text-ink">₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() =>
                  router.push(
                    `/checkout?${couponResult?.valid
                      ? `coupon=${couponCode}&discount=${appliedDiscount}&total=${finalTotal}`
                      : `total=${total}`}`
                  )
                }
                className="w-full py-5 bg-ink text-white text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Proceed to Checkout →
              </button>

              <Link
                href="/artworks"
                className="block text-center mt-4 text-[10px] uppercase tracking-widest text-ink/30 hover:text-ink/60 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
