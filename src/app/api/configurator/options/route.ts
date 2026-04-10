import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { env } from '@/config/env';

const readClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: true, // OK for reads — options don't change often
});

export async function GET() {
  try {
    const [styles, sizes, papers] = await Promise.all([
      readClient.fetch(`
        *[_type == "artStyle" && isActive == true] | order(order asc) {
          _id, title, description, basePrice, requiresReference,
          "imageUrl": image.asset->url
        }
      `),
      readClient.fetch(`
        *[_type == "sizeOption" && isActive == true] | order(order asc) {
          _id, label, description, multiplier
        }
      `),
      readClient.fetch(`
        *[_type == "paperType" && isActive == true] | order(order asc) {
          _id, title, description, extraCost
        }
      `),
    ]);

    return NextResponse.json(
      { styles, sizes, papers },
      {
        headers: {
          // Cache for 60s at edge — options don't change frequently
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    console.error('Configurator options fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load configurator options' },
      { status: 500 }
    );
  }
}
