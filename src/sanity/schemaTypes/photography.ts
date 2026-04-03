import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'photography',
  title: 'Photography',
  type: 'document',
  fieldsets: [
    { name: 'details', title: 'Details', options: { collapsible: true, collapsed: false } },
    { name: 'media', title: 'Media Asset', options: { collapsible: true, collapsed: false } },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(2),
      fieldset: 'details',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Flowers', value: 'flowers' },
          { title: 'Sky', value: 'sky' },
          { title: 'Landscape', value: 'landscape' },
          { title: 'Nature', value: 'nature' },
          { title: 'Street', value: 'street' },
        ],
      },
      fieldset: 'details',
    }),
    defineField({
      name: 'location',
      title: 'Location Captured',
      type: 'string',
      description: 'e.g., Tokyo, Japan',
      fieldset: 'details',
    }),
    defineField({
      name: 'capturedAt',
      title: 'Captured At',
      type: 'datetime',
      fieldset: 'details',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
      fieldset: 'details',
    }),
    defineField({
      name: 'isFeatured',
      title: 'Featured Photography',
      type: 'boolean',
      initialValue: false,
      fieldset: 'details',
    }),
    defineField({
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
      fieldset: 'media',
    }),
    defineField({
      name: 'image',
      title: 'Upload Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Important for SEO and accessibility.',
        }
      ],
      hidden: ({ parent }) => parent?.imageSource === 'cloudinary' || parent?.imageSource === 'url',
      fieldset: 'media',
    }),
    defineField({
      name: 'imageUrl',
      type: 'url',
      title: 'Cloudinary Image URL',
      description: 'Paste Cloudinary image URL (https://...)',
      hidden: ({ parent }) => parent?.imageSource !== 'cloudinary' && parent?.imageSource !== 'url',
      fieldset: 'media',
      validation: (Rule) =>
        Rule.uri({
          scheme: ['http', 'https'],
        }),
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      fieldset: 'details',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      url: 'imageUrl',
      location: 'location',
    },
    prepare({ title, media, url, location }) {
      return {
        title,
        subtitle: `${location ? `🌍 ${location} ` : ''}| ${url ? 'Cloudinary Image' : 'Uploaded Image'}`,
        media,
      };
    },
  },
});
