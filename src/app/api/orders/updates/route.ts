import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { createClient } from '@sanity/client';
import { env } from "@/config/env";

const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-03-22",
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

export async function GET(request: Request) {
  const session: any = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!orderId) {
    return NextResponse.json({ error: "Missing Order ID" }, { status: 400 });
  }

  try {
    // 1. Double check order ownership
    const order = await backendClient.fetch(
        `*[_type == "order" && _id == $orderId][0]`,
        { orderId }
    );

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    
    // Allow if user is owner, assigned artist, or admin
    const email = session.user.email;
    const isOwner = order.userEmail === email;
    const isAdmin = session.user.role === 'admin';
    const isArtist = session.user.role === 'artist';

    if (!isOwner && !isAdmin && !isArtist) {
        return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    // 2. Fetch updates
    const updates = await backendClient.fetch(
      `*[_type == "orderUpdate" && order._ref == $orderId] | order(createdAt desc) {
        _id, note, progress, createdAt,
        artist->{ name }
      }`, 
      { orderId }
    );

    return NextResponse.json(updates);
  } catch (error: any) {
    console.error("Fetch Updates Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch order updates" }, { status: 500 });
  }
}
