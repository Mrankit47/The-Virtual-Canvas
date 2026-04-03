import { client } from '@/sanity/client';
import { GET_PHOTOGRAPHY_QUERY } from '@/sanity/queries';
import { PageTransition } from '@/components/layout/PageTransition';
import { PhotographyClient } from '@/components/gallery/PhotographyClient';

export const revalidate = 60;

export default async function PhotographyPage() {
  const photos = await client.fetch(GET_PHOTOGRAPHY_QUERY);

  return (
    <PageTransition>
      <main className="min-h-screen w-full relative pt-32 px-6 md:px-12 pb-24 bg-[#111] text-[#f5f5f0] transition-colors duration-1000 -mt-24">
        <div className="max-w-screen-2xl mx-auto pt-12 md:pt-24">
          <header className="mb-16 md:mb-24 flex flex-col md:flex-row justify-between items-end gap-6 text-[#f5f5f0]">
            <h1 className="font-serif text-5xl md:text-7xl tracking-tighter">Photography</h1>
            <p className="font-sans text-[10px] md:text-xs uppercase tracking-[0.3em] opacity-60">Moments frozen in time.</p>
          </header>

          <PhotographyClient photos={photos} />
        </div>
      </main>
    </PageTransition>
  );
}
