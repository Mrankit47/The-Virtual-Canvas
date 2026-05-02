'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { optimizedUrl } from '@/lib/utils';
import { getImageUrl } from '@/lib/imageResolver';


interface Artwork {
  _id: string;
  title: string;
  imageUrl?: string;
  image?: any;
  imageSource?: string;
  price?: number;
  category?: { title: string };
}


interface ArtCarousel3DProps {
  items: Artwork[];
}

export const ArtCarousel3D: React.FC<ArtCarousel3DProps> = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (!isHovered) {
      timerRef.current = setInterval(nextSlide, 3000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered, nextSlide]);

  if (!items || items.length === 0) return null;

  return (
    <div 
      className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[50vh] min-h-[450px] flex flex-col items-center justify-center overflow-hidden bg-black select-none pt-12 pb-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Depth Enhancement */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_70%)] pointer-events-none" />

      {/* 3D Perspective Container */}
      <div 
        className="relative w-full h-full flex items-center justify-center"
        style={{ perspective: '1400px', transformStyle: 'preserve-3d' }}
      >
        {items.map((item, index) => {
          let offset = index - activeIndex;
          
          // Infinite Loop Logic
          if (offset > items.length / 2) offset -= items.length;
          if (offset < -items.length / 2) offset += items.length;

          const isActive = offset === 0;
          const absOffset = Math.abs(offset);
          
          // Base heights for alignment
          const centerHeight = 320;
          const sideHeight = 260;
          
          // Refined 3D Transform Logic
          // Increased translateX multiplier to 220 to prevent overlap for straight cards
          const translateX = offset * 220;
          // 2nd and 3rd images (offset 1 and 2) are now straight (0 deg) as requested
          const rotateY = absOffset <= 2 ? 0 : offset * -45;
          const scale = 1 - (absOffset * 0.1);
          const opacity = 1 - (absOffset * 0.15);
          const zIndex = 50 - absOffset;
          
          // Precision baseline alignment
          const translateY = isActive ? -30 : 0;

          // Dimensions
          const width = isActive ? 240 : 200;
          const height = isActive ? centerHeight : sideHeight;

          if (absOffset > 7 && !isMobile) return null;

          return (
            <motion.div
              key={item._id}
              initial={false}
              animate={{
                x: isMobile ? (offset * 120) : translateX,
                y: isMobile ? 0 : translateY,
                rotateY: isMobile ? 0 : rotateY,
                scale: isMobile ? (isActive ? 1 : 0.75) : scale,
                opacity: isMobile ? (isActive ? 1 : (absOffset === 1 ? 0.3 : 0)) : (opacity < 0.2 ? 0.2 : opacity),
                zIndex: zIndex,
              }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ 
                transformStyle: 'preserve-3d',
                willChange: 'transform',
                width: isMobile ? '180px' : `${width}px`,
                height: isMobile ? '240px' : `${height}px`
              }}
              className="absolute cursor-pointer"
              onClick={() => setActiveIndex(index)}
            >
              {/* Realistic Floor Reflection - Anchored to Bottom */}
              {!isMobile && (
                <div 
                  className="absolute top-full left-0 w-full h-full mt-[-1px] opacity-[0.35] pointer-events-none"
                  style={{ transform: 'scaleY(-1)' }}
                >
                  <div className="relative w-full h-full overflow-hidden blur-[1px]">
                    <Image 
                      src={optimizedUrl(getImageUrl(item))} 
                      alt="" 
                      fill 
                      className="object-cover"
                    />
                    {/* Softer, more gradual fade for deep reflection */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black" />
                  </div>
                </div>
              )}

              {/* Cinematic Card Element (No Frame) */}
              <div 
                className={`relative w-full h-full transition-all duration-700 overflow-hidden group ${
                  isActive ? 'shadow-[0_25px_60px_rgba(0,0,0,0.8)] scale-[1.05]' : 'shadow-2xl opacity-80'
                }`}
              >
                <Image
                  src={optimizedUrl(getImageUrl(item))}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  sizes="(max-width: 1024px) 240px, 240px"
                  priority={isActive}
                />

                {/* Center Image Overlay */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white"
                    >
                      <motion.h3 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="font-serif text-2xl mb-2 tracking-tight"
                      >
                        {item.title}
                      </motion.h3>
                      
                      {item.price && (
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="flex flex-col items-center gap-4 mt-4"
                        >
                          <span className="font-serif text-xl italic font-light">₹{item.price.toLocaleString()}</span>
                          <button className="px-6 py-2 bg-white text-black rounded-full text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/90 transition-all hover:scale-105 active:scale-95">
                            Acquire Piece
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Indicators & Controls */}
      <div className="mt-4 flex flex-col items-center gap-6 z-10">
        <div className="flex gap-3">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-[1px] transition-all duration-700 ${
                idx === activeIndex ? 'bg-white w-10' : 'bg-white/10 w-3 hover:bg-white/30'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-10">
          <button onClick={prevSlide} className="group text-white/20 hover:text-white transition-colors">
            <ChevronLeft size={28} className="group-hover:-translate-x-2 transition-transform" />
          </button>
          <button onClick={nextSlide} className="group text-white/20 hover:text-white transition-colors">
            <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
