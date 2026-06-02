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

// Helper to generate a unique key for Sanity array items
function generateKey() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

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
    const { itemId, text } = await request.json();

    if (!itemId || !text || !text.trim()) {
      return NextResponse.json({ error: "Invalid comment payload" }, { status: 400 });
    }

    // Verify document exists
    const doc = await backendClient.fetch(
      `*[_id == $id][0] { _id }`,
      { id: itemId }
    );

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const newComment = {
      _key: generateKey(),
      userId,
      userName: session.user.name || session.user.email?.split("@")[0] || "Anonymous",
      userImage: session.user.image || "",
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    // Patch array in Sanity
    const updatedDoc = await backendClient
      .patch(itemId)
      .setIfMissing({ comments: [] })
      .append("comments", [newComment])
      .commit();

    return NextResponse.json({
      success: true,
      comments: updatedDoc.comments || [],
    });
  } catch (error: any) {
    console.error("Add Comment Route Error:", error.message);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const userRole = session.user.role;

  try {
    const { itemId, commentKey } = await request.json();

    if (!itemId || !commentKey) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    // Fetch the document and verify comment ownership
    const doc = await backendClient.fetch(
      `*[_id == $id][0] { _id, comments }`,
      { id: itemId }
    );

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const comments = doc.comments || [];
    const commentToDelete = comments.find((c: any) => c._key === commentKey);

    if (!commentToDelete) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check authorization: only the author or an admin can delete the comment
    if (commentToDelete.userId !== userId && userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden: You cannot delete this comment" }, { status: 403 });
    }

    // Perform the unset operation in Sanity
    const updatedDoc = await backendClient
      .patch(itemId)
      .unset([`comments[_key == "${commentKey}"]`])
      .commit();

    return NextResponse.json({
      success: true,
      comments: updatedDoc.comments || [],
    });
  } catch (error: any) {
    console.error("Delete Comment Route Error:", error.message);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
