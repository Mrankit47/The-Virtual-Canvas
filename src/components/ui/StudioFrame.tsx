'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StudioFrameProps {
  children: ReactNode;
  stepNumber: number;
  rotation?: number;
}

export function StudioFrame({ children, stepNumber, rotation = -2 }: StudioFrameProps) {
  // Use stepNumber to alternate slightly
  const isEven = stepNumber % 2 === 0;
  const rotateVal = isEven ? rotation : -rotation;
  
  return (
    <motion.div 
      className="relative w-full max-w-md mx-auto aspect-[4/5] isolate my-4 md:my-8"
      initial={{ y: 40, opacity: 0, rotateZ: rotateVal - (isEven ? 5 : -5) }}
      whileInView={{ y: 0, opacity: 1, rotateZ: rotateVal }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.02, rotateZ: rotateVal === -2 ? -1 : 1, transition: { duration: 0.5 } }}
    >
      {/* Blueprint Outline / Graph Grid (Behind the paper) */}
      <div 
        className="absolute -top-12 -left-12 -right-12 -bottom-12 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:16px_16px] -z-10 pointer-events-none"
        style={{ maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)' }}
      />

      {/* Decorative Technical/Scribble Overlays behind the frame */}
      {isEven ? (
        <svg className="absolute -left-16 top-1/4 w-32 h-40 stroke-ink/10 fill-none -z-10 hidden md:block" strokeWidth="1" viewBox="0 0 100 200">
          <path d="M 90 0 C 10 50, 10 150, 90 200" strokeDasharray="3 4" />
          <path d="M 85 10 C 20 60, 20 140, 85 190" strokeWidth="0.5" />
          <line x1="10" y1="100" x2="40" y2="100" strokeDasharray="1 3" />
          <text x="5" y="95" className="text-[8px] font-mono fill-ink/20 border-none tracking-widest">ARC-0{stepNumber}</text>
          <circle cx="25" cy="100" r="2" className="fill-ink/20" />
        </svg>
      ) : (
        <svg className="absolute -right-16 bottom-16 w-32 h-32 stroke-ink/10 fill-none -z-10 hidden md:block" strokeWidth="1" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" strokeDasharray="2 4" />
          <circle cx="50" cy="50" r="43" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="25" strokeDasharray="1 6" className="stroke-ink/20" />
          <line x1="50" y1="0" x2="50" y2="100" strokeDasharray="2 4" />
          <line x1="0" y1="50" x2="100" y2="50" strokeDasharray="2 4" />
          <text x="55" y="45" className="text-[8px] font-mono fill-ink/20 border-none tracking-widest">R={1.618 * stepNumber}</text>
        </svg>
      )}

      {/* The Polaroid / Studio Paper Texture */}
      <div className="relative w-full h-full bg-[#fcfbf9] p-3 pb-12 md:p-4 md:pb-16 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1),_0_5px_15px_rgba(0,0,0,0.05)] border border-ink/5 before:content-[''] before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')] before:opacity-20 before:pointer-events-none before:z-10">
        
        {/* Masking Tape - Top Center */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-8 bg-[#e8e4d9] opacity-90 shadow-sm z-30 mix-blend-multiply flex items-center justify-center overflow-hidden" 
           style={{ 
             clipPath: 'polygon(2% 10%, 98% 0%, 95% 90%, 5% 100%)',
             transform: isEven ? 'translateX(-50%) rotate(2deg)' : 'translateX(-50%) rotate(-1deg)'
           }}>
           {/* Tape vertical wrinkles */}
           <div className="w-full h-full bg-[linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:4px_100%]" />
        </div>
           
        {/* Masking Tape 2 - Corner (Optional) */}
        {!isEven && (
          <div className="absolute -bottom-4 -left-4 w-16 h-6 bg-[#e8e4d9] opacity-80 shadow-sm z-30 mix-blend-multiply rotate-45" 
            style={{ clipPath: 'polygon(0% 10%, 100% 0%, 95% 90%, 2% 100%)' }} />
        )}
        {isEven && (
          <div className="absolute -bottom-4 -right-4 w-16 h-6 bg-[#e8e4d9] opacity-80 shadow-sm z-30 mix-blend-multiply -rotate-45" 
            style={{ clipPath: 'polygon(0% 10%, 100% 0%, 95% 90%, 2% 100%)' }} />
        )}

        {/* Inner Canvas Image Container */}
        <div className="relative w-full h-full overflow-hidden bg-ink/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] z-20">
          {children}
          {/* Inner Vignette / Drawing shadow over the image */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] z-30 mix-blend-overlay" />
        </div>

        {/* Handwritten text at bottom of Polaroid */}
        <div className="absolute bottom-3 md:bottom-5 left-0 w-full text-center pointer-events-none z-20 opacity-60">
          <span className="font-serif italic text-ink/70 text-sm md:text-base tracking-widest uppercase flex flex-col items-center gap-1">
            <span className="text-[8px] md:text-[10px] font-mono opacity-50 block tracking-[0.3em]">Execution Phase</span>
            Seq {String(stepNumber).padStart(2, '0')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
