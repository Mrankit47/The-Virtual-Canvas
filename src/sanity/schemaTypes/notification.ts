import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'notification',
  title: 'Notifications',
  type: 'document',
  fields: [
    defineField({
      name: 'message',
      title: 'Message',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'userEmail',
      title: 'User Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'type',
      title: 'Notification Type',
      type: 'string',
      options: {
        list: [
          { title: 'Order Created', value: 'order_created' },
          { title: 'Payment Success', value: 'payment_success' },
          { title: 'Artist Assigned', value: 'assigned' },
          { title: 'Progress Update', value: 'progress' },
          { title: 'Order Completed', value: 'completed' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'orderId',
      title: 'Order ID',
      type: 'string',
      description: 'The short Order ID (e.g. TVC-XXXXXX)',
    }),
    defineField({
      name: 'linkedOrderId',
      title: 'Linked Order Doc ID',
      type: 'string',
      description: 'The Sanity document ID of the order',
    }),
    defineField({
      name: 'read',
      title: 'Is Read?',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
});
