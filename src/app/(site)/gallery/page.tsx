import { client } from '@/lib/sanity';
import { PageTransition } from '@/components/layout/PageTransition';
import { GalleryGridClient } from '@/components/gallery/GalleryGridClient';

export const revalidate = 60; // ISR cache regeneration

export default async function GalleryPage() {
  const [images, categories] = await Promise.all([
    client.fetch(`*[_type == "gallery"] | order(_createdAt desc) {
      _id,
      title,
      imageSource,
      imageUrl,
      "image": image.asset->url,
      "imageLqip": image.asset->metadata.lqip,
      "category": category->{ title, "slug": slug.current }
    }`),
    client.fetch(`*[_type == "category"] | order(order asc, title asc) {
      title,
      "slug": slug.current
    }`),
  ]);

  return (
    <PageTransition>
      <main className="min-h-screen w-full relative pt-40 px-6 md:px-12 max-w-[1600px] mx-auto pb-24">
        
        <header className="mb-16 md:mb-24 flex flex-col items-center text-center">
          <h1 className="font-serif text-5xl md:text-7xl tracking-tighter text-ink mb-6">The Gallery</h1>
          <p className="font-sans text-[10px] md:text-xs uppercase tracking-[0.3em] opacity-50">Exploration of visual fidelity.</p>
        </header>

        {images.length === 0 ? (
          <div className="w-full h-[40vh] flex flex-col items-center justify-center border border-ink/10 bg-ink/5 rounded-sm shadow-sm">
            <p className="font-sans text-xs uppercase tracking-widest text-ink/50">No artworks available yet</p>
          </div>
        ) : (
          <GalleryGridClient items={images} categories={categories} />
        )}
      </main>
    </PageTransition>
  );
}
