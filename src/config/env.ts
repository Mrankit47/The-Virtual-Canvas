import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().default('testid').transform(v => v.trim()),
  NEXT_PUBLIC_SANITY_DATASET: z.string().default('production').transform(v => v.trim()),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional().transform(v => v?.trim()),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().optional().transform(v => v?.trim()),
  NEXT_PUBLIC_UPI_ID: z.string().optional().transform(v => v?.trim()),
  NEXT_PUBLIC_RAZORPAY_KEY: z.string().optional().transform(v => v?.trim()),
  RAZORPAY_KEY_SECRET: z.string().optional().transform(v => v?.trim()), 
  SANITY_API_WRITE_TOKEN: z.string().optional().transform(v => v?.trim()),
  
  // Email Configuration
  EMAIL_USER: z.string().optional().transform(v => v?.trim()),
  EMAIL_PASS: z.string().optional().transform(v => v?.trim()),
  EMAIL_HOST: z.string().default('smtp.gmail.com').transform(v => v.trim()),
  EMAIL_PORT: z.coerce.number().default(465),
  NEXTAUTH_SECRET: z.string().optional().transform(v => v?.trim()),
  NEXTAUTH_URL: z.string().optional().transform(v => v?.trim()),
  AI_PLATFORM_URL: z.string().optional().transform(v => v?.trim()),
  AI_WEBHOOK_KEY: z.string().optional().transform(v => v?.trim()),
  GEMINI_API_KEY: z.string().optional().transform(v => v?.trim()),
  GROQ_API_KEY: z.string().optional().transform(v => v?.trim()),
});

const _env = envSchema.safeParse({
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  NEXT_PUBLIC_UPI_ID: process.env.NEXT_PUBLIC_UPI_ID,
  NEXT_PUBLIC_RAZORPAY_KEY: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  SANITY_API_WRITE_TOKEN: process.env.SANITY_API_WRITE_TOKEN,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  AI_PLATFORM_URL: process.env.AI_PLATFORM_URL,
  AI_WEBHOOK_KEY: process.env.AI_WEBHOOK_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
});

if (!_env.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(_env.error.format(), null, 2));
  if (process.env.NODE_ENV === 'production') {
    throw new Error("Invalid environment variables in production");
  } else {
    console.warn("⚠️ Continuing in development despite invalid environment variables.");
  }
}

export const env = _env.success ? _env.data : (envSchema.parse({}) as z.infer<typeof envSchema>);
