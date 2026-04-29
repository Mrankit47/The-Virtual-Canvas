import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { createClient } from '@sanity/client';
import { env } from '@/config/env';

const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'artist') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const artistId = session.user.id;
    const sales = await backendClient.fetch(
      `*[_type == "sale" && artist._ref == $artistId] | order(createdAt desc) {
        _id,
        amount,
        createdAt,
        buyerEmail,
        artwork->{
            title,
            imageUrl
        }
      }`,
      { artistId }
    );

    return NextResponse.json(sales);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
