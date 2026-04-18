// ─── Engine Constants ────────────────────────────────────────────────────────

/** Depot: 117 avenue Simone Veil, 06200 Nice */
export const DEPOT = {
  latitude: 43.6725,
  longitude: 7.2103,
  address: '117 avenue Simone Veil, 06200 Nice',
} as const

/** Extra time added when parking is difficult (minutes) */
export const PARKING_EXTRA_MINUTES = 20

/** Extra time added per accompaniment stop (minutes) */
export const ACCOMPANIMENT_EXTRA_MINUTES = 10

/** Priority weights per PRD §7.4 (total = 100%) */
export const PRIORITY_WEIGHTS = {
  accompanimentType: 0.4,
  priorityFlag: 0.3,
  distanceFromDepot: 0.15,
  villaScarcity: 0.1,
  understaffing: 0.05,
} as const

/** Accompaniment type scores (higher = more urgent) */
export const ACCOMPANIMENT_TYPE_SCORES: Record<string, number> = {
  medical: 100,
  scolaire: 75,
  famille: 50,
  loisir: 25,
  autre: 10,
}

/** Max distance (meters) for normalization of distance score */
export const MAX_DISTANCE_METERS = 50_000

/** Local search max iterations */
export const LOCAL_SEARCH_MAX_ITERATIONS = 100

/** Travel time cache TTL (days) */
export const CACHE_TTL_DAYS = 30

/**
 * Parse a "HH:MM" or "HH:MM:SS" time string to total minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  const parts = time.split(':')
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
}

/**
 * Convert total minutes since midnight to "HH:MM" string.
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
