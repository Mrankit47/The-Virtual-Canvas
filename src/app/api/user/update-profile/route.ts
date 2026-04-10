import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from 'next-sanity';
import { env } from '@/config/env';

const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, mobile, image } = await request.json();
    const userId = (session.user as any).id;

    // Filter out undefined fields to avoid overriding with nulls
    const updateData: any = {};
    if (name) updateData.name = name;
    if (mobile) updateData.mobileNumber = mobile;
    if (image) updateData.image = image;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    await backendClient
      .patch(userId)
      .set(updateData)
      .commit();

    return NextResponse.json({ 
      success: true, 
      message: "Profile updated successfully",
      updatedFields: updateData
    });
  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
