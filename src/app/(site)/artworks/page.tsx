import { client } from '@/lib/sanity';
import { PageTransition } from '@/components/layout/PageTransition';
import Image from 'next/image';
import { optimizedUrl } from '@/lib/utils';
import { getImageUrl } from '@/lib/imageResolver';
import Link from 'next/link';

export const revalidate = 60; // ISR cache regeneration

interface Artwork {
  _id: string;
  title: string;
  price: number;
  slug: { current: string };
  image: {
    asset: {
      url: string;
    }
  };
  subcategory?: string;
}

export default async function ArtworksPage() {
  const artworks: Artwork[] = await client.fetch(`*[_type == "artwork"] | order(_createdAt desc) {
    _id,
    title,
    price,
    slug,
    subcategory,
    "image": {
      "asset": {
        "url": image.asset->url
      }
    }
  }`);

  return (
    <PageTransition>
      <main className="min-h-screen w-full relative pt-40 px-6 md:px-12 max-w-[1600px] mx-auto pb-24 font-sans">
        
        <header className="mb-16 md:mb-32 flex flex-col items-center text-center max-w-[90%] sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight break-words text-ink mb-8">Masterpieces</h1>
          <p className="font-sans text-sm sm:text-base md:text-lg uppercase tracking-[0.2em] opacity-40 max-w-lg leading-relaxed font-extrabold">
            A curated selection of original artworks available for acquisition. Each piece is a unique synthesis of emotion and technique.
          </p>
        </header>

        {artworks.length === 0 ? (
          <div className="w-full h-[40vh] flex flex-col items-center justify-center border border-ink/5 bg-ink/[0.02] rounded-3xl shadow-inner">
            <p className="font-sans text-[10px] uppercase tracking-widest text-ink/30 font-extrabold">Collections currently in preparation</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-20">
            {artworks.map((item) => (
              <Link key={item._id} href={`/artworks/${item.slug.current}`} className="group relative flex flex-col gap-8 cursor-pointer">
                
                <div className="relative w-full aspect-[4/5] overflow-hidden rounded-sm shadow-2xl bg-ink/5 border border-ink/5 group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] transition-all duration-1000 ease-out">
                  <Image 
                    src={optimizedUrl(getImageUrl(item))} 
                    alt={item.title} 
                    fill 
                    className="object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000 ease-out group-hover:scale-110" 
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88eJNPAAIvwNIGP1SswAAAABJRU5ErkJggg=="
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/5 transition-colors duration-700 pointer-events-none"></div>
                  
                  {/* Premium Price Overlay (Visible on Hover and always on Mobile) */}
                  <div className="absolute bottom-0 left-0 w-full p-8 md:translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-in-out bg-gradient-to-t from-ink/80 via-ink/40 to-transparent">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-[1px] bg-canvas/40" />
                        <span className="text-canvas text-2xl font-serif tracking-[0.05em] italic">₹{item.price.toLocaleString()}</span>
                     </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 px-1">
                  <div className="flex justify-between items-start">
                    <h2 className="font-serif text-2xl sm:text-3xl tracking-tighter text-ink opacity-90 group-hover:opacity-100 transition-opacity leading-none">{item.title}</h2>
                    <span className="font-mono text-[9px] uppercase tracking-widest opacity-30 mt-1 font-bold">{item.subcategory || 'Original'}</span>
                  </div>
                  <div className="w-full h-[1px] bg-ink/5 group-hover:bg-ink/20 transition-colors duration-700 overflow-hidden">
                    <div className="w-0 h-full bg-ink group-hover:w-full transition-all duration-1000 ease-in-out"></div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-extrabold opacity-40 text-ink group-hover:opacity-100 transition-opacity">Explore Asset</span>
                    <span className="text-sm font-serif italic text-ink/70">Certified Archive</span>
                  </div>
                </div>

              </Link>
            ))}
          </div>
        )}
      </main>
    </PageTransition>
  );
}
