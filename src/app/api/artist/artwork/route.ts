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
    const artworks = await backendClient.fetch(
      `*[_type == "artwork" && artist._ref == $artistId] | order(createdAt desc)`,
      { artistId }
    );

    return NextResponse.json(artworks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'artist') {
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
        categoryRef, 
        subcategory,
        medium,
        dimensions,
        tags
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
      category: categoryRef ? { 
          _type: 'reference', 
          _ref: categoryRef,
      } : undefined,
      subcategory: subcategory || '',
      medium: medium || '',
      dimensions: dimensions || '',
      tags: (typeof tags === 'string' && tags.trim()) ? tags.split(',').map((t: string) => t.trim()) : (Array.isArray(tags) ? tags : []),
    };

    if (imageUrl) {
        doc.imageUrl = imageUrl;
        doc.imageSource = 'cloudinary';
    }

    if (id) {
        // Update Existing
        const result = await backendClient.patch(id).set(doc).commit();
        return NextResponse.json({ success: true, artwork: result });
    } else {
        // Create New
        if (!imageUrl) return NextResponse.json({ error: "Image is required for new posts" }, { status: 400 });
        
        doc.slug = { _type: 'slug', current: title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() };
        doc.artist = { _type: 'reference', _ref: session.user.id };
        doc.isArtistUpload = true;
        doc.createdAt = new Date().toISOString();

        const result = await backendClient.create(doc);
        return NextResponse.json({ success: true, artwork: result });
    }
  } catch (error: any) {
    console.error("Artwork Create Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    try {
      const session: any = await getServerSession(authOptions);
      if (!session || session.user?.role !== 'artist') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const { id } = await request.json();
      if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  
      // Verify ownership before deleting
      const artwork = await backendClient.fetch(`*[_type == "artwork" && _id == $id][0]`, { id });
      if (!artwork || artwork.artist?._ref !== session.user.id) {
          return NextResponse.json({ error: "Unauthorized or not found" }, { status: 403 });
      }
  
      await backendClient.delete(id);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
