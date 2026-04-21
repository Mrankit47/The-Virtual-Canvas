import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'artwork',
  title: 'Artwork',
  type: 'document',
  fieldsets: [
    { name: 'details', title: 'Artwork Details', options: { collapsible: true, collapsed: false } },
    { name: 'media', title: 'Media & Asset', options: { collapsible: true, collapsed: false } },
    { name: 'commerce', title: 'Commerce & Pricing', options: { collapsible: true, collapsed: false } },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(100),
      fieldset: 'details',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
      fieldset: 'details',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (Rule) => Rule.required(),
      fieldset: 'details',
    }),
    defineField({
      name: 'subcategory',
      title: 'Subcategory',
      type: 'string',
      options: {
        list: [
          { title: 'Portrait', value: 'portrait' },
          { title: 'Realistic', value: 'realistic' },
          { title: 'Abstract', value: 'abstract' },
          { title: 'Pencil/Charcoal', value: 'pencil' },
          { title: 'Digital', value: 'digital' },
        ],
      },
      fieldset: 'details',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
      fieldset: 'details',
    }),
    defineField({
      name: 'medium',
      title: 'Medium',
      type: 'string',
      description: 'e.g., Pencil, Watercolor, Acrylic, Digital',
      fieldset: 'details',
    }),
    defineField({
      name: 'dimensions',
      title: 'Dimensions',
      type: 'string',
      description: 'e.g., 24x36 inches',
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
      name: 'imageSource',
      title: 'Image Source',
      type: 'string',
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
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Important for SEO and accessiblity.',
          validation: (Rule) => Rule.required(),
        }
      ],
      hidden: ({ parent }) => parent?.imageSource === 'cloudinary',
      validation: (Rule) => Rule.required(),
      fieldset: 'media',
    }),
    defineField({
      name: 'imageUrl',
      title: 'Cloudinary Image URL',
      type: 'url',
      description: 'Paste Cloudinary image URL (https://...)',
      hidden: ({ parent }) => parent?.imageSource !== 'cloudinary',
      fieldset: 'media',
      validation: (Rule) =>
        Rule.uri({
          scheme: ['http', 'https'],
        }),
    }),
    defineField({
      name: 'price',
      title: 'Price (₹)',
      type: 'number',
      validation: (Rule) => Rule.required().positive().error('Price must be greater than 0.'),
      fieldset: 'commerce',
    }),
    defineField({
      name: 'isFeatured',
      title: 'Featured (Top Art Showcase)',
      type: 'boolean',
      initialValue: false,
      fieldset: 'commerce',
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
      category: 'category.title',
      price: 'price',
    },
    prepare({ title, media, category, price }) {
      return {
        title,
        subtitle: `${category ? category : 'No category'} | ₹${price || 0}`,
        media: media || false,
      };
    },
  },
});
