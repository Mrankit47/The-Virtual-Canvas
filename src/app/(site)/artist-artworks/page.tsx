import { client } from '@/lib/sanity';
import { PageTransition } from '@/components/layout/PageTransition';
import { ArtistArtworkGrid } from '@/components/artist/ArtistArtworkGrid';
import JsonLd from '@/components/seo/JsonLd';

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
      isOutOfStock,
      "image": image.asset->url,
      "artistName": artist->name,
      "artistId": artist->_id,
      "category": category->title,
      "likes": coalesce(likes, []),
      "comments": coalesce(comments, [])
    }`),
    client.fetch(`*[_type == "category"] | order(order asc, title asc) {
      _id,
      title,
      "slug": slug.current
    }`),
  ]);

  const artistArtworksSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://thevirtualcanvas.com/artist-artworks#webpage",
        "url": "https://thevirtualcanvas.com/artist-artworks",
        "name": "Artist Showcase | The Virtual Canvas",
        "description": "Discover unique masterpieces from our creator community. Browse original sketches and paintings by independent master artists.",
        "isPartOf": {
          "@id": "https://thevirtualcanvas.com/#website"
        },
        "breadcrumb": {
          "@id": "https://thevirtualcanvas.com/artist-artworks/#breadcrumb"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://thevirtualcanvas.com/artist-artworks/#breadcrumb",
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
            "name": "Artist Showcase",
            "item": "https://thevirtualcanvas.com/artist-artworks"
          }
        ]
      },
      {
        "@type": "OfferCatalog",
        "name": "The Virtual Canvas Artist Showcase Collection",
        "itemListElement": artworks.map((item: any, index: number) => ({
          "@type": "Offer",
          "position": index + 1,
          "itemOffered": {
            "@type": "Product",
            "name": item.title,
            "url": `https://thevirtualcanvas.com/artworks/${item.slug}`,
            "image": item.image || item.imageUrl || '',
            "offers": {
              "@type": "Offer",
              "price": item.price,
              "priceCurrency": "INR",
              "availability": item.isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
            }
          }
        }))
      }
    ]
  };

  return (
    <PageTransition>
      <JsonLd schema={artistArtworksSchema} />
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
