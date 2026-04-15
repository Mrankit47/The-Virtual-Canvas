import { client } from '@/lib/sanity';
import { PageTransition } from '@/components/layout/PageTransition';
import { OrderPageClient } from '@/components/studio/OrderPageClient';

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
          _id, label, description, multiplier
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

  return (
    <PageTransition>
      <OrderPageClient styles={styles} sizes={sizes} papers={papers} />
    </PageTransition>
  );
}
