export const getImageUrl = (item: any) => {
  if (!item) return "/placeholder.png";

  let url = "/placeholder.png";

  // 1. Prefer Sanity native image projection if it exists
  if (item.image) {
    if (typeof item.image === 'string') url = item.image; 
    else if (item.image.asset?.url) url = item.image.asset.url;
  } 
  // 2. Fallback to Cloudinary explicitly via new mapping or legacy mapping
  else if ((item.imageSource === "cloudinary" || item.imageSource === "url" || !item.image) && item.imageUrl) {
    url = item.imageUrl;
    if (url.includes('/upload/')) {
      // Avoid duplicating transformations if already present
      if (!url.includes('f_auto') && !url.includes('q_auto')) {
          url = url.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
      }
    }
  } 
  // 3. Edge case directly provided string
  else if (typeof item === 'string') {
    url = item;
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
