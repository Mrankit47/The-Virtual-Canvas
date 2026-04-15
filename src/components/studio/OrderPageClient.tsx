'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudioConfigurator, ArtStyle, SizeOption, PaperType } from './StudioConfigurator';
import CommissionForm from './CommissionForm';

interface OrderPageClientProps {
  styles: ArtStyle[];
  sizes: SizeOption[];
  papers: PaperType[];
}

type Tab = 'studio' | 'commission';

export function OrderPageClient({ styles, sizes, papers }: OrderPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('studio');

  return (
    <main className="min-h-[85vh] w-full relative pt-36 px-4 sm:px-6 md:px-8 pb-24 flex flex-col items-center overflow-x-hidden">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <header className="text-center mb-12 w-full max-w-5xl">
        <AnimatePresence mode="wait">
          {activeTab === 'studio' ? (
            <motion.div key="studio-header" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight break-words mb-4 max-w-[90%] sm:max-w-xl md:max-w-2xl mx-auto text-ink">Custom Artwork Studio</h1>
              <p className="font-sans text-sm sm:text-base md:text-lg uppercase tracking-[0.2em] opacity-50 max-w-[90%] sm:max-w-xl md:max-w-2xl mx-auto">
                Configure your artwork · Live pricing · Secure payment
              </p>
            </motion.div>
          ) : (
            <motion.div key="commission-header" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight break-words mb-4 max-w-[90%] sm:max-w-xl md:max-w-2xl mx-auto text-ink">Commission Masterpiece</h1>
              <p className="font-sans text-sm sm:text-base md:text-lg uppercase tracking-[0.2em] opacity-60 max-w-[90%] sm:max-w-xl md:max-w-2xl mx-auto">
                Request your custom artwork.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Mode Toggle ───────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 border border-ink/10 rounded-full bg-ink/[0.02] mb-16 w-full sm:w-auto max-w-[90%] mx-auto">
        <button
          onClick={() => setActiveTab('studio')}
          className={`px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto rounded-full text-xs sm:text-sm uppercase tracking-widest font-sans transition-all duration-300 ${
            activeTab === 'studio'
              ? 'bg-ink text-white shadow-sm'
              : 'text-ink/40 hover:text-ink/70'
          }`}
        >
          ✦ Studio Configurator
        </button>
        <button
          onClick={() => setActiveTab('commission')}
          className={`px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto rounded-full text-xs sm:text-sm uppercase tracking-widest font-sans transition-all duration-300 ${
            activeTab === 'commission'
              ? 'bg-ink text-white shadow-sm'
              : 'text-ink/40 hover:text-ink/70'
          }`}
        >
          Classic Commission
        </button>
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <div className="w-full max-w-5xl">
        <AnimatePresence mode="wait">
          {activeTab === 'studio' ? (
            <motion.div
              key="studio"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <StudioConfigurator styles={styles} sizes={sizes} papers={papers} />
            </motion.div>
          ) : (
            <motion.div
              key="commission"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Pass pre-fetched styles to commission form */}
              <CommissionForm initialStyles={styles} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
