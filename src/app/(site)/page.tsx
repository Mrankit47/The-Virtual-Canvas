'use client';

import { useState, useEffect } from 'react';
import { PageTransition } from '@/components/layout/PageTransition';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import ArtLoader from '@/components/ui/ArtLoader';

export default function Home() {
  const [isMounting, setIsMounting] = useState(true);
  
  useEffect(() => {
    // Artificial delay for high-end entrance feel
    const timer = setTimeout(() => setIsMounting(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <>
      <ArtLoader isVisible={isMounting} variant="fullscreen" size="lg" />
      <PageTransition>
        <main className="flex flex-col items-center justify-center min-h-[90vh] px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32 text-center select-none relative overflow-hidden">
        
        <motion.div 
          style={{ y: y1 }}
          className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center -z-10"
        >
           <span className="font-serif text-[40vw] leading-none tracking-tighter text-ink whitespace-nowrap opacity-10 blur-[2px]">T V C</span>
        </motion.div>

        <motion.div style={{ opacity }}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[8rem] tracking-tighter leading-[0.9] lg:leading-none break-words lg:whitespace-nowrap mb-6 md:mb-8 text-ink max-w-[90%] lg:max-w-none mx-auto"
          >
            The Virtual Canvas
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="font-sans text-[10px] md:text-[11px] uppercase tracking-[0.3em] lg:tracking-[0.4em] opacity-50 max-w-[280px] sm:max-w-sm md:max-w-lg lg:max-w-xl mx-auto mb-10 lg:mb-12 leading-loose text-center text-ink"
          >
            An immersive digital exhibition of sketches, paintings, and fine photography.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="flex flex-col sm:flex-row gap-4 lg:gap-5 items-center justify-center w-full px-8 sm:px-0"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Link 
                href="/gallery"
                className="group relative flex items-center justify-center w-full sm:w-auto px-10 py-3.5 lg:px-10 lg:py-4 font-sans text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-medium border border-ink/20 hover:border-ink transition-colors duration-500 overflow-hidden text-center"
              >
                <span className="relative z-10 transition-colors duration-500 group-hover:text-canvas text-ink">Enter Exhibition</span>
                <div className="absolute inset-0 bg-ink transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Link 
                href="/track-order"
                className="group relative flex items-center justify-center w-full sm:w-auto px-10 py-3.5 lg:px-10 lg:py-4 font-sans text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-medium border border-ink bg-ink text-canvas hover:bg-transparent hover:text-ink transition-colors duration-500 overflow-hidden text-center"
              >
                <span className="relative z-10 transition-colors duration-500">Track Your Order</span>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </main>
      </PageTransition>
    </>
  );
}
