import { client } from '@/lib/sanity';
import { PageTransition } from '@/components/layout/PageTransition';
import { ProcessTimeline } from '@/components/process/ProcessTimeline';
import { ProcessComparison } from '@/components/process/ProcessComparison';
import { GET_PROCESS_STEPS_QUERY } from '@/sanity/queries';
import { getImageUrl } from '@/lib/imageResolver';

export const revalidate = 60; // ISR cache regeneration

export default async function ProcessPage() {
  const steps = await client.fetch(GET_PROCESS_STEPS_QUERY);

  // Identify comparison steps
  const step1 = steps.find((s: any) => s.stepNumber === 1);
  const step6 = steps.find((s: any) => s.stepNumber === 6) || (steps.length > 1 ? steps[steps.length - 1] : null);

  const beforeUrl = step1 ? getImageUrl(step1) : '';
  const afterUrl = step6 ? getImageUrl(step6) : '';

  return (
    <PageTransition>
      <main className="min-h-[85vh] w-full relative pt-32 px-6 md:px-12 pb-24 font-sans max-w-[1600px] mx-auto">
        <header className="mb-4 md:mb-12 flex flex-col items-center justify-center text-center">
          <h1 className="font-serif text-5xl md:text-7xl tracking-tighter text-ink mb-6">The Process</h1>
          <p className="font-sans text-[10px] md:text-xs uppercase tracking-[0.3em] opacity-60 max-w-xl mx-auto">
            Witness the evolution of a masterpiece.
          </p>
        </header>

        <ProcessTimeline steps={steps} />

        {beforeUrl && afterUrl && beforeUrl !== '/placeholder.png' && afterUrl !== '/placeholder.png' && (
          <ProcessComparison 
            beforeUrl={beforeUrl} 
            afterUrl={afterUrl}
            beforeTitle="Sketch Vision"
            afterTitle="Final Masterpiece"
          />
        )}
      </main>
    </PageTransition>
  );
}
