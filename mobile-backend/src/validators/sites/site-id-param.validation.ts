import { z } from "zod";

export const siteIdParamSchema = z.object({
  id: z.uuid(),
});

export type SiteIdParam = z.infer<typeof siteIdParamSchema>;