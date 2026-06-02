import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@sanity/client";
import { env } from "@/config/env";

export const dynamic = "force-dynamic";

const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-03-22",
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

export async function POST(request: Request) {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  if (!userId) {
    return NextResponse.json({ error: "User ID not found in session" }, { status: 400 });
  }

  try {
    const { itemId, action } = await request.json();

    if (!itemId || !action || !["like", "unlike"].includes(action)) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    // Retrieve current document to verify existence and get current likes
    const doc = await backendClient.fetch(
      `*[_id == $id][0] { _id, likes }`,
      { id: itemId }
    );

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    let likes = doc.likes || [];

    if (action === "like") {
      if (!likes.includes(userId)) {
        likes = [...likes, userId];
      }
    } else if (action === "unlike") {
      likes = likes.filter((id: string) => id !== userId);
    }

    // Mutate document
    const updatedDoc = await backendClient
      .patch(itemId)
      .set({ likes })
      .commit();

    return NextResponse.json({ 
      success: true, 
      likes: updatedDoc.likes || [] 
    });
  } catch (error: any) {
    console.error("Gallery Like Route Error:", error.message);
    return NextResponse.json({ error: "Failed to update like status" }, { status: 500 });
  }
}
