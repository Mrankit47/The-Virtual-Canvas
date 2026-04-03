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

export async function GET(request: Request) {
  const session: any = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, email } = session.user;

  try {
    let query = "";
    let params: any = {};

    if (role === "admin") {
      // ADMIN: Fetch everything
      query = `*[_type == "order"] | order(createdAt desc) {
        ...,
        assignedArtist->{ name, email }
      }`;
    } else if (role === "artist") {
      // ARTIST: Fetch only assigned orders (Mask Price)
      query = `*[_type == "order" && assignedArtist->email == $email] | order(createdAt desc) {
        ...,
        "price": null
      }`;
      params = { email };
    } else {
      // USER: Fetch only their own orders
      query = `*[_type == "order" && userEmail == $email] | order(createdAt desc) {
        ...
      }`;
      params = { email };
    }

    const orders = await backendClient.fetch(query, params);
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Fetch Orders Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
