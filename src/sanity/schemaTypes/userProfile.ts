import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'userProfile',
  title: 'User Profiles',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email Address',
      type: 'string',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          { title: 'Admin', value: 'admin' },
          { title: 'Artist', value: 'artist' },
          { title: 'User', value: 'user' },
        ],
      },
      initialValue: 'user',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'password',
      title: 'Password',
      type: 'string',
      hidden: ({ currentUser }) => !currentUser?.roles.some(role => role.name === 'admin'), // Hidden from non-admins in Studio
    }),
    defineField({
      name: 'mobileNumber',
      title: 'Mobile Number',
      type: 'string',
    }),
    defineField({
        name: 'otp',
        title: 'Last OTP',
        type: 'string',
        hidden: true,
    }),
    defineField({
        name: 'otpExpiry',
        title: 'OTP Expiry',
        type: 'datetime',
        hidden: true,
    }),
    defineField({
      name: 'image',
      title: 'Profile Picture URL',
      type: 'url',
      description: 'URL to the user profile picture (e.g. from Google or Cloudinary)',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
      media: 'image', // Notice we grab the image to inspect it
    },
    prepare({ title, subtitle, media }) {
      // If `media` is a raw string (corrupt data from NextAuth/Cloudinary), 
      // override it with false so we do not crash React.createElement.
      const isCorruptString = typeof media === 'string';
      
      return {
        title: title || 'Unnamed User',
        subtitle: `Role: ${subtitle || 'User'}`,
        media: isCorruptString ? false : media,
      };
    },
  },
});
