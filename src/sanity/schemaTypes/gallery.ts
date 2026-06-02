export default {
  name: 'gallery',
  type: 'document',
  title: 'Gallery',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Artwork Title',
      validation: (Rule: any) => Rule.required(),
    },
    // Select image source
    {
      name: 'imageSource',
      type: 'string',
      title: 'Image Source',
      options: {
        list: [
          { title: 'Sanity Upload', value: 'sanity' },
          { title: 'Cloudinary URL', value: 'cloudinary' },
        ],
        layout: 'radio',
      },
      initialValue: 'sanity',
    },
    // Sanity upload (visible only if upload selected)
    {
      name: 'image',
      type: 'image',
      title: 'Upload Image',
      hidden: ({ parent }: any) => parent?.imageSource === 'cloudinary' || parent?.imageSource === 'url',
    },
    // Cloudinary URL (visible only if url selected)
    {
      name: 'imageUrl',
      type: 'url',
      title: 'Cloudinary Image URL',
      description: 'Paste Cloudinary image URL (https://...)',
      hidden: ({ parent }: any) => parent?.imageSource !== 'cloudinary' && parent?.imageSource !== 'url',
      validation: (Rule: any) =>
        Rule.uri({
          scheme: ['http', 'https'],
        }),
    },
    // Category reference (optional — existing items without category still show under "All")
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      description: 'Assign this image to a gallery category (optional)',
    },
    {
      name: 'likes',
      title: 'Liked By (User IDs)',
      type: 'array',
      of: [{ type: 'string' }],
      initialValue: [],
      readOnly: true,
    },
    {
      name: 'comments',
      title: 'Comments',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'comment',
          fields: [
            { name: 'userId', type: 'string', title: 'User ID' },
            { name: 'userName', type: 'string', title: 'User Name' },
            { name: 'userImage', type: 'string', title: 'User Profile Image' },
            { name: 'text', type: 'text', title: 'Comment Text' },
            { name: 'createdAt', type: 'datetime', title: 'Created At' },
          ],
        },
      ],
      initialValue: [],
    },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      url: 'imageUrl',
    },
    prepare({ title, media, url }: any) {
      return {
        title,
        media: media || false,
        subtitle: url ? 'Cloudinary Image' : 'Uploaded Image',
      };
    },
  },
};
