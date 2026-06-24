import type { Metadata } from 'next';
import { PageTransition } from '@/components/layout/PageTransition';
import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Founding Vision & Philosophy',
  description: 'Learn about the founding vision and artistic philosophy of The Virtual Canvas. Bridging traditional mastery with digital exploration through a specialized network of master artists.',
};


const aboutSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": "https://thevirtualcanvas.com/about#webpage",
      "url": "https://thevirtualcanvas.com/about",
      "name": "Founding Vision & Philosophy | The Virtual Canvas",
      "description": "Learn about the founding vision and artistic philosophy of The Virtual Canvas. Bridging traditional mastery with digital exploration through a specialized network of master artists.",
      "isPartOf": {
        "@id": "https://thevirtualcanvas.com/#website"
      },
      "breadcrumb": {
        "@id": "https://thevirtualcanvas.com/about/#breadcrumb"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://thevirtualcanvas.com/about/#breadcrumb",
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
          "name": "About",
          "item": "https://thevirtualcanvas.com/about"
        }
      ]
    }
  ]
};

export default function AboutPage() {
  return (
    <PageTransition>
      <JsonLd schema={aboutSchema} />
      <main className="min-h-screen w-full relative pt-24 md:pt-36 bg-canvas selection:bg-ink selection:text-canvas">
        {/* ── Hero Section ────────────────────────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-20 mb-20 md:mb-40">
          <div className="max-w-7xl mx-auto">
            <header className="mb-16 md:mb-24">
              <h1 className="font-serif text-5xl sm:text-7xl md:text-[8rem] lg:text-[10rem] tracking-tighter leading-[0.85] text-ink mb-12">
                Founding <br /> Vision
              </h1>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
                <p className="font-sans text-xs md:text-sm uppercase tracking-[0.4em] opacity-40 font-bold max-w-sm leading-relaxed">
                  BRIDGING THE GAP BETWEEN TRADITIONAL MASTERY AND DIGITAL EXPLORATION.
                </p>
                <div className="w-full md:w-1/2 h-[1px] bg-ink/10 mb-2 origin-left scale-x-100" />
              </div>
            </header>

            <div className="relative w-full aspect-[21/9] overflow-hidden rounded-sm group">
              <Image 
                src="/images/about-vision.png" 
                alt="Studio Abstract Vision" 
                fill 
                className="object-cover transition-transform duration-[3000ms] ease-out group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-ink/5 mix-blend-multiply" />
            </div>
          </div>
        </section>

        {/* ── Philosophy Section ───────────────────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-20 py-20 md:py-40 bg-ink text-canvas">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-center">
            <div className="w-full lg:w-1/2">
               <h2 className="font-serif text-4xl md:text-6xl tracking-tight mb-8 leading-tight">
                 The Digital <br /> Renaissance
               </h2>
               <div className="space-y-6 opacity-70 text-sm md:text-base leading-relaxed font-sans max-w-lg">
                 <p>
                   At The Virtual Canvas, we believe that art is an evolving conversation. The brush may have changed, but the intent—the pursuit of beauty, emotion, and precision—remains sacred.
                 </p>
                 <p>
                   Founded by artists who spent years mastering the physical medium, our studio was born from a desire to see if the soul of a painting could survive the transition to the screen. 
                 </p>
                 <p>
                   Today, we collaborate with specialized masters across the globe to bring high-fidelity visions to life, ensuring every pixel carries the weight of a brushstroke.
                 </p>
               </div>
            </div>
            <div className="w-full lg:w-1/2 relative aspect-square lg:aspect-[4/5] border border-canvas/10 p-4">
               <div className="relative w-full h-full overflow-hidden">
                  <Image 
                    src="/images/about-vision.png" 
                    alt="Artistic Detail" 
                    fill 
                    className="object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000"
                  />
               </div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-canvas/20 rounded-full animate-[pulse_8s_infinite] pointer-events-none" />
            </div>
          </div>
        </section>

        {/* ── Values Grid ────────────────────────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-20 py-20 md:py-40">
           <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-4 mb-16">
                 <div className="w-2 h-2 rounded-full bg-ink" />
                 <span className="font-sans text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Core Protocol</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
                 <div className="flex flex-col gap-6">
                    <span className="font-serif text-3xl italic opacity-20">01</span>
                    <h3 className="font-serif text-2xl font-bold">Uncompromising Fidelity</h3>
                    <p className="font-sans text-xs md:text-sm leading-relaxed opacity-50">
                      We reject the generic. Every piece is a unique architectural build of lighting, texture, and creative nuance.
                    </p>
                 </div>
                 <div className="flex flex-col gap-6 border-t md:border-t-0 md:border-l border-ink/5 pt-8 md:pt-0 md:pl-8">
                    <span className="font-serif text-3xl italic opacity-20">02</span>
                    <h3 className="font-serif text-2xl font-bold">Master Specialized Artists</h3>
                    <p className="font-sans text-xs md:text-sm leading-relaxed opacity-50">
                      Our network consists exclusively of masters in their field—whether pencil sketching or hyper-realistic oil painting.
                    </p>
                 </div>
                 <div className="flex flex-col gap-6 border-t md:border-t-0 md:border-l border-ink/5 pt-8 md:pt-0 md:pl-8">
                    <span className="font-serif text-3xl italic opacity-20">03</span>
                    <h3 className="font-serif text-2xl font-bold">Bespoke Privacy</h3>
                    <p className="font-sans text-xs md:text-sm leading-relaxed opacity-50">
                      Your vision is yours alone. We maintain strict confidentiality protocols for every private commission.
                    </p>
                 </div>
              </div>
           </div>
        </section>

        {/* ── Call to Action ─────────────────────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-20 py-32 md:py-48 bg-canvas flex flex-col items-center text-center">
           <h2 className="font-serif text-4xl md:text-6xl tracking-tight mb-12 text-ink">Ready to begin?</h2>
           <Link 
             href="/contact" 
             className="group relative px-12 py-5 font-sans text-xs uppercase tracking-[0.3em] font-bold border border-ink overflow-hidden transition-colors"
           >
             <span className="relative z-10 group-hover:text-canvas transition-colors duration-500">Contact Studio</span>
             <div className="absolute inset-0 bg-ink scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
           </Link>
        </section>
      </main>
    </PageTransition>
  );
}
