import { SiteStatus, HistoricalPeriod, SiteType } from "@prisma/client";

export interface SiteIdParam {
  id: string;
}

export interface GetSitesQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: SiteStatus;
  province?: string;
  district?: string;
  divisionalSecretariat?: string;
  historicalPeriod?: HistoricalPeriod;
  siteType?: SiteType;
  createdById?: string;
}

export interface CreateSiteData {
  siteCode: string;
  name: string;
  description?: string;
  province: string;
  district: string;
  divisionalSecretariat: string;
  latitude: number;
  longitude: number;
  historicalPeriod: HistoricalPeriod;
  siteType: SiteType;
  landUse: string;
  terrain: string;
  distanceToRiver?: number;
  rainfall?: number;
  proximityToDevelopment?: number;
}

export interface UpdateSiteData
  extends Partial<CreateSiteData> {}

export interface RejectSiteData {
  rejectionReason: string;
}