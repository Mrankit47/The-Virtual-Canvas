'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PageTransition } from '@/components/layout/PageTransition';
import JsonLd from '@/components/seo/JsonLd';

const successSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://thevirtualcanvas.com/cart-success#webpage",
      "url": "https://thevirtualcanvas.com/cart-success",
      "name": "Order Confirmed | The Virtual Canvas",
      "description": "Your artwork order has been confirmed successfully.",
      "isPartOf": {
        "@id": "https://thevirtualcanvas.com/#website"
      },
      "breadcrumb": {
        "@id": "https://thevirtualcanvas.com/cart-success/#breadcrumb"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://thevirtualcanvas.com/cart-success/#breadcrumb",
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
          "name": "Cart Success",
          "item": "https://thevirtualcanvas.com/cart-success"
        }
      ]
    }
  ]
};

function SuccessInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id') || '—';
  const amount = searchParams.get('amount') || '0';
  const count = searchParams.get('count') || '1';

  return (
    <main className="min-h-[85vh] flex flex-col items-center justify-center px-6 pt-32 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-2xl flex flex-col items-center text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mb-10"
        >
          <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <h1 className="font-serif text-5xl md:text-6xl tracking-tighter text-ink mb-4">Order Confirmed</h1>
        <p className="font-sans text-xs uppercase tracking-widest text-ink/40 mb-16">
          Your payment was successful. We will begin processing shortly.
        </p>

        {/* Order Details Card */}
        <div className="w-full border border-ink/10 bg-ink/[0.02] p-10 mb-12 grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="font-sans text-[9px] uppercase tracking-widest text-ink/40 mb-2">Order ID</p>
            <p className="font-mono text-xs text-ink break-all">{orderId}</p>
          </div>
          <div>
            <p className="font-sans text-[9px] uppercase tracking-widest text-ink/40 mb-2">Artworks</p>
            <p className="font-serif text-2xl text-ink">{count}</p>
          </div>
          <div>
            <p className="font-sans text-[9px] uppercase tracking-widest text-ink/40 mb-2">Amount Paid</p>
            <p className="font-serif text-2xl text-ink">₹{Number(amount).toLocaleString()}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-12 h-[1px] bg-ink/20 mb-12" />

        {/* CTAs */}
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-sm">
          <Link
            href={`/track-order?id=${orderId}`}
            className="flex-1 py-4 border border-ink/20 text-ink text-[10px] uppercase tracking-widest hover:bg-ink/5 transition-colors text-center"
          >
            Track Order
          </Link>
          <Link
            href="/artworks"
            className="flex-1 py-4 bg-ink text-white text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity text-center"
          >
            Continue Shopping
          </Link>
        </div>

        <p className="mt-12 font-sans text-[9px] text-ink/30 uppercase tracking-widest">
          A receipt has been sent to your email
        </p>
      </motion.div>
    </main>
  );
}

export default function CartSuccessPage() {
  return (
    <PageTransition>
      <JsonLd schema={successSchema} />
      <Suspense fallback={<div className="min-h-screen pt-40 flex items-center justify-center"><p className="text-ink/40 text-xs uppercase tracking-widest">Loading...</p></div>}>
        <SuccessInner />
      </Suspense>
    </PageTransition>
  );
}
