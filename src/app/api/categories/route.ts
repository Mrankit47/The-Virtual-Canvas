import { NextResponse } from "next/server";
import { createClient } from '@sanity/client';
import { env } from '@/config/env';

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: true,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const schemaType = type === 'photography' ? 'photographyCategory' : 'category';

    const categories = await client.fetch(`*[_type == "${schemaType}"] | order(order asc)`);
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
