'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ArtLoaderProps {
  isVisible?: boolean;
  variant?: 'fullscreen' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ArtLoader = ({ 
  isVisible = true, 
  variant = 'fullscreen', 
  size = 'md',
  className = ''
}: ArtLoaderProps) => {
  
  const sizeMap = {
    sm: 'scale-[0.35] md:scale-[0.5]',
    md: 'scale-[0.6] md:scale-[1]',
    lg: 'scale-[0.8] md:scale-[1.5]',
  };

  const scaleClass = sizeMap[size];

  const content = (
    <div className={`relative flex flex-col items-center justify-center gap-6 ${className}`}>
        {/* NEW CSS LOADER FROM USER */}
        <div className={`loader ${scaleClass}`} />

        {/* Small Ambient Glow for Fullscreen */}
        {variant === 'fullscreen' && (
            <div className="absolute inset-x-0 -bottom-40 flex justify-center opacity-20">
                <div className="w-96 h-96 bg-[#b25712] blur-[150px] rounded-full" />
            </div>
        )}

        {/* Branding Title */}
        {size !== 'sm' && (
            <motion.div
                initial={variant === 'fullscreen' ? { opacity: 0, y: 5 } : { opacity: 1 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-center"
            >
                <h1 className="text-[8px] md:text-xs font-serif tracking-[0.4em] text-[#2c1810] font-playfair uppercase italic font-medium">
                    Virtual Canvas
                </h1>
            </motion.div>
        )}
    </div>
  );

  if (variant === 'inline') {
    return (
        <div className="relative flex items-center justify-center">
            {content}
        </div>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f4f1ea] ${!isVisible ? 'pointer-events-none' : 'pointer-events-auto'}`}
        >
          {content}
          
          {/* HIGH-END LINEN TEXTURE OVERLAY */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.1] mix-blend-multiply"
            style={{
              backgroundImage: `url("https://www.transparenttextures.com/patterns/natural-paper.png")`,
            }}
          />
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `url("https://www.transparenttextures.com/patterns/linen.png")`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ArtLoader;
