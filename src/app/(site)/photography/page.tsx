import type { Metadata } from 'next';
import { client } from '@/lib/sanity';
import { GET_PHOTOGRAPHY_QUERY } from '@/sanity/queries';
import { PageTransition } from '@/components/layout/PageTransition';
import { PhotographyClient } from '@/components/gallery/PhotographyClient';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Fine Photography Showcase',
  description: 'Explore the fine photography collection at The Virtual Canvas. Captured moments frozen in time with unique perspective and high visual fidelity.',
};


export const revalidate = 60;

export default async function PhotographyPage() {
  const photos = await client.fetch(GET_PHOTOGRAPHY_QUERY);

  const photographySchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://thevirtualcanvas.com/photography#webpage",
        "url": "https://thevirtualcanvas.com/photography",
        "name": "Fine Photography Exhibition | The Virtual Canvas",
        "description": "Explore the fine photography collection at The Virtual Canvas. Captured moments frozen in time with unique perspective and high visual fidelity.",
        "isPartOf": {
          "@id": "https://thevirtualcanvas.com/#website"
        },
        "breadcrumb": {
          "@id": "https://thevirtualcanvas.com/photography/#breadcrumb"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://thevirtualcanvas.com/photography/#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://thevirtualcanvas.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Photography",
            "item": "https://thevirtualcanvas.com/photography"
          }
        ]
      }
    ]
  };

  return (
    <PageTransition>
      <JsonLd schema={photographySchema} />
      <main className="min-h-screen w-full relative pt-32 px-4 sm:px-6 md:px-8 pb-24 bg-[#111] text-[#f5f5f0] transition-colors duration-1000 -mt-24 overflow-x-hidden">
        <div className="max-w-screen-2xl mx-auto pt-12 md:pt-24">
          <header className="mb-16 md:mb-24 flex flex-col items-center md:items-start text-center md:text-left gap-6 text-[#f5f5f0] max-w-[90%] sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto md:mx-0">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight break-words">Photography</h1>
            <p className="font-sans text-sm sm:text-base md:text-lg uppercase tracking-[0.2em] opacity-60">Moments frozen in time.</p>
          </header>

          <PhotographyClient photos={photos} />
        </div>
      </main>
    </PageTransition>
  );
}
