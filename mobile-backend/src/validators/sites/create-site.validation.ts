import { z } from "zod";
import {
  HistoricalPeriod,
  SiteType,
} from "@prisma/client";

export const createSiteSchema = z.object({
    siteCode: z
      .string()
      .trim()
      .min(3)
      .max(50),

    name: z
      .string()
      .trim()
      .min(3)
      .max(255),

    description: z
      .string()
      .trim()
      .max(5000)
      .optional(),

    province: z
      .string()
      .trim()
      .min(2)
      .max(100),

    district: z
      .string()
      .trim()
      .min(2)
      .max(100),

    divisionalSecretariat: z
      .string()
      .trim()
      .min(2)
      .max(150),

    latitude: z
      .number()
      .min(-90)
      .max(90),

    longitude: z
      .number()
      .min(-180)
      .max(180),

    historicalPeriod: z.nativeEnum(HistoricalPeriod),

    siteType: z.nativeEnum(SiteType),

    landUse: z
      .string()
      .trim()
      .min(2)
      .max(255),

    terrain: z
      .string()
      .trim()
      .min(2)
      .max(255),

    distanceToRiver: z
      .number()
      .nonnegative()
      .optional(),

    rainfall: z
      .number()
      .nonnegative()
      .optional(),

    proximityToDevelopment: z
      .number()
      .nonnegative()
      .optional(),
})