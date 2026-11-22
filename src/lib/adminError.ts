import { ApiError } from './apiClient';

/** The team's own tools show the backend's wording ("This shop is already paused.") — it is written for them. */
export function adminMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}
