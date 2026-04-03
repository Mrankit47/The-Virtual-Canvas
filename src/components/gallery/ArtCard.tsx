'use client';

import { motion } from 'framer-motion';
import { SanityImage } from '@/components/ui/SanityImage';
import { useUIStore } from '@/store/useUIStore';
import { getImageUrl } from '@/lib/imageResolver';

interface ArtCardProps {
  artwork: any;
  priority?: boolean;
  onClick: () => void;
}

export function ArtCard({ artwork, priority, onClick }: ArtCardProps) {
  const { setCursorType } = useUIStore();

  return (
    <motion.div
      initial={{ filter: 'blur(10px)', opacity: 0, y: 30 }}
      whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -100px 0px' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -10 }} 
      whileTap={{ scale: 0.98 }} 
      className="group relative flex-shrink-0 w-[85vw] md:w-[450px] lg:w-[500px] h-[60vh] md:h-[650px] overflow-hidden bg-ink/5 shadow-lg hover:shadow-2xl transition-shadow duration-500 rounded-sm"
      onClick={onClick}
      onMouseEnter={() => setCursorType('hover')}
      onMouseLeave={() => setCursorType('default')}
    >
      <div className="w-full h-full relative cursor-pointer">
        <SanityImage
          src={getImageUrl(artwork)}
          alt={artwork.title}
          lqip={artwork.imageLqip}
          fill
          priority={priority}
          className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[1.5s] ease-out"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="absolute flex flex-col justify-end bottom-0 left-0 w-full p-8 md:p-10 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] text-canvas">
          <h3 className="font-serif text-3xl tracking-tighter mb-2 drop-shadow-lg">{artwork.title}</h3>
          <div className="flex justify-between items-center text-[10px] md:text-xs uppercase tracking-[0.2em] opacity-80">
            <span>{artwork.category}</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity delay-200">View Masterpiece</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
