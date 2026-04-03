import { env as siteEnv } from '@/config/env';

export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-03-22';
export const dataset = siteEnv.NEXT_PUBLIC_SANITY_DATASET;
export const projectId = siteEnv.NEXT_PUBLIC_SANITY_PROJECT_ID;
