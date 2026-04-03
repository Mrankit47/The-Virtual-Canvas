'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  artworkId: string;
  title: string;
  price: number;
  imageUrl: string;
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (artworkId: string) => void;
  clearCart: () => void;
  isInCart: (artworkId: string) => boolean;
  itemCount: number;
  total: number;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'tvc_cart';

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // Corrupt storage — reset silently
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or blocked — fail silently
    }
  }, [items, hydrated]);

  const addToCart = useCallback((item: CartItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.artworkId === item.artworkId)) return prev; // Deduplicate
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((artworkId: string) => {
    setItems((prev) => prev.filter((i) => i.artworkId !== artworkId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const isInCart = useCallback(
    (artworkId: string) => items.some((i) => i.artworkId === artworkId),
    [items]
  );

  const itemCount = items.length;
  const total = items.reduce((sum, i) => sum + i.price, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, isInCart, itemCount, total }}>
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a <CartProvider>');
  return ctx;
}
