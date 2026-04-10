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
      title: 'Profile Picture',
      type: 'url',
    }),
  ],
});
