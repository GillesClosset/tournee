// ─── Priority Scorer ─────────────────────────────────────────────────────────

import {
  PRIORITY_WEIGHTS,
  ACCOMPANIMENT_TYPE_SCORES,
  MAX_DISTANCE_METERS,
  DEPOT,
} from './constants'

export interface MissionForPriority {
  accompanimentType: string
  isPriorityFlagged: boolean
  priorityOverride: string | null
  latitude: number | null
  longitude: number | null
  locationId: string | null
}

export interface WeeklyStats {
  /** Number of missions requested per villa (locationId → count) */
  villaRequestCounts: Map<string, number>
  /** Total missions this week */
  totalMissions: number
  /** Available driver-slots this week */
  totalDriverSlots: number
}

/**
 * Compute a priority score (0–100) for a mission.
 * If priorityOverride is set, returns that value directly.
 * Pure function — no side effects.
 */
export function computePriorityScore(
  mission: MissionForPriority,
  weeklyStats: WeeklyStats,
): number {
  // Override takes precedence
  if (mission.priorityOverride !== null && mission.priorityOverride !== undefined) {
    const override = parseFloat(mission.priorityOverride)
    if (!isNaN(override)) return Math.max(0, Math.min(100, override))
  }

  // 1. Accompaniment type (40%)
  const typeScore = ACCOMPANIMENT_TYPE_SCORES[mission.accompanimentType] ?? 10

  // 2. Priority flag (30%) — binary: 100 if flagged, 0 if not
  const flagScore = mission.isPriorityFlagged ? 100 : 0

  // 3. Distance from depot (15%) — farther = higher priority (needs more planning)
  let distanceScore = 50 // default if no coordinates
  if (mission.latitude !== null && mission.longitude !== null) {
    const dist = haversineMeters(
      DEPOT.latitude,
      DEPOT.longitude,
      mission.latitude,
      mission.longitude,
    )
    distanceScore = Math.min(100, (dist / MAX_DISTANCE_METERS) * 100)
  }

  // 4. Villa scarcity (10%) — fewer requests from this villa = higher priority
  let scarcityScore = 50
  if (mission.locationId) {
    const count = weeklyStats.villaRequestCounts.get(mission.locationId) ?? 0
    // 1 request = 100, 5+ = 0
    scarcityScore = Math.max(0, 100 - (count - 1) * 25)
  }

  // 5. Understaffing (5%) — ratio of missions to driver slots
  let understaffingScore = 50
  if (weeklyStats.totalDriverSlots > 0) {
    const ratio = weeklyStats.totalMissions / weeklyStats.totalDriverSlots
    understaffingScore = Math.min(100, ratio * 50) // ratio of 2 → 100
  }

  const score =
    typeScore * PRIORITY_WEIGHTS.accompanimentType +
    flagScore * PRIORITY_WEIGHTS.priorityFlag +
    distanceScore * PRIORITY_WEIGHTS.distanceFromDepot +
    scarcityScore * PRIORITY_WEIGHTS.villaScarcity +
    understaffingScore * PRIORITY_WEIGHTS.understaffing

  return Math.round(score * 100) / 100
}

/**
 * Haversine distance in meters between two lat/lng points.
 */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000 // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
