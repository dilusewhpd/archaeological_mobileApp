import { z } from "zod";

export const approveSiteSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});