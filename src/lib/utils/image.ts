import { createClient } from 'next-sanity';
import imageUrlBuilder from '@sanity/image-url';
import { env } from '@/config/env';

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: true,
});

const builder = imageUrlBuilder(client);

export function urlFor(source: any) {
  return builder.image(source);
}

export function getSafeImageUrl(item: any) {
  if (!item) return "/placeholder.png";

  if (typeof item === 'string' && item.startsWith('http')) {
    return item;
  }

  try {
    if (item.imageUrl) return item.imageUrl;
    if (item.image) return urlFor(item.image).url();
  } catch (error) {
    console.warn("Failed to resolve image URL, using fallback", error);
  }

  return "/placeholder.png";
}
