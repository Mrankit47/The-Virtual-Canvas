import { NextResponse } from 'next/server';
import { calculateShipping } from '@/lib/shipping';
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rateLimit";

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { success } = await limiter.check(20, ip);
    if (!success) {
      return rateLimitResponse(60);
    }

    const { pincode, subtotal } = await req.json();

    if (!pincode) {
      return NextResponse.json({ error: 'Pincode is required' }, { status: 400 });
    }

    const cleanPin = String(pincode).replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      return NextResponse.json({ error: 'Pincode must be exactly 6 digits' }, { status: 400 });
    }

    const orderSubtotal = Number(subtotal || '0');
    const result = await calculateShipping(cleanPin, orderSubtotal);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate shipping. Please try again.' }, { status: 500 });
  }
}
