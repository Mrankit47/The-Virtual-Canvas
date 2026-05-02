import { client } from '@/lib/sanity';
import { PageTransition } from '@/components/layout/PageTransition';
import { ArtistArtworkGrid } from '@/components/artist/ArtistArtworkGrid';

export const revalidate = 0; // Fresh data for marketplace

export default async function ArtistArtworksPage() {
  const [artworks, categories] = await Promise.all([
    client.fetch(`*[_type == "artwork" && isArtistUpload == true] | order(createdAt desc) {
      _id,
      title,
      "slug": slug.current,
      description,
      postType,
      isPhotography,
      price,
      imageUrl,
      referenceImage,
      "image": image.asset->url,
      "artistName": artist->name,
      "artistId": artist->_id,
      "category": category->title
    }`),
    client.fetch(`*[_type == "category"] | order(order asc, title asc) {
      _id,
      title,
      "slug": slug.current
    }`),
  ]);

  return (
    <PageTransition>
      <main className="min-h-screen w-full relative pt-40 px-6 md:px-12 max-w-[1600px] mx-auto pb-24">
        <header className="mb-16 md:mb-24 flex flex-col items-center text-center">
          <h1 className="font-serif text-5xl md:text-7xl tracking-tighter text-ink mb-6">Artist Showcase</h1>
          <p className="font-sans text-[10px] md:text-xs uppercase tracking-[0.3em] opacity-50">Discover unique masterpieces from our creator community.</p>
        </header>

        {artworks.length === 0 ? (
          <div className="w-full h-[40vh] flex flex-col items-center justify-center border border-ink/10 bg-ink/5 rounded-[40px]">
            <p className="font-sans text-xs uppercase tracking-widest text-ink/50">No artist artworks available yet</p>
          </div>
        ) : (
          <ArtistArtworkGrid initialArtworks={artworks} categories={categories} />
        )}
      </main>
    </PageTransition>
  );
}
