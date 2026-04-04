'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/useUIStore';
import { useCart } from '@/context/CartContext';
import { env } from '@/config/env';
import Link from 'next/link';

interface OrderButtonProps {
  artworkId: string;
  title: string;
  price: number;
  imageUrl?: string; // optional — used for cart thumbnail
}

export function OrderButton({ artworkId, title, price, imageUrl = '' }: OrderButtonProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const { addToast } = useUIStore();
  const { addToCart, isInCart } = useCart();
  const router = useRouter();

  const inCart = isInCart(artworkId);

  const handleOrder = async () => {
    // Phase 1: Authentication Guard
    if (!session) {
      addToast('Please sign in to buy this artwork.', 'info');
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
      router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }

    try {
      setLoading(true);
      // Phase 2: Add to Cart and Redirect to Checkout
      // This ensures the user can enter Name/Email/Phone and Promo Code before paying.
      addToCart({ artworkId, title, price, imageUrl });
      addToast('Redirecting to secure checkout...', 'success');
      router.push('/checkout');
    } catch (err: any) {
      console.error(err);
      addToast('Error initiating checkout. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    addToCart({ artworkId, title, price, imageUrl });
    addToast(`"${title}" added to cart`, 'success');
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Existing direct buy button — UNCHANGED */}
      <button
        onClick={handleOrder}
        disabled={loading}
        className={`w-full py-6 text-[10px] md:text-xs uppercase tracking-[0.4em] font-bold transition-all duration-300 relative group overflow-hidden ${
          loading ? 'bg-ink/20 cursor-not-allowed' : 'bg-ink text-canvas hover:opacity-90 active:scale-[0.98]'
        }`}
      >
        <span className="relative z-10">{loading ? 'Processing...' : 'Buy now'}</span>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
      </button>

      {/* NEW: Add to Cart button */}
      {inCart ? (
        <Link
          href="/cart"
          className="w-full py-4 border border-ink/20 text-ink text-[10px] uppercase tracking-[0.35em] font-bold transition-all duration-300 hover:border-ink flex items-center justify-center gap-2"
        >
          <span className="text-green-600">✓</span> In Cart — View Cart
        </Link>
      ) : (
        <button
          onClick={handleAddToCart}
          className="w-full py-4 border border-ink/20 text-ink text-[10px] uppercase tracking-[0.35em] font-bold transition-all duration-300 hover:border-ink hover:bg-ink/5 active:scale-[0.98]"
        >
          Add to Cart
        </button>
      )}
    </div>
  );
}

