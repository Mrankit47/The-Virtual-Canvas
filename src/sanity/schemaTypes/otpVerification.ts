import { defineField, defineType } from 'sanity';

export const otpVerification = defineType({
  name: 'otpVerification',
  title: 'OTP Verification',
  type: 'document',
  fields: [
    defineField({
      name: 'mobileNumber',
      title: 'Mobile Number',
      type: 'string',
    }),
    defineField({
      name: 'otp',
      title: 'OTP Code',
      type: 'string',
    }),
    defineField({
      name: 'expiry',
      title: 'Expiry Date',
      type: 'datetime',
    }),
  ],
});
