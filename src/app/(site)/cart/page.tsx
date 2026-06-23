'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/useUIStore';
import { PageTransition } from '@/components/layout/PageTransition';
import JsonLd from '@/components/seo/JsonLd';

const cartSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://thevirtualcanvas.com/cart#webpage",
      "url": "https://thevirtualcanvas.com/cart",
      "name": "Shopping Cart | The Virtual Canvas",
      "description": "View and manage your curated selection of artworks in your shopping cart before proceeding to checkout.",
      "isPartOf": {
        "@id": "https://thevirtualcanvas.com/#website"
      },
      "breadcrumb": {
        "@id": "https://thevirtualcanvas.com/cart/#breadcrumb"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://thevirtualcanvas.com/cart/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://thevirtualcanvas.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Cart",
          "item": "https://thevirtualcanvas.com/cart"
        }
      ]
    }
  ]
};

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
        <JsonLd schema={cartSchema} />
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
      <JsonLd schema={cartSchema} />
      <main className="min-h-screen pt-24 md:pt-40 pb-24 px-4 sm:px-6 md:px-12 max-w-[1200px] mx-auto">
        <header className="mb-10 md:mb-16">
          <p className="font-sans text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-ink/40 mb-2 md:mb-3">Your Collection</p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl tracking-tighter text-ink">
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
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 py-6 sm:py-8 border-b border-ink/8 group"
                >
                  <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden rounded-sm bg-ink/5 border border-ink/10">
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
                          <span className="font-serif text-ink/20 text-[10px]">TVC</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h2 className="font-serif text-base sm:text-lg tracking-tight text-ink leading-tight sm:leading-normal">{item.title}</h2>
                      <p className="font-sans text-[8px] sm:text-[10px] uppercase tracking-widest text-ink/20 mt-1 truncate">ID: {item.artworkId.slice(-8)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <div className="flex items-baseline gap-1 font-serif text-ink">
                      <span className="text-xs sm:text-sm opacity-40 font-sans">₹</span>
                      <p className="text-lg sm:text-xl font-bold">{item.price.toLocaleString()}</p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => {
                        removeFromCart(item.artworkId);
                        addToast(`"${item.title}" removed from cart`, 'info');
                      }}
                      className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-ink/20 hover:text-ink/60 transition-colors border border-ink/5 sm:border-none rounded-full"
                      aria-label="Remove item"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ── Order Summary ─────────────────────────────────────────────── */}
          <div className="w-full lg:w-[360px] flex-shrink-0">
            <div className="sticky top-32 border border-ink/10 p-5 sm:p-8 bg-ink/[0.02] rounded-sm">
              <h2 className="font-sans text-[9px] sm:text-[10px] uppercase tracking-widest text-ink/50 mb-6 sm:mb-8">Order Summary</h2>

              {/* Line items */}
              <div className="flex flex-col gap-3 mb-6">
                {items.map((item) => (
                  <div key={item.artworkId} className="flex justify-between items-baseline text-xs sm:text-sm">
                    <span className="font-serif text-ink/70 truncate max-w-[150px] sm:max-w-[200px]">{item.title}</span>
                    <span className="font-serif text-[10px] sm:text-xs font-bold text-ink/60 flex-shrink-0 ml-4">₹{item.price.toLocaleString()+(item.price % 1 === 0 ? '.00' : '')}</span>
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
                      <span className="font-sans text-xs text-green-700 font-bold tracking-widest">{couponCode.toUpperCase()}</span>
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
                       className="flex-1 bg-transparent border-b border-ink/20 py-2 text-xs font-sans font-bold uppercase outline-none focus:border-ink transition-colors placeholder:tracking-widest placeholder:text-ink/30"
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
                 <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-ink/50">Subtotal</span>
                  <span className="font-serif font-bold text-ink/70">₹{total.toLocaleString()}.00</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-mono">−₹{appliedDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="w-full h-[1px] bg-ink/10 my-2" />
                <div className="flex justify-between items-baseline">
                  <span className="font-serif text-base sm:text-lg text-ink">Total</span>
                  <div className="flex items-baseline gap-1 font-serif text-ink">
                    <span className="text-sm sm:text-base opacity-40 font-sans">₹</span>
                    <span className="text-2xl sm:text-3xl font-bold">{finalTotal.toLocaleString()}</span>
                  </div>
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
