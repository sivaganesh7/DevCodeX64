/**
 * DevCodeX64 — Health Service (frontend)
 *
 * Calls the NestJS /api/health endpoint.
 * Used to verify frontend ↔ API connectivity.
 */

import { apiClient } from "../lib/api-client"

export interface ApiHealth {
  status:    "ok" | "degraded"
  database:  string
  version:   string
  timestamp: string
}

export async function fetchHealth(): Promise<ApiHealth> {
  const { data } = await apiClient.get<ApiHealth>("/health")
  return data
}
