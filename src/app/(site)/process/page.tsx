import type { Metadata } from 'next';
import { client } from '@/lib/sanity';
import { PageTransition } from '@/components/layout/PageTransition';
import { ProcessTimeline } from '@/components/process/ProcessTimeline';
import { ProcessComparison } from '@/components/process/ProcessComparison';
import { GET_PROCESS_STEPS_QUERY } from '@/sanity/queries';
import { getImageUrl } from '@/lib/imageResolver';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Our Creation Process',
  description: 'Witness the step-by-step evolution of custom sketches and paintings. Learn how we bridge traditional master techniques with digital fidelity.',
};


export const revalidate = 60; // ISR cache regeneration

export default async function ProcessPage() {
  const steps = await client.fetch(GET_PROCESS_STEPS_QUERY);

  // Identify comparison steps
  const step1 = steps.find((s: any) => s.stepNumber === 1);
  const step6 = steps.find((s: any) => s.stepNumber === 6) || (steps.length > 1 ? steps[steps.length - 1] : null);

  const beforeUrl = step1 ? getImageUrl(step1) : '';
  const afterUrl = step6 ? getImageUrl(step6) : '';

  const howToSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://thevirtualcanvas.com/process#webpage",
        "url": "https://thevirtualcanvas.com/process",
        "name": "Artistry & Creation Process | The Virtual Canvas",
        "description": "Witness the step-by-step evolution of a masterpiece. Learn about the custom art creation process at The Virtual Canvas.",
        "isPartOf": {
          "@id": "https://thevirtualcanvas.com/#website"
        },
        "breadcrumb": {
          "@id": "https://thevirtualcanvas.com/process/#breadcrumb"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://thevirtualcanvas.com/process/#breadcrumb",
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
            "name": "Process",
            "item": "https://thevirtualcanvas.com/process"
          }
        ]
      },
      {
        "@type": "HowTo",
        "name": "Custom Artwork Creation Process",
        "description": "How custom master drawings and sketches are created step-by-step at The Virtual Canvas.",
        "step": steps.map((s: any, idx: number) => ({
          "@type": "HowToStep",
          "position": idx + 1,
          "name": s.title || `Step ${s.stepNumber}`,
          "text": s.description || '',
          "image": getImageUrl(s) !== '/placeholder.png' ? getImageUrl(s) : undefined
        }))
      }
    ]
  };

  return (
    <PageTransition>
      <JsonLd schema={howToSchema} />
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
