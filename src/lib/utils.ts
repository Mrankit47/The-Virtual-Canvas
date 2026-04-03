import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const optimizedUrl = (url: string | undefined | null) => {
  if (!url) return '/placeholder.png'; // Fallback
  
  // Cloudinary URLs already handle optimization in getImageUrl
  if (url.includes('cloudinary.com')) return url;

  // Ensure we do not duplicate query parameters if already present
  // Sanity uses auto=format and q=[number]
  try {
    const urlObj = new URL(url);
    if (!urlObj.searchParams.has('w')) urlObj.searchParams.set('w', '800');
    if (!urlObj.searchParams.has('auto')) urlObj.searchParams.set('auto', 'format');
    if (!urlObj.searchParams.has('q')) urlObj.searchParams.set('q', '75');
    return urlObj.toString();
  } catch (e) {
    // If not a valid URL (e.g. relative path), append safely
    return url.includes('?') 
      ? `${url}&w=800&auto=format&q=75` 
      : `${url}?w=800&auto=format&q=75`;
  }
};
