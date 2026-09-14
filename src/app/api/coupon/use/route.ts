import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { env } from '@/config/env';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rateLimit";

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { success } = await limiter.check(5, ip);
    if (!success) {
      return rateLimitResponse(60);
    }

    const session: any = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

    const coupon = await backendClient.fetch(
      `*[_type == "coupon" && code == $code][0]`,
      { code: code.trim().toUpperCase() }
    );

    if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    if (!coupon.isActive) return NextResponse.json({ error: 'Coupon is not active' }, { status: 400 });

    await backendClient
      .patch(coupon._id)
      .inc({ usedCount: 1 })
      .commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Coupon use increment error:', error);
    return NextResponse.json({ error: 'Failed to increment usage' }, { status: 500 });
  }
}
