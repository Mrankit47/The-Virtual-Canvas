import { createClient } from '@sanity/client';
import { env } from '@/config/env';

const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

// Server-side helper to calculate shipping based on pincode and subtotal
export async function calculateShipping(pincode: string, subtotal: number): Promise<{ rate: number; zoneName: string; isFree: boolean }> {
  const cleanPin = pincode.replace(/\D/g, '');
  if (cleanPin.length !== 6) {
    throw new Error('Invalid pincode format');
  }

  // Fetch all active shipping zones
  const zones = await backendClient.fetch(`
    *[_type == "shippingZone" && isActive != false] {
      _id,
      zoneName,
      pincodePrefixes,
      rate,
      freeShippingThreshold
    }
  `);

  // Find a matching zone by checking prefixes (longest prefix takes priority)
  let matchedZone: any = null;
  let longestMatchLength = 0;

  for (const zone of zones) {
    if (!zone.pincodePrefixes || !Array.isArray(zone.pincodePrefixes)) continue;
    
    for (const prefix of zone.pincodePrefixes) {
      if (cleanPin.startsWith(prefix)) {
        if (prefix.length > longestMatchLength) {
          longestMatchLength = prefix.length;
          matchedZone = zone;
        }
      }
    }
  }

  if (matchedZone) {
    const freeThreshold = matchedZone.freeShippingThreshold || 0;
    const isFree = freeThreshold > 0 && subtotal >= freeThreshold;
    const finalRate = isFree ? 0 : matchedZone.rate;
    return {
      rate: finalRate,
      zoneName: matchedZone.zoneName,
      isFree,
    };
  }

  // Fallback defaults if no customized zones match in the CMS
  // Default: ₹150 flat shipping, free above ₹2500
  const isDefaultFree = subtotal >= 2500;
  return {
    rate: isDefaultFree ? 0 : 150,
    zoneName: 'National Flat Rate (Standard)',
    isFree: isDefaultFree,
  };
}
