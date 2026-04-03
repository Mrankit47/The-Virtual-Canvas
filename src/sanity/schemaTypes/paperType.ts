import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'paperType',
  title: 'Paper Type',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Paper Title',
      type: 'string',
      description: 'e.g. Normal, Premium Matte, Canvas',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
      description: 'Short description shown to customer',
    }),
    defineField({
      name: 'extraCost',
      title: 'Extra Cost (₹)',
      type: 'number',
      description: 'Added flat to the final price. Use 0 for standard paper.',
      initialValue: 0,
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
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
      extraCost: 'extraCost',
      active: 'isActive',
    },
    prepare({ title, extraCost, active }) {
      return {
        title,
        subtitle: `+₹${extraCost || 0} — ${active ? '✅ Active' : '❌ Hidden'}`,
      };
    },
  },
});
