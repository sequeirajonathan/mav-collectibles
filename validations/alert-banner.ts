import { z } from "zod";

export const alertBannerSchema = z.object({
  id: z.string(),
  message: z.string().min(1, "Message is required"),
  code: z.string().optional(),
  backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Must be a valid hex color code (e.g., #E6B325)",
  }),
  textColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Must be a valid hex color code (e.g., #000000)",
  }),
  enabled: z.boolean().default(true),
});

export type AlertBanner = z.infer<typeof alertBannerSchema>; 