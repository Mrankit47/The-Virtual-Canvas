import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const optimizedUrl = (url: string | undefined | null) => {
  if (!url || url === '/placeholder.png') return 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800'; // Better remote fallback
  
  // Cloudinary URLs already handle optimization in getImageUrl
  if (url.includes('cloudinary.com')) return url;

  // If it's already a relative path that's not a placeholder, return it
  if (url.startsWith('/') && !url.includes('placeholder')) return url;

  try {
    const urlObj = new URL(url);
    if (!urlObj.searchParams.has('w')) urlObj.searchParams.set('w', '800');
    if (!urlObj.searchParams.has('auto')) urlObj.searchParams.set('auto', 'format');
    if (!urlObj.searchParams.has('q')) urlObj.searchParams.set('q', '75');
    return urlObj.toString();
  } catch (e) {
    // If not a valid URL (e.g. relative path), append safely
    if (url.includes('?')) return `${url}&w=800&auto=format&q=75`;
    return `${url}?w=800&auto=format&q=75`;
  }
};

