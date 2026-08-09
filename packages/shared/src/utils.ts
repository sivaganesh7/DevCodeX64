/**
 * Shared utility functions used across the monorepo
 */

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function isNonNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}
