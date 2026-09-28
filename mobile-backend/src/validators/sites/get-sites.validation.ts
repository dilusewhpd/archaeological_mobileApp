import { z } from "zod";
import { SiteStatus, HistoricalPeriod, SiteType } from "@prisma/client";

export const getSitesQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),

	limit: z.coerce.number().int().min(1).max(100).default(10),

	search: z.string().trim().optional(),

	status: z.nativeEnum(SiteStatus).optional(),

	historicalPeriod: z.nativeEnum(HistoricalPeriod).optional(),

	siteType: z.nativeEnum(SiteType).optional(),

	province: z.string().trim().optional(),

	district: z.string().trim().optional(),

	sortBy: z
		.enum([
		"createdAt",
		"updatedAt",
		"name",
		"siteCode",
		])
		.default("createdAt"),

	sortOrder: z
		.enum(["asc", "desc"])
		.default("desc"),
});

export type GetSitesQuery =
	z.infer<typeof getSitesQuerySchema>;