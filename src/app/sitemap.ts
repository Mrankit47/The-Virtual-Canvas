import { MetadataRoute } from 'next';
import { client } from '@/lib/sanity';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://thevirtualcanvas.com';

  // Fetch dynamic artworks from Sanity CMS
  let artworkUrls: MetadataRoute.Sitemap = [];
  try {
    const artworks = await client.fetch(`
      *[_type == "artwork" && isArtistUpload != true && defined(slug.current)] {
        "slug": slug.current,
        _updatedAt
      }
    `);
    
    artworkUrls = artworks.map((art: any) => ({
      url: `${baseUrl}/artworks/${encodeURIComponent(art.slug)}`,
      lastModified: art._updatedAt ? new Date(art._updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Sitemap dynamic fetch failed:', error);
  }

  // Static Pages
  const staticPages = [
    '',
    '/about',
    '/gallery',
    '/artworks',
    '/photography',
    '/process',
    '/contact',
    '/refund-policy',
    '/privacy-policy',
    '/shipping-policy',
    '/terms',
    '/artist-artworks',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: (route === '' || route === '/gallery' || route === '/artworks') ? 'daily' as const : 'monthly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return [...staticPages, ...artworkUrls];
}
