import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'coupon',
  title: 'Coupons',
  type: 'document',
  fields: [
    defineField({
      name: 'code',
      title: 'Coupon Code',
      type: 'string',
      validation: (Rule) => Rule.required().uppercase().error('Code must be uppercase'),
    }),
    defineField({
      name: 'discount',
      title: 'Discount Value',
      type: 'number',
      description: 'e.g. 20 (for 20% off) or 200 (for flat ₹200 off). Set to 0 if this is purely a Free Delivery / Free Frame coupon.',
      initialValue: 0,
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'type',
      title: 'Discount Type',
      type: 'string',
      options: {
        list: [
          { title: 'Percentage (%)', value: 'percentage' },
          { title: 'Flat (₹)', value: 'flat' },
        ],
        layout: 'radio',
      },
      initialValue: 'percentage',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'expiry',
      title: 'Expiry Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Active?',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'usageLimit',
      title: 'Usage Limit',
      type: 'number',
      description: 'Max number of times this coupon can be used',
      initialValue: 100,
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'usedCount',
      title: 'Times Used',
      type: 'number',
      description: 'Auto-incremented on each successful use',
      initialValue: 0,
      readOnly: true,
    }),
    defineField({
      name: 'minimumOrderAmount',
      title: 'Minimum Order Amount (₹)',
      type: 'number',
      description: 'Minimum cart total to apply this coupon (optional)',
      initialValue: 0,
    }),
    defineField({
      name: 'freeDelivery',
      title: 'Free Delivery / Shipping?',
      type: 'boolean',
      description: 'Tick to grant 100% free delivery when applied.',
      initialValue: false,
    }),
    defineField({
      name: 'freeFrame',
      title: 'Free Premium Photo Frame?',
      type: 'boolean',
      description: 'Tick to grant a free premium wood frame (₹0) when applied.',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'code',
      discount: 'discount',
      type: 'type',
      isActive: 'isActive',
      usedCount: 'usedCount',
      usageLimit: 'usageLimit',
      freeDelivery: 'freeDelivery',
      freeFrame: 'freeFrame',
    },
    prepare({ title, discount, type, isActive, usedCount, usageLimit, freeDelivery, freeFrame }) {
      const benefits = [];
      if (discount > 0) benefits.push(type === 'percentage' ? `${discount}% off` : `₹${discount} off`);
      if (freeDelivery) benefits.push('Free Delivery 🚚');
      if (freeFrame) benefits.push('Free Frame 🖼️');
      const benefitsText = benefits.length > 0 ? benefits.join(' + ') : 'No Price Benefits';
      return {
        title: `${title} — ${benefitsText}`,
        subtitle: `${isActive ? '✅ Active' : '❌ Inactive'} | Used: ${usedCount}/${usageLimit}`,
      };
    },
  },
});
