'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Download } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';

interface LightboxProps {
  src: string | null;
  onClose: () => void;
  alt?: string;
}

export default function Lightbox({ src, onClose, alt }: LightboxProps) {
  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent scroll when open
  useEffect(() => {
    if (src) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [src]);

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-10"
          onClick={onClose}
        >
          {/* Close Button */}
          <motion.button
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          >
            <X size={24} />
          </motion.button>

          {/* Action Header */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-6 left-6 flex items-center gap-4 z-[110]"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-0.5">Visual Asset</p>
                <p className="text-xs text-white font-medium truncate max-w-[200px]">{alt || 'Artwork Detail'}</p>
             </div>
             <a 
                href={src} 
                download 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
             >
                <Download size={14} />
                Full Res
             </a>
          </motion.div>

          {/* Image Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full h-full max-w-5xl max-h-[85vh] shadow-[0_0_100px_rgba(255,255,255,0.05)]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt || 'Full screen view'}
              fill
              className="object-contain"
              priority
              quality={100}
            />
          </motion.div>

          {/* Footer Instruction */}
          <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             className="absolute bottom-6 left-0 w-full text-center z-[110]"
          >
             <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">Click anywhere to close · ESC</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
