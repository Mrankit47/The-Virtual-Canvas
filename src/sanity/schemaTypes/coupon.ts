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
      description: 'e.g. 20 (for 20% off) or 200 (for flat ₹200 off)',
      validation: (Rule) => Rule.required().positive(),
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
  ],
  preview: {
    select: {
      title: 'code',
      discount: 'discount',
      type: 'type',
      isActive: 'isActive',
      usedCount: 'usedCount',
      usageLimit: 'usageLimit',
    },
    prepare({ title, discount, type, isActive, usedCount, usageLimit }) {
      return {
        title: `${title} — ${type === 'percentage' ? `${discount}% off` : `₹${discount} off`}`,
        subtitle: `${isActive ? '✅ Active' : '❌ Inactive'} | Used: ${usedCount}/${usageLimit}`,
      };
    },
  },
});
