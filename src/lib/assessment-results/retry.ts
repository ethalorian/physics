export const AUTOMATIC_RETRY_LIMIT = 6
export const AUTOMATIC_BATCH_SIZE = 6
export function retryDelay(attempt: number) {
  return Math.min(3600, 60 * 2 ** Math.max(0, attempt - 1))
}
export type AutomaticJob = { source: string; source_id: string; version: string; user_id: string; lock_id: string; attempts: number }
