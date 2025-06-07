import { z } from "zod";

export const createCustomerSchema = z.object({
  emailAddress: z.string().email(),
  givenName: z.string().min(1),
  familyName: z.string().min(1),
  phoneNumber: z.string().min(10).max(10),
  address: z.object({
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    locality: z.string().min(1),
    postalCode: z.string().min(1),
  }).optional(),
  country: z.literal("US"),
});

export const updateCustomerSchema = z.object({
  emailAddress: z.string().email().optional(),
  givenName: z.string().min(1).optional(),
  familyName: z.string().min(1).optional(),
  phoneNumber: z.string().min(10).max(10).optional(),
  address: z.object({
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    locality: z.string().min(1),
    postalCode: z.string().min(1),
  }).optional(),
  country: z.literal("US").optional(),
});

export const searchCustomerSchema = z.object({
  phoneNumber: z.string().min(10).max(10),
  emailAddress: z.string().email().optional(),
  referenceId: z.string().optional(),
  sortField: z.enum(["DEFAULT", "CREATED_AT"]).optional(),
  sortOrder: z.enum(["ASC", "DESC"]).optional(),
}); 