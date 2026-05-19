import { NextResponse } from 'next/server';
import { calculateShipping } from '@/lib/shipping';

export async function POST(req: Request) {
  try {
    const { pincode, subtotal } = await req.json();

    if (!pincode) {
      return NextResponse.json({ error: 'Pincode is required' }, { status: 400 });
    }

    const cleanPin = pincode.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      return NextResponse.json({ error: 'Pincode must be exactly 6 digits' }, { status: 400 });
    }

    const orderSubtotal = Number(subtotal || '0');
    const result = await calculateShipping(cleanPin, orderSubtotal);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to calculate shipping' }, { status: 500 });
  }
}
