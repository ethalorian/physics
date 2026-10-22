import collection from '@/data/daily-zen.json'
import { schoolDayKey } from './school-day'

export type ZenReflection = typeof collection.entries[number]
export const ZEN_REFLECTIONS: readonly ZenReflection[] = collection.entries
const EPOCH = Date.parse(`${collection.epoch}T00:00:00Z`)

/** A school-local date, not an elapsed 24-hour period: DST never skips a saying. */
export function dailyZenReflection(day = schoolDayKey()): ZenReflection {
  const stamp = Date.parse(`${day}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0, 10) !== day) {
    throw new RangeError('Expected a valid school date')
  }
  const offset = Math.round((stamp - EPOCH) / 86_400_000)
  return ZEN_REFLECTIONS[((offset % ZEN_REFLECTIONS.length) + ZEN_REFLECTIONS.length) % ZEN_REFLECTIONS.length]
}
