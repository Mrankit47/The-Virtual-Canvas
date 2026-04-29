import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'sale',
  title: 'Marketplace Sales',
  type: 'document',
  fields: [
    defineField({
      name: 'artwork',
      title: 'Artwork Purchased',
      type: 'reference',
      to: [{ type: 'artwork' }],
    }),
    defineField({
      name: 'artist',
      title: 'Artist',
      type: 'reference',
      to: [{ type: 'userProfile' }],
    }),
    defineField({
      name: 'buyer',
      title: 'Buyer (User)',
      type: 'reference',
      to: [{ type: 'userProfile' }],
    }),
    defineField({
      name: 'buyerEmail',
      title: 'Buyer Email',
      type: 'string',
    }),
    defineField({
      name: 'amount',
      title: 'Sale Amount (₹)',
      type: 'number',
    }),
    defineField({
      name: 'paymentId',
      title: 'Razorpay Payment ID',
      type: 'string',
    }),
    defineField({
      name: 'orderId',
      title: 'Razorpay Order ID',
      type: 'string',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Processing', value: 'processing' },
          { title: 'Completed', value: 'completed' },
          { title: 'Cancelled', value: 'cancelled' },
        ],
      },
      initialValue: 'completed',
    }),
    defineField({
      name: 'createdAt',
      title: 'Sale Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: 'artwork.title',
      artist: 'artist.name',
      amount: 'amount',
    },
    prepare({ title, artist, amount }) {
      return {
        title: title || 'Deleted Artwork',
        subtitle: `Artist: ${artist} | ₹${amount}`,
      };
    },
  },
});
