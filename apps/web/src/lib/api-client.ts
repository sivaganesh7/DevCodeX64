/**
 * DevCodeX64 — Axios API Client
 *
 * Single configured Axios instance used by ALL feature modules.
 * Base URL is read from the VITE_API_URL environment variable.
 * JWT token is attached in Phase 2 (auth interceptor).
 */

import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001"

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
  withCredentials: true, // for httpOnly refresh token cookie (Phase 2)
})

// ── Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Phase 2: redirect to login, refresh token logic goes here
      console.warn("[api-client] Unauthorized — Phase 2 will handle redirect")
    }
    return Promise.reject(error)
  },
)

export default apiClient
