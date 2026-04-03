'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ReactNode } from 'react';

export function MuseumFrame({ children, className }: { children: ReactNode; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  // Rotate between -7 and 7 degrees based on mouse position
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div 
      className={`relative perspective-[1200px] w-full max-w-lg mx-auto ${className || ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d" // IMPORTANT FOR 3D LAYERS
        }}
        className="w-full relative group"
      >
        {/* The Frame Canvas / Matting Edge */}
        <div 
          className="relative w-full aspect-[4/5] bg-[#FBFAF7] p-4 md:p-6 lg:p-8 rounded-sm shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15),_0_0_15px_rgba(0,0,0,0.05)] border border-[#EBEAE4] transition-all duration-700 hover:shadow-[0_45px_70px_-15px_rgba(0,0,0,0.25)]"
        >
          {/* Subtle Frame Highlight */}
          <div className="absolute inset-0 border border-white/60 pointer-events-none rounded-sm z-30 mix-blend-overlay" />
          
          {/* Inner Picture Container - Popped out slightly in 3D */}
          <div 
            className="relative w-full h-full overflow-hidden shadow-[inset_0_5px_15px_rgba(0,0,0,0.1),_0_5px_15px_rgba(0,0,0,0.05)] bg-ink/5"
            style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}
          >
            {/* Dynamic Glare overlay tracking Mouse */}
            <motion.div 
               className="absolute inset-0 z-20 pointer-events-none mix-blend-soft-light bg-gradient-to-tr from-transparent via-white/40 to-transparent"
               style={{
                 opacity: 0.6,
                 x: useTransform(x, [-0.5, 0.5], ["-50%", "50%"]),
                 y: useTransform(y, [-0.5, 0.5], ["-50%", "50%"])
               }}
            />
            {children}
          </div>

          {/* Decorative Corner Tapes (Optional but extremely premium) */}
          <div className="absolute top-2 left-2 w-8 h-2 bg-white/40 rotate-45 mix-blend-overlay shadow-sm z-30" style={{ transform: "translateZ(35px) rotate(-45deg)" }} />
          <div className="absolute bottom-2 right-2 w-8 h-2 bg-white/40 rotate-45 mix-blend-overlay shadow-sm z-30" style={{ transform: "translateZ(35px) rotate(-45deg)" }} />

        </div>
      </motion.div>
    </div>
  );
}
