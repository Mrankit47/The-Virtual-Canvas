'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { optimizedUrl } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface ProcessComparisonProps {
  beforeUrl: string;
  afterUrl: string;
  beforeTitle?: string;
  afterTitle?: string;
}

export function ProcessComparison({ 
  beforeUrl, 
  afterUrl, 
  beforeTitle = "Sketch Vision", 
  afterTitle = "Final Masterpiece" 
}: ProcessComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

  const handleMove = (clientX: number, rectLeft: number, rectWidth: number) => {
    const x = Math.max(0, Math.min(clientX - rectLeft, rectWidth));
    setSliderPosition((x / rectWidth) * 100);
  };

  return (
    <section className="mt-40 mb-20">
      <div className="flex flex-col items-center justify-center text-center mb-16">
         <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 bg-ink/5 border border-ink/10 rounded-full">
            <Sparkles size={12} className="text-ink/60" />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-ink/60">Final Evolution</span>
         </div>
         <h2 className="font-serif text-4xl md:text-6xl tracking-tighter text-ink mb-6">The Transformation</h2>
         <p className="font-sans text-sm text-ink/50 max-w-lg leading-relaxed">
           Slide across to witness the journey from the first conceptual stroke to the high-fidelity finished artwork.
         </p>
      </div>

      <div className="relative w-full max-w-2xl mx-auto aspect-[4/5] rounded-2xl overflow-hidden border border-ink/10 shadow-2xl group isolate">
         {/* Instruction Overlay */}
         <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-[10px] uppercase tracking-widest font-bold shadow-xl">
               Slide to explore
            </div>
         </div>

         {/* Container for slider */}
         <div 
            className="relative w-full h-full cursor-ew-resize select-none overflow-hidden"
            onMouseMove={(e) => {
                if (isResizing) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    handleMove(e.clientX, rect.left, rect.width);
                }
            }}
            onMouseDown={() => setIsResizing(true)}
            onMouseUp={() => setIsResizing(false)}
            onMouseLeave={() => setIsResizing(false)}
            onTouchMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                handleMove(e.touches[0].clientX, rect.left, rect.width);
            }}
         >
            {/* Before Image */}
            <Image
                src={optimizedUrl(beforeUrl)}
                alt="Initial Sketch"
                fill
                className="object-cover object-[10%_20%] pointer-events-none grayscale opacity-60 contrast-125 mix-blend-multiply"
                priority
            />
            <div className="absolute bottom-10 left-10 z-10 px-4 py-2 bg-ink/5 backdrop-blur-md border border-ink/10 rounded-sm">
                <span className="text-[10px] uppercase tracking-widest font-bold text-ink/40">{beforeTitle}</span>
            </div>

            {/* After Image (Clipped) */}
            <div 
                className="absolute top-0 left-0 h-full overflow-hidden w-full pointer-events-none border-r border-white/30"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <Image
                    src={optimizedUrl(afterUrl)}
                    alt="Final Outcome"
                    fill
                    className="object-cover object-[90%_15%] pointer-events-none"
                    priority
                />
                <div 
                    className="absolute bottom-10 right-10 z-10 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-sm"
                    style={{ right: `max(2.5rem, calc(${100 - sliderPosition}% + 2.5rem))` }}
                >
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/80">{afterTitle}</span>
                </div>
            </div>

            {/* Slider Line & Handle */}
            <div 
                className="absolute top-0 bottom-0 w-[2px] bg-white z-30 pointer-events-none shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-ink/5 active:scale-110 transition-transform">
                    <div className="flex gap-1">
                        <div className="w-[1px] h-4 bg-ink/20" />
                        <div className="w-[1px] h-4 bg-ink/20" />
                        <div className="w-[1px] h-4 bg-ink/20" />
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* Decorative Labels for mobile */}
      <div className="md:hidden flex justify-between px-6 mt-6">
         <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest opacity-40 font-bold mb-1">Start</span>
            <p className="text-xs font-serif italic">{beforeTitle}</p>
         </div>
         <div className="flex flex-col text-right">
            <span className="text-[9px] uppercase tracking-widest opacity-40 font-bold mb-1">Finish</span>
            <p className="text-xs font-serif italic">{afterTitle}</p>
         </div>
      </div>
    </section>
  );
}
