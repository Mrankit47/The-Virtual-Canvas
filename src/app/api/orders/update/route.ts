import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { createClient } from '@sanity/client';
import { env } from "@/config/env";
import { sendNotificationEmail } from "@/lib/email";

const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-03-22",
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

const VALID_NEXT_STATES: Record<string, string[]> = {
  pending: ["paid", "cancelled"],
  paid: ["assigned", "cancelled"],
  assigned: ["progress", "pending"],
  progress: ["review", "completed"],
  review: ["completed", "progress"],
  completed: [],
  cancelled: ["pending"],
};

export async function POST(request: Request) {
  const session: any = await getServerSession(authOptions);

  if (!session || (session.user.role !== "artist" && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const { orderId, status, note, progress, artworkUrl } = await request.json();

  if (!orderId || !status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const role = session.user.role;

    // 1. Fetch current order
    const order = await backendClient.fetch(
        `*[_type == "order" && _id == $orderId][0]`,
        { orderId }
    );

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Status Transition Guard
    if (role !== "admin" && !VALID_NEXT_STATES[order.orderStatus]?.includes(status)) {
        return NextResponse.json({ 
            error: `Invalid transition from ${order.orderStatus} to ${status}` 
        }, { status: 400 });
    }

    // 2. Role-specific logic
    let artistDocId = null;

    if (role === "artist") {
        const artist = await backendClient.fetch(
            `*[_type == "userProfile" && email == $email][0]`,
            { email: session.user.email }
        );
        if (!artist) return NextResponse.json({ error: "Artist profile not found" }, { status: 404 });
        if (order.assignedArtist?._ref !== artist._id) {
            return NextResponse.json({ error: "This order is not assigned to you" }, { status: 403 });
        }
        artistDocId = artist._id;
    }

    // 3. Create Order Update record
    await backendClient.create({
        _type: "orderUpdate",
        order: { _type: "reference", _ref: orderId },
        artist: artistDocId ? { _type: "reference", _ref: artistDocId } : undefined,
        note: note || `Status updated to ${status} by ${role}`,
        progress: progress || (status === 'completed' ? 100 : 0),
        createdAt: new Date().toISOString(),
    });

    // 4. Update Main Order
    const updateData: any = { orderStatus: status };
    if (artworkUrl) updateData.artworkUrl = artworkUrl;

    const updatedOrder = await backendClient
      .patch(orderId)
      .set(updateData)
      .commit();

    // 5. TRIGGER NOTIFICATION: Progress/Completion
    const notifType = status === 'completed' ? 'completed' : 'progress';
    try {
        await Promise.all([
            backendClient.create({
                _type: 'notification',
                userEmail: order.userEmail,
                message: status === 'completed' 
                    ? `Your artwork for order #${order.orderId} is now complete!` 
                    : `New progress update for #${order.orderId}: ${progress || 0}% complete.`,
                type: notifType,
                orderId: order.orderId,
                linkedOrderId: orderId,
                read: false,
            }),
            sendNotificationEmail(order.userEmail, notifType, order.orderId, { note, progress })
        ]);
    } catch (notifErr) {
        console.error("Update notifications failed:", notifErr);
    }

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error("Update Order Error:", error.message);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
