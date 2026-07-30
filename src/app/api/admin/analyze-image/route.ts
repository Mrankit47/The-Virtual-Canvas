import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

const groqApiKey = process.env.GROQ_API_KEY;
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!genAI && !groq) {
      return NextResponse.json({ error: 'Neither Gemini nor Groq API key is configured' }, { status: 500 });
    }

    const body = await req.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const cleanMimeType = mimeType || 'image/jpeg';

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

    // 1. Try Gemini API Models First
    if (genAI) {
      const geminiModels = [
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro-latest',
        'gemini-1.5-flash'
      ];

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
          console.warn(`[Analyze Image] Gemini model ${modelName} failed:`, err.message);
        }
      }
    }

    // 2. Fallback to Groq API Vision Models if Gemini failed or is not configured
    if (!responseText && groq) {
      console.log('[Analyze Image] Fallback to Groq API triggered');
      const groqModels = [
        'llama-3.2-11b-vision-preview',
        'llama-3.2-90b-vision-preview'
      ];

      for (const modelName of groqModels) {
        try {
          const completion = await groq.chat.completions.create({
            model: modelName,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${cleanMimeType};base64,${base64Data}`
                    }
                  }
                ]
              }
            ],
            response_format: { type: 'json_object' }
          });

          const content = completion.choices[0]?.message?.content;
          if (content) {
            responseText = content;
            console.log(`[Analyze Image] Success with Groq vision model: ${modelName}`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[Analyze Image] Groq model ${modelName} failed:`, err.message);
        }
      }
    }

    if (!responseText) {
      const isQuotaError = lastError?.message?.includes('429') || lastError?.message?.includes('Quota') || lastError?.message?.includes('quota');
      return NextResponse.json(
        { error: `All Gemini and Groq AI models failed. Last error: ${lastError?.message || 'Unknown error'}` },
        { status: isQuotaError ? 429 : 500 }
      );
    }

    // Clean up potential markdown formatting from the response
    const cleanJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(cleanJsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
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
