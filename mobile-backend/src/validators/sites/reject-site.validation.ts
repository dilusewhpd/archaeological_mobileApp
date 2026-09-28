import { z } from "zod";

export const rejectSiteSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(10, "Rejection reason must be at least 10 characters.")
    .max(1000),
});

export type RejectSiteData = z.infer<typeof rejectSiteSchema>;