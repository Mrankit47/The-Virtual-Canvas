import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'shippingZone',
  title: 'Shipping Zone Configuration',
  type: 'document',
  fields: [
    defineField({
      name: 'zoneName',
      title: 'Zone Name',
      type: 'string',
      description: 'e.g. Local Area, Western Region, National Flat Rate, Remote Areas',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'pincodePrefixes',
      title: 'PIN Code Prefixes',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Matches starts of customer 6-digit pincode. e.g. ["400"] matches Mumbai. ["4"] matches general West/Maharashtra. ["11"] matches Delhi.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'rate',
      title: 'Delivery Cost (₹)',
      type: 'number',
      description: 'Flat rate shipping charges for this zone.',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'freeShippingThreshold',
      title: 'Free Shipping Threshold (₹)',
      type: 'number',
      description: 'Orders with subtotal above this amount get free shipping. Leave blank or 0 to disable.',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
  ],
});
