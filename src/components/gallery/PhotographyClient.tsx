'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SanityImage } from '@/components/ui/SanityImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGalleryStore } from '@/store/useGalleryStore';
import { getImageUrl } from '@/lib/imageResolver';
import { LikeButton } from './LikeButton';

export function PhotographyClient({ photos }: { photos: any[] }) {
  const [mounted, setMounted] = useState(false);
  const [columns, setColumns] = useState(5);
  const [activeCategory, setActiveCategory] = useState('all');
  const { openLightbox } = useGalleryStore();

  // Dynamically extract unique categories from the photos array
  const uniqueCategories = Array.from(new Set(
    photos
      .filter(p => !!p.category)
      .map(p => typeof p.category === 'object' ? p.category.title : p.category)
  )).sort() as string[];

  const filteredPhotos = activeCategory === 'all' 
    ? photos 
    : photos.filter(p => {
        const catValue = typeof p.category === 'object' ? p.category.title : p.category;
        return catValue === activeCategory;
      });

  useEffect(() => { 
    setMounted(true);
    
    // JS-based masonry responsive columns
    const updateColumns = () => {
      if (window.innerWidth >= 1280) setColumns(5);
      else if (window.innerWidth >= 1024) setColumns(4);
      else if (window.innerWidth >= 768) setColumns(3);
      else if (window.innerWidth >= 640) setColumns(2);
      else setColumns(2);
    };
    
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  if (!mounted) {
    return (
      <div className="flex gap-4 md:gap-6 w-full">
        {Array.from({ length: 5 }).map((_, colIdx) => (
          <div key={colIdx} className={`flex flex-col gap-4 md:gap-6 flex-1 min-w-0 ${colIdx > 1 ? 'hidden sm:flex' : ''} ${colIdx > 1 ? 'hidden md:flex' : ''} ${colIdx > 2 ? 'hidden lg:flex' : ''} ${colIdx > 3 ? 'hidden xl:flex' : ''}`}>
             {[1, 2, 3].map(i => (
                <Skeleton key={i} className={`w-full bg-[#1a1a1a] rounded-sm shadow-2xl ${i % 2 === 0 ? 'h-[200px] md:h-[300px]' : 'h-[300px] md:h-[450px]'}`} />
             ))}
          </div>
        ))}
      </div>
    );
  }

  // Handle empty state (after filtering)
  if (filteredPhotos.length === 0) {
    return (
      <div className="flex flex-col w-full">
        {/* Category Filter Bar */}
        <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-16">
          <button onClick={() => setActiveCategory('all')} className={`px-5 py-2 text-[10px] uppercase tracking-[0.25em] rounded-full border transition-all duration-500 ${activeCategory === 'all' ? 'bg-[#f5f5f0] text-[#111] border-[#f5f5f0]' : 'bg-transparent text-[#f5f5f0]/40 border-[#f5f5f0]/10 hover:border-[#f5f5f0]/30 hover:text-[#f5f5f0]/70'}`}>All Captures</button>
          {uniqueCategories.map(cat => (
             <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 text-[10px] uppercase tracking-[0.25em] rounded-full border transition-all duration-500 ${activeCategory === cat ? 'bg-[#f5f5f0] text-[#111] border-[#f5f5f0]' : 'bg-transparent text-[#f5f5f0]/40 border-[#f5f5f0]/10 hover:border-[#f5f5f0]/30 hover:text-[#f5f5f0]/70'}`}>{cat}</button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full h-[40vh] flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 border border-[#f5f5f0]/10 rounded-full flex items-center justify-center mb-8 bg-[#0a0a0a]">
             <span className="font-serif italic opacity-40 text-xs text-[#f5f5f0]">Empty</span>
          </div>
          <h2 className="font-serif text-3xl opacity-80 tracking-tighter text-[#f5f5f0] mb-3">No {activeCategory} photography.</h2>
          <button onClick={() => setActiveCategory('all')} className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-80 underline underline-offset-4">Return to all collections</button>
        </motion.div>
      </div>
    );
  }

  // Distribute photos into columns round-robin (left to right, top to bottom)
  const columnData = Array.from({ length: columns }, () => [] as any[]);
  filteredPhotos.forEach((photo, idx) => {
    columnData[idx % columns].push(photo);
  });

  return (
    <div className="flex flex-col w-full">
      {/* ── Category Filter Bar ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-16 px-1">
        <button
          onClick={() => setActiveCategory('all')}
          className={`
            relative px-5 py-2 text-[10px] uppercase tracking-[0.25em] font-sans
            rounded-full border transition-all duration-500
            ${activeCategory === 'all'
              ? 'bg-[#f5f5f0] text-[#111] border-[#f5f5f0] shadow-2xl'
              : 'bg-transparent text-[#f5f5f0]/40 border-[#f5f5f0]/10 hover:border-[#f5f5f0]/30 hover:text-[#f5f5f0]/70'
            }
          `}
        >
          All Captures
        </button>

        {uniqueCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`
              relative px-5 py-2 text-[10px] uppercase tracking-[0.25em] font-sans
              rounded-full border transition-all duration-500
              ${activeCategory === cat
                ? 'bg-[#f5f5f0] text-[#111] border-[#f5f5f0] shadow-2xl'
                : 'bg-transparent text-[#f5f5f0]/40 border-[#f5f5f0]/10 hover:border-[#f5f5f0]/30 hover:text-[#f5f5f0]/70'
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex gap-4 md:gap-6 w-full items-start"
      >
        <AnimatePresence mode="popLayout">
          {columnData.map((colPhotos, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-4 md:gap-6 flex-1 min-w-0">
              {colPhotos.map((photo: any, idx: number) => {
                const resolvedUrl = getImageUrl(photo);
                const lightboxData = {
                  ...photo,
                  imageUrl: resolvedUrl
                };

                return (
                  <motion.div 
                    layout
                    key={photo._id} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openLightbox(lightboxData, filteredPhotos.map(p => ({ ...p, imageUrl: getImageUrl(p) })))}
                    className="relative w-full overflow-hidden group cursor-pointer shadow-xl bg-[#0a0a0a] rounded-sm"
                  >
                    <SanityImage
                      src={resolvedUrl}
                      alt={photo.title}
                      lqip={photo.imageLqip}
                      priority={idx < 2}
                      className="w-full h-auto object-cover grayscale group-hover:grayscale-0 transition-all duration-700 hover:scale-[1.02]"
                      width={600}
                      height={900}
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    
                    <div className="absolute bottom-0 left-0 w-full p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 flex justify-between items-end gap-4 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none z-10">
                      <div className="flex flex-col gap-1">
                        <h3 className="font-serif text-xl md:text-2xl tracking-tighter text-[#f5f5f0]">{photo.title}</h3>
                        <span className="text-[8px] uppercase tracking-[0.2em] text-[#f5f5f0]/60">
                          {photo.location || (typeof photo.category === 'object' ? photo.category.title : photo.category)}
                        </span>
                      </div>
                      <div className="pointer-events-auto shrink-0 mb-1">
                        <LikeButton itemId={photo._id} initialLikes={photo.likes} dark />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

