export const getImageUrl = (item: any) => {
  if (!item) return "/placeholder.png";

  let url = "";

  // 1. Prefer Sanity native image projection if it exists
  if (item.image) {
    if (typeof item.image === 'string') url = item.image; 
    else if (item.image.asset?.url) url = item.image.asset.url;
    else if (item.image.url) url = item.image.url;
  } 
  
  // 2. Fallback to imageUrl (Cloudinary or direct link)
  if (!url && item.imageUrl) {
    url = item.imageUrl;
  }

  // 3. Fallback to referenceImage (for orders/artist uploads)
  if (!url && item.referenceImage) {
    url = item.referenceImage;
  }

  // 4. Final fallback
  if (!url) return "/placeholder.png";

  // Cloudinary Optimization
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    if (!url.includes('f_auto') && !url.includes('q_auto')) {
        url = url.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
    }
  }

  // Fix mangled URLs (e.g., double https:// or prepended text)
  if (url && url.includes('https://') && url.lastIndexOf('https://') > 0) {
    url = url.substring(url.lastIndexOf('https://'));
  }

  return url;
};


export const getVideoUrl = (url: string | undefined | null) => {
  if (!url) return undefined;
  
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
     if (!url.includes('q_auto')) {
        return url.replace('/upload/', '/upload/q_auto/');
     }
  }
  return url;
};
