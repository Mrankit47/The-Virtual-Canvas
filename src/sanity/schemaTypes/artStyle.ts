import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'artStyle',
  title: 'Art Style',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Style Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Preview Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Showcase image shown on the configurator card',
    }),
    defineField({
      name: 'basePrice',
      title: 'Base Price (₹)',
      type: 'number',
      description: 'Starting price before size/paper multipliers',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'description',
      title: 'Short Description',
      type: 'text',
      rows: 2,
      description: 'Displayed on the style card (1–2 lines)',
    }),
    defineField({
      name: 'requiresReference',
      title: 'Requires Reference Image?',
      type: 'boolean',
      description: 'If true, customer must upload a reference photo for this style',
      initialValue: false,
    }),
    defineField({
      name: 'isActive',
      title: 'Active (visible in configurator)',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower number appears first',
      initialValue: 10,
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      price: 'basePrice',
      active: 'isActive',
    },
    prepare({ title, media, price, active }) {
      return {
        title,
        subtitle: `₹${price || 0} base — ${active ? '✅ Active' : '❌ Hidden'}`,
        media,
      };
    },
  },
});
