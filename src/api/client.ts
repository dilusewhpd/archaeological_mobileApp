import { clearToken, readToken, storeToken } from "./tokenStorage";

export { clearToken, readToken, storeToken } from "./tokenStorage";

export type SiteStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

export interface Officer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: { id?: string; name: string };
}

export interface SiteListItem {
  id: string;
  siteCode: string;
  name: string;
  province: string;
  district: string;
  divisionalSecretariat: string;
  latitude: string | number;
  longitude: string | number;
  historicalPeriod: string;
  siteType: string;
  status: SiteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SiteDetail extends SiteListItem {
  description: string | null;
  landUse: string;
  terrain: string;
  distanceToRiver: number | null;
  rainfall: number | null;
  proximityToDevelopment: number | null;
  rejectionReason: string | null;
  photos: { id: string; imageUrl: string; caption: string | null }[];
}

export interface DashboardStats {
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface SitePayload {
  siteCode: string;
  name: string;
  description?: string;
  province: string;
  district: string;
  divisionalSecretariat: string;
  latitude: number;
  longitude: number;
  historicalPeriod: string;
  siteType: string;
  landUse: string;
  terrain: string;
  distanceToRiver?: number;
  rainfall?: number;
  proximityToDevelopment?: number;
}

type ApiEnvelope<T> = { success: boolean; message?: string; data: T };
type ApiList<T> = { success: boolean; data: T[]; pagination?: { total: number } };
type ServerFieldError = { field?: string; message?: string };

export const API_BASE_URL = String(
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.8.101:3000",
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get fieldErrors(): Record<string, string> {
    const errors = (this.data as { errors?: ServerFieldError[] } | undefined)?.errors;
    return Object.fromEntries(
      (errors ?? []).filter((error) => error.field).map((error) => [error.field!, error.message ?? "Invalid value."]),
    );
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = await readToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(`Could not reach ${API_BASE_URL}. Check the backend and Wi-Fi connection.`, 0);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const data: unknown = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : undefined;
  if (!response.ok) {
    const envelope = data as { message?: string } | null;
    throw new ApiError(envelope?.message ?? response.statusText ?? "Request failed.", response.status, data);
  }
  return data as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

export async function login(email: string, password: string) {
  const response = await request<ApiEnvelope<{ accessToken: string; user: Officer }>>(
    "/api/auth/login",
    json("POST", { email, password }),
  );
  return response.data;
}

export async function getMe() {
  return (await request<ApiEnvelope<Officer>>("/api/auth/me")).data;
}

export async function getDashboard() {
  return (await request<ApiEnvelope<DashboardStats>>("/api/sites/dashboard")).data;
}

export async function getMySites() {
  const response = await request<ApiList<SiteListItem>>(
    "/api/sites/my-sites?limit=100&sortBy=updatedAt&sortOrder=desc",
  );
  return response.data;
}

export async function getSite(id: string) {
  return (await request<ApiEnvelope<SiteDetail>>(`/api/sites/${encodeURIComponent(id)}`)).data;
}

export async function createSite(payload: SitePayload) {
  return (await request<ApiEnvelope<SiteDetail>>("/api/sites", json("POST", payload))).data;
}

export async function updateSite(id: string, payload: SitePayload) {
  return (await request<ApiEnvelope<SiteDetail>>(`/api/sites/${encodeURIComponent(id)}`, json("PUT", payload))).data;
}

export async function uploadSitePhoto(siteId: string, photo: { uri: string; name: string; type: string }) {
  const form = new FormData();
  form.append("photo", { uri: photo.uri, name: photo.name, type: photo.type } as unknown as Blob);
  return (await request<ApiEnvelope<{ id: string }>>(`/api/sites/${encodeURIComponent(siteId)}/photos`, {
    method: "POST",
    body: form,
  })).data;
}

export async function submitSite(id: string) {
  return (await request<ApiEnvelope<SiteDetail>>(`/api/sites/${encodeURIComponent(id)}/submit`, json("POST"))).data;
}

export function reportUrl() {
  return `${API_BASE_URL}/api/reports/my-sites`;
}

export function sitePhotoUrl(path: string) {
  return path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}