'use client';

import { useGalleryStore } from '@/store/useGalleryStore';
import { ArtCard } from './ArtCard';
import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/Skeleton';

interface GalleryClientProps {
  initialArtworks: any[];
}

export function GalleryClient({ initialArtworks }: GalleryClientProps) {
  const { selectedCategory, searchQuery, openLightbox } = useGalleryStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredArtworks = useMemo(() => {
    return initialArtworks.filter((art) => {
      const matchesCategory = selectedCategory === 'All' || art.category === selectedCategory;
      const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [initialArtworks, selectedCategory, searchQuery]);

  if (!mounted) {
    return (
      <div className="mt-32 md:mt-40 w-full mb-12 flex gap-8 overflow-hidden px-4 md:px-0">
        {[1, 2, 3].map(i => <Skeleton key={i} className="w-[85vw] md:w-[450px] shrink-0 h-[60vh] md:h-[650px] bg-ink/10" />)}
      </div>
    );
  }

  if (filteredArtworks.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-[50vh] flex flex-col items-center justify-center text-center mt-32 px-4"
      >
        <div className="w-24 h-24 border border-ink/10 rounded-full flex items-center justify-center mb-8 bg-canvas shadow-inner">
           <span className="font-serif italic opacity-40 text-sm">Empty</span>
        </div>
        <h2 className="font-serif text-3xl md:text-5xl opacity-80 tracking-tighter text-ink mb-4">No masterpieces found.</h2>
        <p className="text-[10px] md:text-xs uppercase tracking-widest opacity-60 max-w-sm leading-relaxed">
          Your search returned an empty canvas. Try removing some filters to see the collection.
        </p>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            useGalleryStore.getState().setCategory('All');
            useGalleryStore.getState().setSearchQuery('');
          }} 
          className="mt-10 text-[10px] font-semibold uppercase tracking-[0.2em] border border-ink/20 px-8 py-4 hover:bg-ink hover:text-canvas transition-colors shadow-sm"
        >
          Reset Filters
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="mt-32 md:mt-40 w-full mb-12"
    >
      <div className="flex flex-col md:flex-row gap-12 md:gap-20 items-center md:items-center w-full min-h-[60vh] md:min-h-[75vh] md:overflow-x-auto md:overflow-y-hidden md:snap-x md:snap-mandatory py-4 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
        {filteredArtworks.map((artwork, idx) => (
          <div key={artwork._id} className="md:snap-center shrink-0">
            <ArtCard 
              artwork={artwork} 
              priority={idx < 3} 
              onClick={() => openLightbox(artwork, filteredArtworks)}
            />
          </div>
        ))}
        <div className="hidden md:block w-24 shrink-0 h-full"></div>
      </div>
    </motion.div>
  );
}
