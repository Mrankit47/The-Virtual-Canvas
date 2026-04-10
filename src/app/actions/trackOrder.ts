'use server'

import { createClient } from '@sanity/client';
import { env } from '@/config/env';

const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false, // Ensure fresh reading from database
});

export async function getOrderTracking(orderId: string) {
  if (!orderId) return { error: "No Order ID provided" };
  try {
    const order = await backendClient.fetch(
      `*[_type == "order" && orderId == $id][0]{
         customerName, orderId, orderStatus, paymentStatus, price, description, phone, email, createdAt
      }`,
      { id: orderId }
    );
    
    if (!order) return { error: "❌ No order found with this ID" };
    return { data: order };
  } catch (error) {
    return { error: "❌ Failed to fetch tracking data. Database unreachable." };
  }
}
