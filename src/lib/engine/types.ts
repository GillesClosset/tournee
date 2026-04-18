// ─── Engine-internal types ───────────────────────────────────────────────────

/** A single stop derived from expanding a mission request */
export interface ExpandedStop {
  /** Unique ID for this stop (generated, not from DB) */
  id: string
  /** The mission request this stop belongs to */
  missionRequestId: string
  /** Location ID for this stop */
  locationId: string
  /** Latitude */
  latitude: number
  /** Longitude */
  longitude: number
  /** Requested time in minutes since midnight */
  requestedTimeMinutes: number
  /** End of time range in minutes (if any) */
  timeRangeEndMinutes: number | null
  /** Day of week (1-7) */
  dayOfWeek: number
  /** Priority score (0-100) */
  priorityScore: number
  /** Whether parking is difficult at this location */
  parkingDifficulty: boolean
  /** Whether this is an accompaniment stop (adds extra time) */
  isAccompaniment: boolean
  /** Sequence within the mission (0 = first stop, 1 = second) */
  missionSequence: number
  /** Label for debugging */
  label: string
}

/** A driver's availability slot for scheduling */
export interface DriverSlot {
  availabilityId: string
  driverId: string
  driverName: string
  vehicleId: string | null
  dayOfWeek: number
  startTimeMinutes: number
  endTimeMinutes: number
  /** Current clock position in minutes (updated during construction) */
  currentTimeMinutes: number
  /** Current location ID (starts at depot) */
  currentLocationId: string
  /** Assigned stops so far */
  stops: AssignedStop[]
}

/** A stop that has been assigned to a tour */
export interface AssignedStop {
  stop: ExpandedStop
  scheduledTimeMinutes: number
  travelTimeMinutes: number
  parkingExtraMinutes: number
  accompanimentExtraMinutes: number
  isOptional: boolean
}

/** A complete tour for one driver-day */
export interface ProvisionalTour {
  availabilityId: string
  driverId: string
  driverName: string
  vehicleId: string | null
  dayOfWeek: number
  stops: AssignedStop[]
  totalTravelMinutes: number
  totalDistanceMeters: number
}

/** An unassigned mission with reason */
export interface UnassignedMission {
  missionRequestId: string
  reason: string
}

/** Result of the generation pipeline */
export interface GenerationResult {
  tours: ProvisionalTour[]
  unassigned: UnassignedMission[]
  warnings: string[]
  stats: {
    totalTours: number
    totalStops: number
    totalUnassigned: number
    totalTravelMinutes: number
  }
}

/** Travel matrix: Map keyed by "originId:destId" */
export type TravelMatrix = Map<string, { seconds: number; meters: number }>

/** Helper to build matrix key */
export function matrixKey(originId: string, destId: string): string {
  return `${originId}:${destId}`
}
