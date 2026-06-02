import groq from 'groq';

export const GET_ALL_ARTWORKS_QUERY = groq`
  *[_type == "artwork"] | order(order asc) {
    _id,
    title,
    "slug": slug.current,
    "category": category->title,
    subcategory,
    description,
    medium,
    dimensions,
    tags,
    imageSource,
    imageUrl,
    "image": image.asset->url,
    "imageLqip": image.asset->metadata.lqip,
    price,
    isFeatured
  }
`;

export const GET_CATEGORIES_QUERY = groq`
  *[_type == "category"] | order(order asc) {
    _id,
    title,
    "slug": slug.current,
    description,
    icon
  }
`;

export const GET_PHOTOGRAPHY_QUERY = groq`
  *[_type == "photography" || (_type == "artwork" && isPhotography == true && isArtistUpload != true)] | order(_createdAt desc) {
    _id,
    title,
    "category": category->title,
    location,
    capturedAt,
    tags,
    imageSource,
    imageUrl,
    "image": image.asset->url,
    "imageLqip": image.asset->metadata.lqip,
    isFeatured,
    "likes": coalesce(likes, [])
  }
`;

export const GET_PROCESS_STEPS_QUERY = groq`
  *[_type == "processStep"] | order(order asc) {
    _id,
    stepNumber,
    title,
    subtitle,
    layout,
    mediaType,
    aiCaption,
    leftText,
    rightText,
    alt,
    imageSource,
    imageUrl,
    "videoFileUrl": videoFile.asset->url,
    "image": image.asset->url,
    "imageLqip": image.asset->metadata.lqip,
    "beforeImageUrl": beforeImage.asset->url,
    "afterImageUrl": afterImage.asset->url
  }
`;

export const GET_ART_STYLES_QUERY = groq`
  *[_type == "artStyle" && isActive != false] | order(order asc) {
    _id,
    title,
    "slug": slug.current,
    basePrice,
    description,
    requiresReference
  }
`;
