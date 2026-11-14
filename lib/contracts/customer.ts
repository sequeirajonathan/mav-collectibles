import { z } from "zod";

const customerAddressSchema = z.object({
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  locality: z.string().optional(),
  administrativeDistrictLevel1: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});
export type CustomerAddress = z.infer<typeof customerAddressSchema>;

/** The signed-in user's own Square customer record. */
export const customerSchema = z.object({
  id: z.string(),
  givenName: z.string().optional(),
  familyName: z.string().optional(),
  emailAddress: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: customerAddressSchema.optional(),
  note: z.string().optional(),
  referenceId: z.string().optional(),
});
export type Customer = z.infer<typeof customerSchema>;


export const updateCustomerInput = z.object({
  givenName: z.string().trim().max(60).optional(),
  familyName: z.string().trim().max(60).optional(),
  emailAddress: z.email().optional(),
  phoneNumber: z.string().regex(/^\+1\d{10}$/, "Use a 10-digit US phone number").optional(),
  address: customerAddressSchema.optional(),
});

export const updateCustomerResponse = z.discriminatedUnion("status", [
  z.object({ status: z.literal("updated"), customer: customerSchema }),
  z.object({
    status: z.literal("address_suggestion"),
    originalAddress: customerAddressSchema,
    suggestedAddress: customerAddressSchema,
    messages: z.array(z.object({ text: z.string(), type: z.string() })),
  }),
  z.object({ status: z.literal("invalid_address"), messages: z.array(z.object({ text: z.string(), type: z.string() })) }),
]);
export type UpdateCustomerResponse = z.infer<typeof updateCustomerResponse>;

export const roleChangeInput = z.object({
  user: z.string().trim().min(1),
  role: z.enum(["USER", "ADMIN", "STAFF", "EVENT", "PRINT_AGENT"]),
});
