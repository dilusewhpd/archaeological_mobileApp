import { ServiceUnavailableError } from "../errors/customErrors.js";

/**
 * HTTP client for the Python risk-assessment microservice (risk_service.py,
 * run separately via `uvicorn` — see RUNNING.md). Not a dependency of the
 * Node process: if it isn't running, calls here fail with
 * ServiceUnavailableError rather than crashing or hanging the request.
 */

const RISK_SERVICE_URL = process.env.RISK_SERVICE_URL ?? "http://localhost:8000";

// Generous timeout: the Python service does a live elevation-API lookup
// per call, on top of model inference.
const REQUEST_TIMEOUT_MS = 20000;

export type RiskLabel = "Low" | "Medium" | "High";

export interface RiskAssessmentResult {
  risk_label: RiskLabel;
  risk_score: number;
  probabilities: Record<RiskLabel, number>;
  climate_zone: string;
  elevation_m: number;
  distance_to_coast_km: number;
  model_note: string;
}

/**
 * In-memory cache keyed by site id. A site's coordinates (and therefore its
 * elevation and coastal distance) never change, so a cached result stays
 * valid for the life of the record. Not persisted — it resets on every
 * Node process restart, which is fine for a 5-day project; a stale cache
 * is never worse than a fresh call to the same deterministic inputs.
 */
const riskCache = new Map<string, RiskAssessmentResult>();

export const assessSiteRisk = async (
  siteId: string,
  latitude: number,
  longitude: number
): Promise<RiskAssessmentResult> => {
  const cached = riskCache.get(siteId);
  if (cached) {
    return cached;
  }

  let response: Response;
  try {
    response = await fetch(`${RISK_SERVICE_URL}/predict_from_coordinates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: latitude, lon: longitude }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    // Connection refused, DNS failure, or timeout — the Python service is a
    // separate process that isn't guaranteed to be running in dev.
    throw new ServiceUnavailableError("Risk assessment service is currently unavailable.");
  }

  if (!response.ok) {
    throw new ServiceUnavailableError("Risk assessment service is currently unavailable.");
  }

  const result = (await response.json()) as RiskAssessmentResult;
  riskCache.set(siteId, result);
  return result;
};
