import { z } from "zod";

export const submitSiteSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});