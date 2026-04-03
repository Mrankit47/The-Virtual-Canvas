'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_STEPS = [
  { id: 1, title: 'The Concept', desc: 'Initial rough sketching and proportion mapping.', bg: 'bg-ink/5 text-ink' },
  { id: 2, title: 'The Outline', desc: 'Defining hard edges and structural boundaries.', bg: 'bg-ink/10 text-ink' },
  { id: 3, title: 'Shading & Depth', desc: 'Applying values, mid-tones, and contrast.', bg: 'bg-ink/20 text-ink' },
  { id: 4, title: 'Final Masterpiece', desc: 'Final highlights, texturing, and polishing.', bg: 'bg-ink text-canvas' }
];

export function ProcessSlider() {
  const [step, setStep] = useState(0);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-12 select-none">
      <div 
        className="relative w-full aspect-square md:aspect-[21/9] overflow-hidden border border-ink/10 cursor-pointer shadow-sm group" 
        onClick={() => setStep((s) => (s + 1) % MOCK_STEPS.length)}
      >
        <AnimatePresence mode="wait">
          <motion.div 
            key={step}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute inset-0 flex items-center justify-center transition-colors duration-1000 ${MOCK_STEPS[step].bg}`}
          >
            <div className="text-center p-8 max-w-2xl px-6">
              <h2 className="font-serif text-4xl md:text-6xl tracking-tighter mb-6">{MOCK_STEPS[step].title}</h2>
              <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] opacity-70 leading-relaxed">
                {MOCK_STEPS[step].desc}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Helper text overlay */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 opacity-0 group-hover:opacity-40 transition-opacity">
          <span className="text-[10px] uppercase tracking-widest">Click to advance</span>
        </div>
      </div>
      
      {/* Pagination indicators */}
      <div className="flex justify-center gap-4">
        {MOCK_STEPS.map((s, i) => (
          <button 
            key={s.id} 
            onClick={() => setStep(i)}
            aria-label={`Go to step ${i + 1}`}
            className={`h-1 transition-all duration-500 ${step === i ? 'w-16 bg-ink' : 'w-4 bg-ink/20 hover:bg-ink/40'}`}
          />
        ))}
      </div>
    </div>
  );
}
