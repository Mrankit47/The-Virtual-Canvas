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
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const items = await backendClient.fetch(
      `*[_type == "photography"] | order(createdAt desc) {
        _id, title, imageSource, imageUrl,
        "image": image.asset->url,
        category, location, capturedAt, tags, isFeatured, createdAt
      }`
    );
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id, title, imageUrl, categoryRef, location, capturedAt, tags, isFeatured, alt, createdAt } = await request.json();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const doc: any = {
      _type: 'photography',
      title,
      location: location || '',
      capturedAt: capturedAt || undefined,
      isFeatured: !!isFeatured,
      tags: (typeof tags === 'string' && tags.trim()) ? tags.split(',').map((t: string) => t.trim()) : (Array.isArray(tags) ? tags : []),
      category: categoryRef ? { _type: 'reference', _ref: categoryRef } : undefined,
      createdAt: createdAt || new Date().toISOString(),
    };

    if (imageUrl) {
      doc.imageUrl = imageUrl;
      doc.imageSource = 'cloudinary';
      doc.image = {
        _type: 'image',
        alt: alt || title,
      };
    } else if (alt) {
      doc.image = {
        ...doc.image,
        alt: alt
      };
    }

    if (id) {
      const result = await backendClient.patch(id).set(doc).commit();
      return NextResponse.json({ success: true, item: result });
    } else {
      const result = await backendClient.create(doc);
      return NextResponse.json({ success: true, item: result });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await backendClient.delete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
