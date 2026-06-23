import { client } from '@/lib/sanity';
import { PageTransition } from '@/components/layout/PageTransition';
import { OrderPageClient } from '@/components/studio/OrderPageClient';
import JsonLd from '@/components/seo/JsonLd';

export const revalidate = 0; // Ensure live data for price configurator

export default async function OrderPage() {
  // Fetch configurator options server-side (parallel)
  let styles: any[] = [];
  let sizes: any[] = [];
  let papers: any[] = [];

  try {
    [styles, sizes, papers] = await Promise.all([
      client.fetch(`
        *[_type == "artStyle" && isActive != false] | order(order asc) {
          _id, title, description, basePrice, requiresReference,
          "imageUrl": image.asset->url
        }
      `),
      client.fetch(`
        *[_type == "sizeOption" && isActive != false] | order(order asc) {
          _id, label, description, multiplier, framePrice
        }
      `),
      client.fetch(`
        *[_type == "paperType" && isActive != false] | order(order asc) {
          _id, title, description, extraCost
        }
      `),
    ]);
  } catch (err) {
    console.error('Failed to fetch studio options:', err);
    // Page still renders — shows empty states in configurator
  }

  const orderSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://thevirtualcanvas.com/order#webpage",
        "url": "https://thevirtualcanvas.com/order",
        "name": "Custom Artwork Price Configurator | The Virtual Canvas",
        "description": "Configure and order custom sketch or painting commissions. Choose art style, paper size, framings, and upload reference image for a personalized commission.",
        "isPartOf": {
          "@id": "https://thevirtualcanvas.com/#website"
        },
        "breadcrumb": {
          "@id": "https://thevirtualcanvas.com/order/#breadcrumb"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://thevirtualcanvas.com/order/#breadcrumb",
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
            "name": "Order Now",
            "item": "https://thevirtualcanvas.com/order"
          }
        ]
      },
      ...styles.map((s: any) => ({
        "@type": "Service",
        "name": `Custom ${s.title} Commission`,
        "description": s.description || `Custom commission in ${s.title} style.`,
        "provider": {
          "@type": "Organization",
          "name": "The Virtual Canvas",
          "url": "https://thevirtualcanvas.com/"
        },
        "offers": {
          "@type": "Offer",
          "price": s.basePrice,
          "priceCurrency": "INR"
        }
      }))
    ]
  };

  return (
    <PageTransition>
      <JsonLd schema={orderSchema} />
      <OrderPageClient styles={styles} sizes={sizes} papers={papers} />
    </PageTransition>
  );
}
