'use client';

import { useGalleryStore } from '@/store/useGalleryStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { optimizedUrl } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { isValidImageSrc } from '@/lib/safeImage';
import { ImageErrorBoundary } from '@/components/ui/ImageErrorBoundary';
import { LikeButton } from './LikeButton';
import { CommentSection } from './CommentSection';

export default function Lightbox() {
  const { lightboxIsOpen, activeArtwork, artworksContext, closeLightbox, nextArtwork, prevArtwork } = useGalleryStore();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (lightboxIsOpen) {
      setIsLoaded(false); // Reset load state when artwork changes
    }
  }, [activeArtwork?._id, lightboxIsOpen]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextArtwork();
    if (e.key === 'ArrowLeft') prevArtwork();
  }, [closeLightbox, nextArtwork, prevArtwork]);

  useEffect(() => {
    if (lightboxIsOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxIsOpen, handleKeyDown]);

  if (!lightboxIsOpen || !activeArtwork) return null;

  const currentIndex = artworksContext.findIndex(a => a._id === activeArtwork._id) + 1;
  const total = artworksContext.length;

  return (
    <AnimatePresence>
      <motion.div
        key="lightbox-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[99999] bg-ink/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-12 cursor-default select-none"
      >
        <button 
          onClick={closeLightbox}
          className="absolute top-6 right-6 md:top-10 md:right-10 text-canvas/50 hover:text-canvas transition-colors z-50 p-2"
        >
          <X size={32} strokeWidth={1} />
        </button>

        {total > 1 && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 text-canvas/50 font-sans text-xs tracking-widest hidden md:block">
            {currentIndex} / {total}
          </div>
        )}

        <div className="relative w-full h-full max-w-7xl flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          
          {total > 1 && (
            <button onClick={prevArtwork} className="hidden md:block absolute left-2 md:left-8 top-1/2 -translate-y-1/2 text-canvas/30 hover:text-canvas transition-colors z-50 p-4">
              <ChevronLeft size={48} strokeWidth={1} />
            </button>
          )}

          <AnimatePresence mode="wait">
            <motion.div 
              key={activeArtwork._id}
              initial={{ scale: 0.95, opacity: 0, filter: 'blur(10px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              exit={{ scale: 1.05, opacity: 0, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full h-[55vh] md:h-full flex-grow flex items-center justify-center"
            >
              <div className="relative w-full h-full flex items-center justify-center">
                {!isLoaded && (
                  <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="w-12 h-12 border-t-2 border-canvas/20 rounded-full animate-spin" />
                  </div>
                )}
                <ImageErrorBoundary>
                  <Image
                    src={optimizedUrl(activeArtwork.imageUrl)}
                    alt={activeArtwork.title || "Artwork"}
                    fill
                    className={`object-contain drop-shadow-[0_0_30px_rgba(0,0,0,0.4)] transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-[0.98] blur-xl'}`}
                    sizes="100vw"
                    placeholder="blur"
                    blurDataURL={activeArtwork.imageLqip || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88eJNPAAIvwNIGP1SswAAAABJRU5ErkJggg=="}
                    onLoad={() => setIsLoaded(true)}
                    priority
                  />
                </ImageErrorBoundary>
              </div>
            </motion.div>
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${activeArtwork._id}-info`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full md:w-96 text-canvas flex flex-col gap-4 text-center md:text-left shrink-0 pb-8 md:pb-0 z-10"
            >
              <h2 className="font-serif text-3xl md:text-4xl tracking-tighter">{activeArtwork.title}</h2>
              <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start text-[10px] md:text-xs uppercase tracking-widest opacity-60">
                <span>{(activeArtwork.category && typeof activeArtwork.category === 'object') ? activeArtwork.category.title : activeArtwork.category}</span>
                {activeArtwork.price && <span>• ₹{activeArtwork.price}</span>}
                <div className="h-3 w-[1px] bg-canvas/30" />
                <LikeButton itemId={activeArtwork._id} initialLikes={activeArtwork.likes} dark />
              </div>
              {activeArtwork.description && (
                <p className="text-xs md:text-sm opacity-80 leading-relaxed font-sans md:mt-4 max-h-[20vh] overflow-y-auto pr-2 scrollbar-hide">
                  {activeArtwork.description}
                </p>
              )}
              {!(activeArtwork._type === 'photography' || activeArtwork.isPhotography === true) && (
                <div className="mt-6 pt-6 border-t border-canvas/10 flex flex-col flex-grow min-h-[300px]">
                  <h3 className="text-[10px] uppercase tracking-widest opacity-40 mb-4 font-bold text-left">Discussion</h3>
                  <CommentSection itemId={activeArtwork._id} initialComments={activeArtwork.comments} dark />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {total > 1 && (
            <button onClick={nextArtwork} className="hidden md:block absolute right-2 md:right-8 top-1/2 -translate-y-1/2 text-canvas/30 hover:text-canvas transition-colors z-50 p-4">
              <ChevronRight size={48} strokeWidth={1} />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
