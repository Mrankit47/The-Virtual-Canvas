'use client';

import { PageTransition } from '@/components/layout/PageTransition';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <PageTransition>
      <main className="flex flex-col items-center justify-center min-h-[90vh] px-6 text-center select-none relative overflow-hidden">
        
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
            className="font-serif text-6xl md:text-8xl lg:text-[10rem] tracking-tighter leading-none mb-8 text-ink"
          >
            The Virtual Canvas
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="font-sans text-[10px] md:text-xs uppercase tracking-[0.3em] opacity-60 max-w-xl mx-auto mb-16 leading-relaxed text-ink"
          >
            An immersive digital exhibition of sketches, paintings, and fine photography.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="flex gap-4 items-center justify-center flex-wrap"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Link 
                href="/gallery"
                className="group relative inline-flex items-center justify-center px-10 md:px-12 py-5 font-sans text-[10px] md:text-xs uppercase tracking-widest border border-ink/20 hover:border-ink transition-colors duration-500 overflow-hidden"
              >
                <span className="relative z-10 transition-colors duration-500 group-hover:text-canvas text-ink font-medium tracking-[0.2em]">Enter Exhibition</span>
                <div className="absolute inset-0 bg-ink transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Link 
                href="/track-order"
                className="group relative inline-flex items-center justify-center px-10 md:px-12 py-5 font-sans text-[10px] md:text-xs uppercase tracking-widest border border-ink bg-ink text-canvas hover:bg-transparent hover:text-ink transition-colors duration-500 overflow-hidden"
              >
                <span className="relative z-10 transition-colors duration-500 font-medium tracking-[0.2em]">Track Your Order</span>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </main>
    </PageTransition>
  );
}
