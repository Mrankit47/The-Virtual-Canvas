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

    const artworks = await backendClient.fetch(
      `*[_type == "artwork" && isArtistUpload != true] | order(createdAt desc) {
        _id,
        title,
        description,
        imageUrl,
        imageSource,
        "image": image.asset->url,
        postType,
        isPhotography,
        isFeatured,
        price,
        category,
        subcategory,
        medium,
        dimensions,
        tags,
        createdAt
      }`
    );

    return NextResponse.json(artworks);
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

    const data = await request.json();
    const { 
      id,
      title, 
      description, 
      price, 
      imageUrl, 
      postType, 
      isPhotography, 
      isFeatured,
      categoryRef, 
      subcategory,
      medium,
      dimensions,
      tags,
      alt,
      artistRef,
      isArtistUpload,
      createdAt
    } = data;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const doc: any = {
      _type: 'artwork',
      title,
      description: description || '',
      price: postType === 'marketplace' ? Number(price) : 0,
      postType: postType || 'gallery',
      isPhotography: !!isPhotography,
      isFeatured: !!isFeatured,
      isArtistUpload: !!isArtistUpload,
      category: categoryRef ? { 
        _type: 'reference', 
        _ref: categoryRef,
      } : undefined,
      artist: artistRef ? {
        _type: 'reference',
        _ref: artistRef,
      } : undefined,
      subcategory: subcategory || '',
      medium: medium || '',
      dimensions: dimensions || '',
      tags: (typeof tags === 'string' && tags.trim()) ? tags.split(',').map((t: string) => t.trim()) : (Array.isArray(tags) ? tags : []),
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
      return NextResponse.json({ success: true, artwork: result });
    } else {
      doc.slug = { _type: 'slug', current: title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() };
      const result = await backendClient.create(doc);
      return NextResponse.json({ success: true, artwork: result });
    }
  } catch (error: any) {
    console.error("Admin Artwork Create Error:", error);
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
