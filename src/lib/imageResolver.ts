export const getImageUrl = (item: any) => {
  if (!item) return "/placeholder.png";

  // Cloudinary explicitly via new mapping or legacy mapping
  if ((item.imageSource === "cloudinary" || item.imageSource === "url") && item.imageUrl) {
    if (item.imageUrl.includes('/upload/')) {
      // Avoid duplicating transformations if already present
      if (!item.imageUrl.includes('f_auto') && !item.imageUrl.includes('q_auto')) {
          return item.imageUrl.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
      }
    }
    return item.imageUrl;
  }

  // Fallback to Sanity native image projection
  if (item.image) {
    if (typeof item.image === 'string') return item.image; // If we directly mapped image.asset->url into 'image'
    if (item.image.asset?.url) return item.image.asset.url;
  }

  // Edge case directly provided string
  if (typeof item === 'string') return item;

  return "/placeholder.png";
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
