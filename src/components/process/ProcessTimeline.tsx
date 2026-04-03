'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import { cn, optimizedUrl } from '@/lib/utils';
import { SanityImage } from '@/components/ui/SanityImage';
import { StudioFrame } from '@/components/ui/StudioFrame';
import { getImageUrl, getVideoUrl } from '@/lib/imageResolver';

interface ProcessStep {
  _id: string;
  stepNumber: number;
  title: string;
  subtitle?: string;
  layout: 'left' | 'right';
  mediaType: 'image' | 'video' | 'comparison';
  aiCaption?: string;
  leftText?: string;
  rightText?: string;
  alt?: string;
  videoFileUrl?: string;
  imageUrl?: string;
  imageLqip?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
}

function BeforeAfterSlider({ beforeUrl, afterUrl }: { beforeUrl: string; afterUrl: string }) {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <div 
      className="relative w-full h-full cursor-ew-resize group bg-ink/5"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        setSliderPosition((x / rect.width) * 100);
      }}
      onTouchMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
        setSliderPosition((x / rect.width) * 100);
      }}
    >
      <Image
        src={optimizedUrl(beforeUrl)}
        alt="Before"
        fill
        className="object-cover w-full h-full pointer-events-none"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <div 
        className="absolute top-0 left-0 h-full overflow-hidden w-full pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Image
          src={optimizedUrl(afterUrl)}
          alt="After"
          fill
          className="object-cover w-full h-full pointer-events-none"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <div 
        className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
          <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" transform="rotate(90 12 12)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

const renderMedia = (step: ProcessStep) => {
  if (step.mediaType === 'video' && step.videoFileUrl) {
    return (
      <StudioFrame stepNumber={step.stepNumber}>
         <video
            src={getVideoUrl(step.videoFileUrl)}
            controls
            preload="none"
            className="w-full h-full object-cover mix-blend-multiply"
         />
      </StudioFrame>
    );
  }

  if (step.mediaType === 'comparison' && step.beforeImageUrl && step.afterImageUrl) {
    return (
      <StudioFrame stepNumber={step.stepNumber}>
        <BeforeAfterSlider beforeUrl={step.beforeImageUrl} afterUrl={step.afterImageUrl} />
      </StudioFrame>
    );
  }

  const resolvedUrl = getImageUrl(step);
  if (resolvedUrl && resolvedUrl !== '/placeholder.png') {
    return (
      <StudioFrame stepNumber={step.stepNumber}>
         <SanityImage
            src={resolvedUrl}
            alt={step.alt || step.title}
            lqip={step.imageLqip}
            fill
            className={cn(
              "object-cover w-full h-full hover:scale-105 transition-transform duration-[2s] ease-out mix-blend-multiply opacity-90",
              step.stepNumber === 1 && "grayscale contrast-125"
            )}
         />
      </StudioFrame>
    );
  }

  return (
    <div className="w-full min-w-[280px] lg:min-w-[400px] max-w-md aspect-[4/5] bg-ink/5 rounded-sm border border-ink/10 flex items-center justify-center">
       <span className="font-serif italic opacity-40 text-sm">Media pending</span>
    </div>
  );
};

export function ProcessTimeline({ steps }: { steps: ProcessStep[] }) {
  if (!steps || steps.length === 0) {
    return (
      <div className="w-full h-[40vh] flex flex-col items-center justify-center text-center">
         <div className="w-24 h-24 border border-ink/10 rounded-full flex items-center justify-center mb-8 shadow-inner">
            <span className="font-serif italic opacity-40 text-sm">Empty</span>
         </div>
         <h2 className="font-serif text-3xl opacity-80 tracking-tighter text-ink mb-4">No process steps available.</h2>
      </div>
    );
  }

  return (
    <div className="relative w-full mt-24 md:mt-32 pb-32 overflow-hidden">
       {/* Sketchy Center timeline line */}
       <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[0px] border-l-2 border-dashed border-ink/20 -translate-x-1/2 z-0" />

       <div className="flex flex-col gap-24 md:gap-40">
         {steps.map((step, idx) => {
           const isLeft = step.layout === 'left';
           
           const TextContent = (
             <div className={cn(
               "flex flex-col gap-4 text-center items-center w-full max-w-lg mx-auto",
               isLeft ? "md:text-right md:items-end" : "md:text-left md:items-start"
             )}>
               <div className={cn(
                 "flex flex-col gap-1 relative w-full pt-8 md:pt-12",
                 isLeft ? "md:items-end" : "md:items-start"
               )}>
                  <div className={cn(
                    "absolute -top-4 -z-10 select-none",
                    isLeft ? "right-0 md:-right-8 lg:-right-16" : "left-0 md:-left-8 lg:-left-16"
                  )}>
                    <svg className="absolute inset-0 w-full h-full scale-[1.5] -translate-x-2 -translate-y-2 opacity-[0.03] stroke-ink fill-none" viewBox="0 0 100 100">
                      <path d="M 50 10 A 40 40 0 1 0 50 90 A 40 40 0 1 0 50 10" strokeDasharray="50 10 20 5" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="font-serif text-[80px] md:text-[140px] leading-none opacity-5 inline-block -rotate-6">
                      {String(step.stepNumber).padStart(2, '0')}
                    </span>
                  </div>
                  
                  <div className={cn("inline-flex items-center gap-2 mb-2 w-max border border-ink/10 px-3 py-1 bg-ink/5 rotate-[-1deg]", isLeft ? "origin-bottom-right" : "origin-bottom-left")}>
                     <span className="w-1.5 h-1.5 rounded-full bg-ink/40 animate-pulse" />
                     <span className="text-[9px] uppercase font-mono tracking-widest text-ink/60 font-bold">Draft {step.stepNumber} // {step.subtitle || 'PROGRESS'}</span>
                  </div>
                  <h3 className="font-serif text-3xl md:text-5xl tracking-tighter text-ink relative inline-block mt-2">
                    {step.title}
                  </h3>
               </div>
               
               <p className="font-sans text-sm md:text-base leading-relaxed text-ink/70 max-w-sm mt-6 p-5 bg-[#faf9f6]/80 backdrop-blur-sm border shadow-sm relative group decoration-ink/20">
                  {/* Artist frame corners */}
                  <span className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t border-l border-ink/40 transition-all duration-500 group-hover:scale-150" />
                  <span className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b border-r border-ink/40 transition-all duration-500 group-hover:scale-150" />
                  {isLeft ? step.leftText : step.rightText}
               </p>
               {step.aiCaption && (
                 <p className="font-serif italic text-sm text-ink/50 max-w-md mt-4 hidden md:block">
                   {step.aiCaption}
                 </p>
               )}
             </div>
           );

           const MediaContent = (
             <div className="flex justify-center flex-col gap-6 w-full max-w-lg mx-auto relative group">
                {renderMedia(step)}
                
                {/* AI Caption Mobile Only */}
                {step.aiCaption && (
                  <p className="font-serif italic text-sm text-center text-ink/50 max-w-sm mx-auto px-4 md:hidden mt-2">
                    {step.aiCaption}
                  </p>
                )}
             </div>
           );

           return (
             <motion.div
               key={step._id}
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
               className="relative grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center px-4 md:px-8 z-10 w-full max-w-6xl mx-auto"
             >
               {/* Center Circle Indicator */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#f5f5f0] border-2 border-ink/10 flex items-center justify-center z-20 shadow-lg hidden md:flex font-serif text-xs text-ink isolate">
                 {step.stepNumber}
               </div>

               {/* Responsive Ordering */}
               <div className={cn(
                 "flex w-full",
                 "order-2", // Mobile text always second
                 isLeft ? "md:order-1" : "md:order-2" // Desktop position
               )}>
                 {TextContent}
               </div>
               
               <div className={cn(
                 "flex w-full",
                 "order-1", // Mobile media always first
                 isLeft ? "md:order-2" : "md:order-1" // Desktop position
               )}>
                 {MediaContent}
               </div>

             </motion.div>
           );
         })}
       </div>
    </div>
  );
}
