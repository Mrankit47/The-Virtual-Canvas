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
    <div className="relative w-full mt-16 sm:mt-24 md:mt-32 pb-32 overflow-hidden">
       {/* Sketchy Center timeline line */}
       <div className="absolute left-1/2 top-0 bottom-0 w-[0px] border-l border-dashed border-ink/10 -translate-x-1/2 z-0" />

       <div className="flex flex-col gap-4 sm:gap-16 md:gap-40">
         {steps.map((step, idx) => {
           const isLeft = step.layout === 'left';
           
            const TextContent = (
             <div className={cn(
               "flex flex-col gap-2 sm:gap-4 text-center items-center w-full max-w-lg mx-auto",
               isLeft ? "text-right items-end" : "text-left items-start"
             )}>
               <div className={cn(
                 "flex flex-col gap-1 relative w-full pt-0 sm:pt-12",
                 isLeft ? "items-end" : "items-start"
               )}>
                  <div className={cn(
                    "absolute -top-2 sm:-top-6 -z-10 select-none",
                    isLeft ? "right-0 md:-right-8 lg:-right-16" : "left-0 md:-left-8 lg:-left-16"
                  )}>
                    <svg className="absolute inset-0 w-full h-full scale-[1.0] sm:scale-[1.5] -translate-x-1 -translate-y-1 sm:-translate-x-2 sm:-translate-y-2 opacity-[0.03] stroke-ink fill-none" viewBox="0 0 100 100">
                      <path d="M 50 10 A 40 40 0 1 0 50 90 A 40 40 0 1 0 50 10" strokeDasharray="50 10 20 5" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="font-serif text-3xl sm:text-8xl md:text-9xl leading-none opacity-[0.03] inline-block -rotate-6">
                      {String(step.stepNumber).padStart(2, '0')}
                    </span>
                  </div>
                  
                  <div className={cn("inline-flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 w-max border border-ink/10 px-2 sm:px-3 py-1 sm:py-1.5 bg-ink/5 backdrop-blur-md shadow-sm rotate-[-1deg]", isLeft ? "origin-bottom-right" : "origin-bottom-left")}>
                     <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-ink/40" />
                     <span className="text-[6px] sm:text-[10px] uppercase font-bold tracking-[0.2em] text-ink/60">Draft {step.stepNumber} // {step.subtitle || 'PROGRESS'}</span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight leading-tight break-words text-ink relative inline-block mt-1 sm:mt-2">
                    {step.title}
                  </h3>
               </div>
               
               <p className="font-serif italic text-[11px] sm:text-sm lg:text-base leading-relaxed text-ink/70 max-w-sm mt-3 sm:mt-6 p-4 sm:p-8 bg-white/40 backdrop-blur-sm border border-ink/5 shadow-sm relative group decoration-ink/20 rounded-sm">
                  {/* Artist frame corners */}
                  <span className="absolute -top-[1px] -left-[1px] w-2 h-2 sm:w-3 sm:h-3 border-t border-l border-ink/10 transition-all duration-500 group-hover:scale-150" />
                  <span className="absolute -bottom-[1px] -right-[1px] w-2 h-2 sm:w-3 sm:h-3 border-b border-r border-ink/10 transition-all duration-500 group-hover:scale-150" />
                  {isLeft ? step.leftText : step.rightText}
               </p>
               {step.aiCaption && (
                 <p className="font-serif italic text-[7px] sm:text-[10px] text-ink/40 max-w-md mt-2 sm:mt-4 hidden sm:block uppercase tracking-widest font-bold">
                   {step.aiCaption}
                 </p>
               )}
             </div>
           );

           const MediaContent = (
             <div className="flex justify-center flex-col gap-6 w-full max-w-lg mx-auto relative group">
                <div className="transition-transform duration-1000 group-hover:scale-[1.02]">
                    {renderMedia(step)}
                </div>
                
                {/* AI Caption Mobile Only - Restored to elegant italic serif */}
                {step.aiCaption && (
                  <p className="font-serif italic text-[10px] sm:text-xs text-center text-ink/40 max-w-md mx-auto px-4 md:hidden mt-4 tracking-normal">
                    {step.aiCaption}
                  </p>
                )}
             </div>
           );

            return (
             <motion.div
               key={step._id}
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-50px" }}
               transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
               className="relative grid grid-cols-2 gap-0.5 sm:gap-16 md:gap-24 items-start px-0.5 sm:px-4 md:px-8 z-10 w-full max-w-6xl mx-auto"
             >
               {/* Center Circle Indicator */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 sm:w-10 sm:h-10 rounded-full bg-[#f5f5f0] border border-ink/5 flex items-center justify-center z-20 shadow-2xl flex font-serif text-[6px] sm:text-xs text-ink isolate">
                 {step.stepNumber}
               </div>

               {/* Responsive Ordering - Maintained Alternating Layout */}
               <div className={cn(
                 "flex w-full px-0.5 sm:px-0",
                 isLeft ? "order-1" : "order-2"
               )}>
                 {TextContent}
               </div>
               
               <div className={cn(
                 "flex w-full px-0.5 sm:px-0",
                 isLeft ? "order-2" : "order-1"
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
