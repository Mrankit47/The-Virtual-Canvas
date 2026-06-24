import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/studio/', '/api/'],
    },
    sitemap: 'https://thevirtualcanvas.com/sitemap.xml',
  };
}
