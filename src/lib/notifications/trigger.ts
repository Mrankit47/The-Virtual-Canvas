import { createClient } from 'next-sanity';
import { env } from '@/config/env';

const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

export async function triggerNotification(userEmail: string, message: string) {
  try {
    await backendClient.create({
      _type: 'notification',
      userEmail,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to trigger notification:", error);
    return { success: false, error };
  }
}
