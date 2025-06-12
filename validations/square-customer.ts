import { z } from "zod";

const addressSchema = z.object({
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  locality: z.string(),
  administrativeDistrictLevel1: z.string(),
  postalCode: z.string(),
  country: z.string().default('US'),
});

// Helper function to clean phone number
const cleanPhoneNumber = (val: string) => {
  // Remove any non-digit characters and +1 prefix
  return val.replace(/^\+1|\D/g, '');
};

export const createCustomerSchema = z.object({
  emailAddress: z.string().email(),
  givenName: z.string().min(1),
  familyName: z.string().min(1),
  phoneNumber: z.string()
    .transform(cleanPhoneNumber)
    .refine(val => val.length === 10, {
      message: "Phone number must be 10 digits after removing country code and non-digit characters"
    }),
  address: z.object({
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    locality: z.string().min(1),
    postalCode: z.string().min(1),
  }).optional(),
  country: z.literal("US"),
  referenceId: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  customerId: z.string(),
  givenName: z.string().optional(),
  familyName: z.string().optional(),
  emailAddress: z.string().email().optional(),
  phoneNumber: z.string()
    .transform(cleanPhoneNumber)
    .refine(val => val.length === 10, {
      message: "Phone number must be 10 digits after removing country code and non-digit characters"
    })
    .optional(),
  address: addressSchema.optional(),
  note: z.string().optional(),
  referenceId: z.string().optional(),
});

export const searchCustomerSchema = z.object({
  phoneNumber: z.string()
    .transform(cleanPhoneNumber)
    .refine(val => val.length === 10, {
      message: "Phone number must be 10 digits after removing country code and non-digit characters"
    }),
  emailAddress: z.string().email().optional(),
  referenceId: z.string().optional(),
  sortField: z.enum(['DEFAULT', 'CREATED_AT']).optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional(),
}); 