import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "next-sanity";
import { env } from "@/config/env";

const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-03-22",
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

export async function GET() {
  const session: any = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = session.user;

  try {
    const notifications = await backendClient.fetch(
      `*[_type == "notification" && userEmail == $email] | order(createdAt desc) {
        _id, message, type, orderId, linkedOrderId, read, createdAt
      }`, 
      { email }
    );
    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error("Fetch Notifications Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
    const session: any = await getServerSession(authOptions);
  
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  
    const { notificationId, markAll } = await request.json();
  
    try {
      if (markAll) {
        // Bulk update using Sanity's multiple mutations or a query-based mutation
        // For simplicity and safety with many notifications, we fetch IDs first
        const unread = await backendClient.fetch(
          `*[_type == "notification" && userEmail == $email && read == false]._id`,
          { email: session.user.email }
        );

        const transaction = backendClient.transaction();
        unread.forEach((id: string) => {
          transaction.patch(id, { set: { read: true } });
        });
        
        await transaction.commit();
        return NextResponse.json({ success: true, count: unread.length });
      }

      if (!notificationId) {
        return NextResponse.json({ error: "Missing ID" }, { status: 400 });
      }

      await backendClient
        .patch(notificationId)
        .set({ read: true })
        .commit();
  
      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("Update Notification Error:", error.message);
      return NextResponse.json({ error: "Failed to update notification(s)" }, { status: 500 });
    }
}
