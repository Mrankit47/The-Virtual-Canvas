
import { createClient } from 'next-sanity';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

async function checkUser() {
  const users = await client.fetch(`*[_type == "userProfile" && name match "Ankit*"]`);
  console.log(JSON.stringify(users, null, 2));
}

checkUser();
