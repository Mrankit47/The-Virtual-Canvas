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

export async function POST(request: Request) {
  const session: any = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { orderId, artistId } = await request.json();

  if (!orderId || !artistId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // 1. Fetch Order and Artist details for notification
    const [order, artist] = await Promise.all([
        backendClient.fetch(`*[_type == "order" && _id == $orderId][0]`, { orderId }),
        backendClient.fetch(`*[_type == "userProfile" && _id == $artistId][0]`, { artistId })
    ]);

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!artist) return NextResponse.json({ error: "Artist not found" }, { status: 404 });

    // 2. Perform Assignment
    const updatedOrder = await backendClient
      .patch(orderId)
      .set({
        assignedArtist: {
          _type: "reference",
          _ref: artistId,
        },
        orderStatus: "assigned",
      })
      .commit();

    // 3. Trigger Notifications
    try {
        await Promise.all([
            // Notify User
            backendClient.create({
                _type: 'notification',
                userEmail: order.userEmail,
                message: `Artist ${artist.name} has been assigned to your order #${order.orderId}.`,
                type: 'assigned',
                orderId: order.orderId,
                linkedOrderId: orderId,
                read: false,
            }),
            sendNotificationEmail(order.userEmail, 'assigned', order.orderId, { artistName: artist.name }),
            
            // Notify Artist
            backendClient.create({
                _type: 'notification',
                userEmail: artist.email,
                message: `You have been assigned a new commission order: #${order.orderId}.`,
                type: 'assigned',
                orderId: order.orderId,
                linkedOrderId: orderId,
                read: false,
            })
        ]);
    } catch (notifErr) {
        console.error("Assignment notifications failed:", notifErr);
    }

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error("Assign Artist Error:", error.message);
    return NextResponse.json({ error: "Failed to assign artist" }, { status: 500 });
  }
}
