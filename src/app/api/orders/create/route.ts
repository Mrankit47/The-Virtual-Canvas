import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "next-sanity";
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

  if (!session || session.user.role !== "user") {
    return NextResponse.json({ error: "Only users can create artwork requests" }, { status: 403 });
  }

  const { title, description, orderType, price } = await request.json();

  if (!title || !description || !orderType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const orderId = `TVC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const newOrder = await backendClient.create({
      _type: "order",
      title,
      description,
      orderType,
      price: price || 0,
      orderId,
      customerName: session.user.name,
      userEmail: session.user.email,
      email: session.user.email, 
      orderStatus: "pending",
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
    });

    // TRIGGER NOTIFICATION: Order Created (User + All Admins)
    try {
        const admins = await backendClient.fetch(`*[_type == "userProfile" && role == "admin"].email`);

        const notifications = [
            // Notify User
            backendClient.create({
                _type: 'notification',
                userEmail: session.user.email,
                message: `Order #${orderId} received. We'll assign an artist once payment is completed.`,
                type: 'order_created',
                orderId: orderId,
                linkedOrderId: newOrder._id,
                read: false,
            }),
            // Notify All Admins
            ...admins.map((adminEmail: string) => 
                backendClient.create({
                    _type: 'notification',
                    userEmail: adminEmail,
                    message: `New Artwork Request Received: #${orderId}`,
                    type: 'order_created',
                    orderId: orderId,
                    linkedOrderId: newOrder._id,
                    read: false,
                })
            )
        ];

        await Promise.all([
            ...notifications,
            sendNotificationEmail(session.user.email, 'order_created', orderId)
        ]);
    } catch (notifErr) {
        console.error("Order creation notifications failed:", notifErr);
    }

    return NextResponse.json(newOrder);
  } catch (error: any) {
    console.error("Create Order Error:", error.message);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
