import { z } from 'zod';

export const orderFormSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  address: z.string().min(10, "Full address is required for shipping."),
  pincode: z.string().regex(/^\d{6}$/, "Invalid 6-digit pin code."),
  artworkType: z.string().min(1, "Please select an artwork type."),
  description: z.string().optional(),
  referenceImage: z.string().optional(), 
  price: z.number().min(1, "Price calculation error."), 
  paymentProof: z.string().optional(), 
  artworkId: z.string().optional(),
  couponCode: z.string().optional(),
  discountAmount: z.number().optional(),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;
