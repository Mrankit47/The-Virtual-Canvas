import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!genAI) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

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

    let result;
    let lastError;
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType || 'image/jpeg'
            }
          }
        ]);
        break; // If successful, break out of the loop
      } catch (err: any) {
        lastError = err;
        console.warn(`Failed with model ${modelName}:`, err.message);
        // Continue to the next model
      }
    }

    if (!result) {
      throw new Error(`All models failed. Last error: ${lastError?.message}`);
    }

    const responseText = result.response.text();
    
    // Clean up potential markdown formatting from the response
    const cleanJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(cleanJsonString);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", responseText);
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
