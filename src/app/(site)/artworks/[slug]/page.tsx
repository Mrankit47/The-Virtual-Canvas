import { client } from '@/sanity/client';
import { PageTransition } from '@/components/layout/PageTransition';
import Image from 'next/image';
import { optimizedUrl } from '@/lib/utils';
import { getImageUrl } from '@/lib/imageResolver';
import { notFound } from 'next/navigation';
import { OrderButton } from '@/components/artworks/OrderButton';

export const revalidate = 60; // ISR cache regeneration

interface Artwork {
  _id: string;
  title: string;
  price: number;
  description: string;
  medium?: string;
  dimensions?: string;
  subcategory?: string;
  image: {
    asset: {
      url: string;
    }
  };
}

export default async function ArtworkDetail({ params }: { params: { slug: string } }) {
  const artwork: Artwork = await client.fetch(`*[_type == "artwork" && slug.current == $slug][0] {
    _id,
    title,
    price,
    description,
    medium,
    dimensions,
    subcategory,
    "image": {
      "asset": {
        "url": image.asset->url
      }
    }
  }`, { slug: params.slug });

  if (!artwork) notFound();

  return (
    <PageTransition>
      <main className="min-h-screen pt-40 md:pt-48 pb-24 px-6 md:px-12 max-w-[1400px] mx-auto overflow-hidden">
        
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          
          {/* IMAGE SIDE - LEFT */}
          <div className="w-full lg:w-[60%] order-2 lg:order-1 self-start">
             <div className="relative aspect-[4/5] w-full rounded-sm overflow-hidden shadow-2xl bg-ink/5 border border-ink/10 group">
                <Image 
                  src={optimizedUrl(getImageUrl(artwork))} 
                  alt={artwork.title} 
                  fill
                  priority
                  className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88eJNPAAIvwNIGP1SswAAAABJRU5ErkJggg=="
                />
                <div className="absolute inset-0 bg-ink/10 mix-blend-overlay"></div>
             </div>
             
             {/* Subtle technical metadata below image */}
             <div className="mt-8 flex gap-8 font-mono text-[9px] uppercase tracking-widest opacity-40">
                <div className="flex flex-col gap-1">
                  <span>Medium</span>
                  <span className="opacity-100 text-ink">{artwork.medium || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span>Dimensions</span>
                  <span className="opacity-100 text-ink">{artwork.dimensions || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span>Ref ID</span>
                  <span className="opacity-100 text-ink truncate max-w-[50px]">{artwork._id}</span>
                </div>
             </div>
          </div>

          {/* CONTENT SIDE - RIGHT */}
          <div className="w-full lg:w-[40%] flex flex-col pt-4 order-1 lg:order-2">
            
            {/* Header info */}
            <header className="mb-12 border-b border-ink/10 pb-8 flex flex-col gap-4">
               <div className="flex flex-col gap-1">
                  <span className="font-sans text-[10px] uppercase tracking-[0.4em] text-ink opacity-40 font-bold">{artwork.subcategory || 'Original Collection'}</span>
                  <h1 className="font-serif text-5xl md:text-6xl tracking-tighter text-ink leading-tight">{artwork.title}</h1>
               </div>
               <div className="mt-4">
                  <span className="font-serif text-3xl md:text-4xl text-ink items-center flex gap-3">
                    <span className="text-xl opacity-30">₹</span>
                    {artwork.price}.00
                  </span>
               </div>
            </header>

            {/* Description Body */}
            <div className="mb-12">
               <h3 className="text-[10px] uppercase tracking-widest opacity-40 mb-6 font-bold">Curatorial Description</h3>
               <p className="font-sans text-sm md:text-base leading-relaxed text-ink/80 opacity-90 first-letter:text-4xl first-letter:font-serif first-letter:mr-3 first-letter:float-left first-letter:leading-none first-letter:opacity-50">
                  {artwork.description}
               </p>
            </div>

            {/* CTA SECTION */}
            <div className="mt-auto space-y-8 pt-8 border-t border-ink/10">
               <div className="flex flex-col gap-4">
                  <p className="text-[10px] uppercase tracking-widest opacity-50 flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Available for acquisition
                  </p>
                  
                  {/* BUTTON CLIENT COMPONENT */}
                  <OrderButton 
                    artworkId={artwork._id} 
                    title={artwork.title} 
                    price={artwork.price} 
                  />

               </div>

               {/* Secure Badges */}
               <div className="grid grid-cols-2 gap-4 text-[9px] uppercase tracking-widest opacity-30">
                  <div className="p-3 border border-ink/10 flex items-center justify-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Razorpay Secure
                  </div>
                  <div className="p-3 border border-ink/10 flex items-center justify-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2 2 2 0 012 2v.65l2.35 2.35M15 11h.5"></path></svg>
                    Global Shipping
                  </div>
               </div>
            </div>

          </div>

        </div>

      </main>
    </PageTransition>
  );
}
