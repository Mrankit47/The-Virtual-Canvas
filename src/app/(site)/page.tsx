'use client';

import { useState, useEffect } from 'react';
import { PageTransition } from '@/components/layout/PageTransition';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ArtLoader from '@/components/ui/ArtLoader';

export default function Home() {
  const { data: session } = useSession();
  const [isMounting, setIsMounting] = useState(true);
  
  useEffect(() => {
    // Artificial delay for high-end entrance feel
    const timer = setTimeout(() => setIsMounting(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Words for the premium mask reveal animation
  const titleWords = ["The", "Virtual", "Canvas"];

  // Ultra-premium cubic-bezier ease out curve
  const premiumEase = [0.16, 1, 0.3, 1];

  return (
    <>
      <ArtLoader isVisible={isMounting} variant="fullscreen" size="lg" />
      <PageTransition>
        <main className="flex flex-col items-center justify-center min-h-[90vh] px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32 text-center select-none relative overflow-hidden">
        
        {/* Slow scaling, elegant ambient background TVC text */}
        <motion.div 
          style={{ y: y1 }}
          initial={{ opacity: 0, scale: 0.85, filter: 'blur(15px)' }}
          animate={!isMounting ? { opacity: 0.05, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 0.85, filter: 'blur(15px)' }}
          transition={{ duration: 2.2, ease: premiumEase, delay: 0.2 }}
          className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10"
        >
           <span className="font-serif text-[40vw] leading-none tracking-tighter text-ink whitespace-nowrap opacity-10 blur-[2px]">T V C</span>
        </motion.div>

        <motion.div style={{ opacity }} className="relative z-10 w-full">
          {/* Main Title: Premium Word Mask Reveal */}
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[8rem] tracking-tighter leading-[0.9] lg:leading-none break-words lg:whitespace-nowrap mb-6 md:mb-8 text-ink max-w-[90%] lg:max-w-none mx-auto overflow-hidden flex flex-wrap justify-center gap-y-2">
            {titleWords.map((word, index) => (
              <span key={index} className="inline-block overflow-hidden mr-[0.25em] last:mr-0 py-1 sm:py-2">
                <motion.span
                  initial={{ y: '100%', opacity: 0 }}
                  animate={!isMounting ? { y: 0, opacity: 1 } : { y: '100%', opacity: 0 }}
                  transition={{
                    duration: 1.4,
                    ease: premiumEase,
                    delay: 0.1 + index * 0.15,
                  }}
                  className="inline-block"
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>

          {/* Subheading Description with smooth slide-up + blur reveal */}
          <motion.p 
            initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
            animate={!isMounting ? { opacity: 0.5, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 15, filter: 'blur(4px)' }}
            transition={{ delay: 0.6, duration: 1.2, ease: premiumEase }}
            className="font-sans text-[10px] md:text-[11px] uppercase tracking-[0.3em] lg:tracking-[0.4em] max-w-[280px] sm:max-w-sm md:max-w-lg lg:max-w-xl mx-auto mb-10 lg:mb-12 leading-loose text-center text-ink"
          >
            An immersive digital exhibition of sketches, paintings, and fine photography.
          </motion.p>

          {/* Action Buttons Staggered Reveal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={!isMounting ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.8, duration: 1.2, ease: premiumEase }}
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

            {session?.user?.role !== 'artist' && session?.user?.role !== 'admin' && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Link 
                  href="/order"
                  className="group relative flex items-center justify-center w-full sm:w-auto px-10 py-3.5 lg:px-10 lg:py-4 font-sans text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-medium border border-ink bg-ink text-canvas hover:bg-transparent hover:text-ink transition-colors duration-500 overflow-hidden text-center"
                >
                  <span className="relative z-10 transition-colors duration-500">ORDER NOW</span>
                </Link>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </main>
      </PageTransition>
    </>
  );
}
