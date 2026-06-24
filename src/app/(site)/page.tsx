'use client';

import { useState, useEffect } from 'react';
import { PageTransition } from '@/components/layout/PageTransition';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ArtLoader from '@/components/ui/ArtLoader';
import JsonLd from '@/components/seo/JsonLd';

const homeSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://thevirtualcanvas.com/#organization",
      "name": "The Virtual Canvas",
      "url": "https://thevirtualcanvas.com/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://thevirtualcanvas.com/favicon-32x32.png",
        "width": 32,
        "height": 32
      },
      "description": "Premium digital art portfolio and custom artwork ordering platform by professional artists. Explore pencil sketches, oil paintings, and fine photography.",
      "sameAs": [
        "https://www.instagram.com/art_by_ankiit",
        "https://youtube.com/@artbyankiit",
        "https://whatsapp.com/channel/0029VbBOESkEAKWIxItclO10"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "support@thevirtualcanvas.com",
        "url": "https://thevirtualcanvas.com/contact"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://thevirtualcanvas.com/#website",
      "url": "https://thevirtualcanvas.com/",
      "name": "The Virtual Canvas",
      "publisher": {
        "@id": "https://thevirtualcanvas.com/#organization"
      }
    },
    {
      "@type": "WebPage",
      "@id": "https://thevirtualcanvas.com/#webpage",
      "url": "https://thevirtualcanvas.com/",
      "name": "The Virtual Canvas | Fine Art Portfolio & Custom Artwork",
      "isPartOf": {
        "@id": "https://thevirtualcanvas.com/#website"
      },
      "about": {
        "@id": "https://thevirtualcanvas.com/#organization"
      },
      "mainEntity": {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What services does The Virtual Canvas offer?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The Virtual Canvas offers premium custom artwork commissions (including pencil sketches, charcoal drawings, acrylics, and oil paintings), an online fine art gallery, and a curated fine photography showcase."
            }
          },
          {
            "@type": "Question",
            "name": "How can I order custom artwork?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "You can configure your custom artwork on our 'Order Now' page, where you choose the style (sketch, watercolor, acrylic, oil, etc.), paper size, frame, and upload a reference image. We will match your request with a specialized artist to create your masterpiece."
            }
          },
          {
            "@type": "Question",
            "name": "Do you offer international shipping?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, we ship our certified art archives globally with secure packaging to ensure your custom commission or purchased gallery piece arrives in pristine condition."
            }
          },
          {
            "@type": "Question",
            "name": "How long does a custom painting or sketch commission take?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Each piece is hand-crafted with uncompromising fidelity. Typically, custom commissions take between 1 to 4 weeks depending on the complexity, size, and selected medium, followed by global shipping."
            }
          }
        ]
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://thevirtualcanvas.com/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://thevirtualcanvas.com/"
        }
      ]
    }
  ]
};

export default function Home() {
  const { data: session } = useSession();
  const [isMounting, setIsMounting] = useState(true);
  
  useEffect(() => {
    // Artificial delay for high-end entrance feel - optimized for performance/SEO
    const timer = setTimeout(() => setIsMounting(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Words for the premium mask reveal animation
  const titleWords = ["The", "Virtual", "Canvas"];

  // Ultra-premium cubic-bezier ease out curve
  const premiumEase = [0.16, 1, 0.3, 1];

  return (
    <>
      <JsonLd schema={homeSchema} />
      <ArtLoader isVisible={isMounting} variant="fullscreen" size="lg" />
      <PageTransition>
        <main className="flex flex-col items-center justify-center min-h-[90vh] px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32 text-center select-none relative overflow-hidden">
        
        {/* Slow scaling, elegant ambient background TVC text */}
        <motion.div 
          style={{ y: y1 }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={!isMounting ? { opacity: 0.05, scale: 1 } : { opacity: 0, scale: 0.85 }}
          transition={{ duration: 2.2, ease: premiumEase, delay: 0.2 }}
          className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10"
        >
           <span className="font-serif text-[40vw] leading-none tracking-tighter text-ink whitespace-nowrap opacity-10">T V C</span>
        </motion.div>

        <motion.div style={{ opacity }} className="relative z-10 w-full">
          {/* Main Title: Premium Word Mask Reveal */}
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[8rem] tracking-tighter leading-[0.9] lg:leading-none break-words lg:whitespace-nowrap mb-6 md:mb-8 text-ink max-w-[90%] lg:max-w-none mx-auto overflow-hidden flex flex-wrap justify-center gap-y-2">
            {titleWords.map((word, index) => (
              <span key={index} className="inline-block overflow-hidden mr-[0.25em] last:mr-0 py-1 sm:py-2">
                <motion.span
                  initial={{ y: '100%', opacity: 0 }}
                  animate={!isMounting ? { y: 0, opacity: 1 } : { y: '100%', opacity: 0 }}
                  transition={{
                    duration: 1.4,
                    ease: premiumEase,
                    delay: 0.1 + index * 0.15,
                  }}
                  className="inline-block"
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>

          {/* Subheading Description with smooth slide-up reveal */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={!isMounting ? { opacity: 0.5, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ delay: 0.6, duration: 1.2, ease: premiumEase }}
            className="font-sans text-[10px] md:text-[11px] uppercase tracking-[0.3em] lg:tracking-[0.4em] max-w-[280px] sm:max-w-sm md:max-w-lg lg:max-w-xl mx-auto mb-10 lg:mb-12 leading-loose text-center text-ink"
          >
            An immersive digital exhibition of sketches, paintings, and fine photography.
          </motion.p>

          {/* Action Buttons Staggered Reveal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={!isMounting ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.8, duration: 1.2, ease: premiumEase }}
            className="flex flex-col sm:flex-row gap-4 lg:gap-5 items-center justify-center w-full px-8 sm:px-0"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Link 
                href="/gallery"
                className="group relative flex items-center justify-center w-full sm:w-auto px-10 py-3.5 lg:px-10 lg:py-4 font-sans text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-medium border border-ink/20 hover:border-ink transition-colors duration-500 overflow-hidden text-center"
              >
                <span className="relative z-10 transition-colors duration-500 group-hover:text-canvas text-ink">Enter Exhibition</span>
                <div className="absolute inset-0 bg-ink transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </Link>
            </motion.div>

            {session?.user?.role !== 'artist' && session?.user?.role !== 'admin' && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Link 
                  href="/order"
                  className="group relative flex items-center justify-center w-full sm:w-auto px-10 py-3.5 lg:px-10 lg:py-4 font-sans text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-medium border border-ink bg-ink text-canvas hover:bg-transparent hover:text-ink transition-colors duration-500 overflow-hidden text-center"
                >
                  <span className="relative z-10 transition-colors duration-500">ORDER NOW</span>
                </Link>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </main>
      </PageTransition>
    </>
  );
}
