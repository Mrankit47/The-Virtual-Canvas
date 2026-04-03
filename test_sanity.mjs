import { createClient } from 'next-sanity';

const client = createClient({
  projectId: 'i4rmd3hr',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
});

const query = `
  *[_type == "processStep"] | order(order asc) {
    _id,
    stepNumber,
    title,
    layout,
    mediaType,
    imageSource,
    imageUrl,
    "image": image.asset->url
  }
`;

async function main() {
  const data = await client.fetch(query);
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
