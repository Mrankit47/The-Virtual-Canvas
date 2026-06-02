import { client } from '@/lib/sanity';
import { PageTransition } from '@/components/layout/PageTransition';
import { ArtCarousel3D } from '@/components/ui/ArtCarousel3D';
import { GalleryGridClient } from '@/components/gallery/GalleryGridClient';

export const revalidate = 60; // ISR cache regeneration

export default async function GalleryPage() {
  const [images, categories] = await Promise.all([
    client.fetch(`*[_type == "gallery" || (_type == "artwork" && postType == "gallery" && isArtistUpload != true)] | order(_createdAt desc) {
      _id,
      title,
      imageSource,
      imageUrl,
      referenceImage,
      price,
      "image": image.asset->url,
      "imageLqip": image.asset->metadata.lqip,
      "category": category->{ title, "slug": slug.current },
      "likes": coalesce(likes, []),
      "comments": coalesce(comments, [])
    }`),
    client.fetch(`*[_type == "category"] | order(order asc, title asc) {
      title,
      "slug": slug.current
    }`),
  ]);

  return (
    <PageTransition>
      <main className="min-h-screen w-full relative pt-24 sm:pt-40 px-4 md:px-12 max-w-[1600px] mx-auto pb-24">
        
        <header className="mb-12 md:mb-12 flex flex-col items-center text-center mt-16 sm:mt-0">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl tracking-tighter text-ink mb-4 sm:mb-6 leading-tight">The Gallery</h1>
          <p className="font-sans text-[9px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-50 px-4">Exploration of visual fidelity.</p>
        </header>

        {/* 3D SHOWCASE CAROUSEL */}
        <section className="mb-24">
           <ArtCarousel3D items={images} />
        </section>

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
