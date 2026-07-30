import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
    // Google AI Studio keys start with AIzaSy
    const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

    const groqApiKey = process.env.GROQ_API_KEY?.trim();
    const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

    const body = await req.json();
    const { imageBase64, mimeType, fileName } = body;

    if (!imageBase64 && !fileName) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Sanitize Base64 string & MIME type
    const base64Data = imageBase64 ? imageBase64.replace(/^data:image\/\w+;base64,/, '') : '';

    let cleanMimeType = (mimeType || 'image/jpeg').toLowerCase();
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(cleanMimeType)) {
      cleanMimeType = 'image/jpeg';
    }

    const prompt = `
      You are an expert art curator and gallery manager. Analyze the provided image and extract the following details to fill out an artwork upload form. 
      Return ONLY a valid JSON object without any markdown formatting, code blocks, or extra text.

      The JSON must have the following keys:
      - "title": A creative and fitting title for this image.
      - "description": A beautifully written, engaging description (2-3 sentences) suitable for an art gallery or marketplace.
      - "tags": A comma-separated string of 5-8 relevant tags (e.g., "landscape, abstract, oil painting, nature").
      - "medium": The likely medium used (e.g., "Digital", "Oil on Canvas", "Photography", "Pencil", "Watercolor"). Guess if unsure.
      - "alt": A concise, descriptive alt text for accessibility and SEO.
      - "suggestedCategory": The most likely category (e.g., "Nature", "Abstract", "Portrait", "Architecture").
    `;

    let responseText: string | null = null;
    let lastError: any = null;

    // 1. Try Gemini Vision Models (requires valid AIzaSy... key from Google AI Studio)
    if (genAI && base64Data) {
      const geminiModels = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];

      for (const modelName of geminiModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([
            prompt,
            {
              inlineData: {
                data: base64Data,
                mimeType: cleanMimeType
              }
            }
          ]);
          responseText = result.response.text();
          if (responseText) {
            console.log(`[Analyze Image] Success with Gemini model: ${modelName}`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[Analyze Image] Gemini model ${modelName} failed:`, err?.message || err);
        }
      }
    }

    // 2. Fallback to Groq LLM (Active Groq models: llama-3.3-70b-versatile, llama-3.1-8b-instant)
    if (!responseText && groq) {
      console.log('[Analyze Image] Fallback to Groq LLM triggered');
      const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
      const textPrompt = `${prompt}\n(Context filename: ${fileName || 'Artwork Photo'})`;

      for (const modelName of groqModels) {
        try {
          const completion = await groq.chat.completions.create({
            model: modelName,
            messages: [
              {
                role: 'user',
                content: textPrompt
              }
            ],
            response_format: { type: 'json_object' }
          });

          const content = completion.choices[0]?.message?.content;
          if (content) {
            responseText = content;
            console.log(`[Analyze Image] Success with Groq model: ${modelName}`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[Analyze Image] Groq model ${modelName} failed:`, err?.message || err);
        }
      }
    }

    // 3. Smart Fallback if external AI services are down or out of quota (ensures form auto-fill never fails)
    if (!responseText) {
      console.warn('[Analyze Image] AI services unavailable/rate-limited. Using smart fallback metadata.');
      const fallbackTitle = fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : 'Untitled Artwork';
      const capitalizedTitle = fallbackTitle.charAt(0).toUpperCase() + fallbackTitle.slice(1);
      
      return NextResponse.json({
        title: capitalizedTitle,
        description: 'A beautiful piece of art curated for The Virtual Canvas collection.',
        tags: 'art, gallery, photography, creative, visual',
        medium: 'Photography',
        alt: capitalizedTitle,
        suggestedCategory: 'General'
      });
    }

    // Clean up potential markdown formatting from response
    const cleanJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(cleanJsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText);
      return NextResponse.json({
        title: 'Untitled Artwork',
        description: 'A beautiful piece of art curated for The Virtual Canvas collection.',
        tags: 'art, gallery, collection',
        medium: 'Photography',
        alt: 'Artwork'
      });
    }

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
