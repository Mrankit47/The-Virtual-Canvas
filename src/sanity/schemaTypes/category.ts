import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().error('Category title is required.'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().error('A unique slug is required.'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'A short description of this category.',
    }),
    defineField({
      name: 'icon',
      title: 'Icon (String)',
      type: 'string',
      description: 'Optional: Name of the icon (e.g., from Lucide React) to display in the UI.',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Used to sort categories in the frontend UI (e.g., 1, 2, 3).',
    }),
  ],
  orderings: [
    {
      title: 'Manual Order',
      name: 'manualOrderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
});
