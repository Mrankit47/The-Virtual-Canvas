import { env } from '@/config/env';

interface IngestionPayload {
  title: string;
  image_url: string;
  category: 'gallery' | 'photography';
  source: 'website';
}

/**
 * Triggers the AI Automation Platform to ingest a newly uploaded artwork.
 * This runs asynchronously as a background operation.
 * 
 * @param title The title of the artwork
 * @param imageUrl The public URL of the uploaded image
 * @param category The category/section of the upload (defaults to 'gallery')
 */
export async function triggerArtworkAutomation(
  title: string,
  imageUrl: string,
  category: 'gallery' | 'photography' = 'gallery'
): Promise<void> {
  const platformUrl = env.AI_PLATFORM_URL;
  const apiKey = env.AI_WEBHOOK_KEY;

  if (!platformUrl || !apiKey) {
    console.warn('⚠️ [AI Trigger] AI_PLATFORM_URL or AI_WEBHOOK_KEY is not configured. Skipping trigger.');
    return;
  }

  const endpoint = `${platformUrl.replace(/\/$/, '')}/api/v1/ingestion/artwork`;
  const body: IngestionPayload = {
    title,
    image_url: imageUrl,
    category,
    source: 'website',
  };

  console.log(`[AI Trigger] AI trigger started: title="${title}", image_url="${imageUrl}"`);

  const maxRetries = 3;
  let attempt = 0;
  let delay = 1000; // start with 1 second delay

  while (attempt < maxRetries) {
    attempt++;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        body: JSON.stringify(body),
        // keepalive: true ensures the browser/server keeps the request alive 
        // even if the client disconnects or the function returns a response.
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error(`HTTP error status: ${response.status}`);
      }

      console.log(`✅ [AI Trigger] AI trigger success: status=${response.status} (attempt ${attempt})`);
      return;
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.error(`❌ [AI Trigger] AI trigger failed on attempt ${attempt}: ${errorMsg}`);
      
      if (attempt >= maxRetries) {
        console.error(`❌ [AI Trigger] AI trigger failed finally: All ${maxRetries} attempts exhausted.`);
        return;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}
