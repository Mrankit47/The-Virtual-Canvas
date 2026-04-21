import Image from 'next/image';
import { cn, optimizedUrl } from '@/lib/utils';
import { memo } from 'react';
import { isValidImageSrc } from '@/lib/safeImage';

interface SanityImageProps {
  src: string;
  alt: string;
  lqip?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
}

// Memoized to prevent unnecessary re-renders in grid layouts
export const SanityImage = memo(function SanityImage({ 
  src, alt, lqip, width, height, fill, className, priority 
}: SanityImageProps) {
  // Guard: skip rendering if src is not a valid URL
  if (!isValidImageSrc(src)) {
    return (
      <div className={cn("relative overflow-hidden bg-ink/5 flex items-center justify-center", className)}>
        <span className="text-ink/10 text-xs">No image</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-ink/5 flex items-center justify-center", className)}>
      <Image
        src={optimizedUrl(src)}
        alt={alt || "Artwork preview"}
        width={fill ? undefined : width || 800}
        height={fill ? undefined : height || 600}
        fill={fill}
        priority={priority}
        className="object-cover transition-opacity duration-700 w-full h-full"
        placeholder={lqip ? "blur" : "empty"}
        blurDataURL={lqip || undefined}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        loading={priority ? undefined : "lazy"}
      />
    </div>
  );
});
