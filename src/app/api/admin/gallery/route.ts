import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { createClient } from '@sanity/client';
import { env } from '@/config/env';
import { triggerArtworkAutomation } from "@/services/aiAutomation";

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
      `*[_type == "gallery"] | order(_createdAt desc) {
        _id, title, imageSource, imageUrl,
        "image": image.asset->url,
        category
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
    const { id, title, imageUrl, categoryRef } = await request.json();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const doc: any = {
      _type: 'gallery',
      title,
      category: categoryRef ? { _type: 'reference', _ref: categoryRef } : undefined,
    };
    if (imageUrl) { doc.imageUrl = imageUrl; doc.imageSource = 'cloudinary'; }

    if (id) {
      const result = await backendClient.patch(id).set(doc).commit();
      return NextResponse.json({ success: true, item: result });
    } else {
      if (!imageUrl) return NextResponse.json({ error: "Image is required" }, { status: 400 });
      const result = await backendClient.create(doc);
      
      console.log(`✅ [Gallery Upload] Gallery upload success: ${result.title} (ID: ${result._id})`);
      
      // Trigger AI platform ingestion in background (non-blocking)
      triggerArtworkAutomation(result.title, result.imageUrl || imageUrl).catch((error) => {
        console.error("❌ [Gallery Upload] Background AI trigger failed:", error);
      });

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
