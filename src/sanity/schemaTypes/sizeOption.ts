import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'sizeOption',
  title: 'Size Option',
  type: 'document',
  fields: [
    defineField({
      name: 'label',
      title: 'Size Label',
      type: 'string',
      description: 'e.g. A5, A4, A3, A2',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Dimensions Description',
      type: 'string',
      description: 'e.g. 148×210mm — Ideal for portraits',
    }),
    defineField({
      name: 'multiplier',
      title: 'Price Multiplier',
      type: 'number',
      description: 'Applied to the art style base price. e.g. 1 = A5, 1.5 = A4, 2 = A3',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'framePrice',
      title: 'Photo Frame Price',
      type: 'number',
      description: 'Optional price for the photo frame of this size. e.g. 150 for A5, 200 for A4, 250 for A3',
      validation: (Rule) => Rule.min(0),
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
      title: 'label',
      multiplier: 'multiplier',
      description: 'description',
    },
    prepare({ title, multiplier, description }) {
      return {
        title: `${title} (×${multiplier})`,
        subtitle: description || '',
      };
    },
  },
});
