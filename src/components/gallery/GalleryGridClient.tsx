'use client';

import { useState } from 'react';
import { useGalleryStore } from '@/store/useGalleryStore';
import Image from 'next/image';
import { optimizedUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '@/lib/imageResolver';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  title: string;
  slug: string;
}

interface GalleryItem {
  _id: string;
  title: string;
  imageSource?: string;
  imageUrl?: string;
  image?: string;
  category?: Category; // optional — backward compatible
}

interface GalleryGridClientProps {
  items: GalleryItem[];
  categories?: Category[]; // optional — graceful fallback if not passed
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GalleryGridClient({ items, categories = [] }: GalleryGridClientProps) {
  const { openLightbox } = useGalleryStore();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Resolve image URLs once
  const formattedItems = items.map(item => ({
    ...item,
    imageUrl: getImageUrl(item),
  }));

  // Filter logic — "all" shows everything
  const filteredItems =
    activeCategory === 'all'
      ? formattedItems
      : formattedItems.filter(item => item.category?.slug === activeCategory);

  // Only show filter bar if there are categories to display
  const showFilters = categories.length > 0;

  return (
    <div>
      {/* ── Filter Tabs ──────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 justify-center mb-14">
          {/* All tab */}
          <button
            onClick={() => setActiveCategory('all')}
            className={`
              relative px-6 py-2.5 text-xs uppercase tracking-[0.25em] font-sans
              rounded-full border transition-all duration-300
              ${activeCategory === 'all'
                ? 'bg-ink text-white border-ink shadow-sm'
                : 'bg-transparent text-ink/50 border-ink/20 hover:border-ink/40 hover:text-ink/80'
              }
            `}
          >
            All
          </button>

          {/* Dynamic category tabs */}
          {categories.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className={`
                relative px-6 py-2.5 text-xs uppercase tracking-[0.25em] font-sans
                rounded-full border transition-all duration-300
                ${activeCategory === cat.slug
                  ? 'bg-ink text-white border-ink shadow-sm'
                  : 'bg-transparent text-ink/50 border-ink/20 hover:border-ink/40 hover:text-ink/80'
                }
              `}
            >
              {cat.title}
            </button>
          ))}
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────────────────────── */}
      {filteredItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full h-[40vh] flex flex-col items-center justify-center border border-ink/10 bg-ink/5 rounded-sm shadow-sm gap-3 p-6"
        >
          <p className="font-sans text-sm uppercase tracking-widest text-ink/40 text-center">
            No artworks in this category
          </p>
          <button
            onClick={() => setActiveCategory('all')}
            className="font-sans text-xs uppercase tracking-widest text-ink/30 hover:text-ink/60 underline underline-offset-4 transition-colors duration-200"
          >
            View all works
          </button>
        </motion.div>
      )}

      {/* ── Gallery Grid ─────────────────────────────────────────────────── */}
      <motion.div
        layout
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-10"
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, idx) => {
            if (!item.imageUrl) return null;

            return (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.04, duration: 0.45 }}
                className="group relative flex flex-col gap-6 cursor-pointer"
                onClick={() => openLightbox(item, filteredItems)}
              >
                {/* Framed Image Container */}
                <div className="relative w-full aspect-[4/5] bg-white p-[10px] md:p-[14px] border-[4px] border-ink shadow-lg group overflow-hidden transition-all duration-500 hover:shadow-2xl">
                  {/* Mount Shadow */}
                  <div className="absolute inset-[10px] md:inset-[14px] shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] pointer-events-none z-10" />
                  
                  <div className="relative w-full h-full overflow-hidden bg-ink/[0.02]">
                    <Image
                      src={optimizedUrl(item.imageUrl)}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88eJNPAAIvwNIGP1SswAAAABJRU5ErkJggg=="
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/5 transition-colors duration-500 pointer-events-none" />
                </div>

                <div className="flex justify-between items-center px-2">
                  <div className="flex flex-col gap-1.5">
                    <h2 className="font-serif text-xl md:text-2xl tracking-tight text-ink leading-tight">{item.title}</h2>
                    {item.category?.title && (
                      <span className="font-sans text-[10px] md:text-xs uppercase tracking-[0.2em] text-ink/35">
                        {item.category.title}
                      </span>
                    )}
                  </div>
                  <div className="w-4 h-[1px] bg-ink/30 group-hover:bg-ink group-hover:w-8 transition-all duration-500 flex-shrink-0" />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
