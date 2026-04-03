import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'orderUpdate',
  title: 'Order Updates',
  type: 'document',
  fields: [
    defineField({
      name: 'order',
      title: 'Order',
      type: 'reference',
      to: [{ type: 'order' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'artist',
      title: 'Artist',
      type: 'reference',
      to: [{ type: 'userProfile' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'note',
      title: 'Update Note',
      type: 'text',
      rows: 3,
      description: 'Notes from the artist about this progress update.',
    }),
    defineField({
      name: 'progress',
      title: 'Progress Percentage',
      type: 'number',
      description: 'Current progress from 0 to 100.',
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'order.orderId',
      subtitle: 'note',
    },
    prepare({ title, subtitle }) {
      return {
        title: `Update for Order #${title || 'Unknown'}`,
        subtitle: subtitle || 'No notes provided',
      };
    },
  },
});
