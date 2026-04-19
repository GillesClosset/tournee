// Domain types — will be populated in Lot 1+

export interface Driver {
  id: string
  name: string
  is_active: boolean
  notes: string | null
}

export interface Vehicle {
  id: string
  name: string
  license_plate: string
  is_active: boolean
  notes: string | null
}

export interface Location {
  id: string
  name: string
  address: string
  latitude: number | null
  longitude: number | null
  parking_difficulty: boolean
  location_type: 'villa' | 'rdv'
  is_active: boolean
  notes: string | null
}

// ─── Schedule & Availability types (Lot 2) ───────────────────────────────────

export type ScheduleStatus =
  | 'draft'
  | 'configured'
  | 'imported'
  | 'generated'
  | 'modified'
  | 'confirmed'

export interface WeeklySchedule {
  id: string
  weekStartDate: string
  status: ScheduleStatus
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface DriverAvailability {
  id: string
  scheduleId: string
  driverId: string
  vehicleId: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AvailabilityWithRelations extends DriverAvailability {
  driver: Pick<Driver, 'id' | 'name'>
  vehicle: Pick<Vehicle, 'id' | 'name' | 'license_plate'> | null
}

// ─── Generation types (Lot 3) ────────────────────────────────────────────────

export interface GenerationSummary {
  totalTours: number
  totalStops: number
  totalUnassigned: number
  totalTravelMinutes: number
  warnings: string[]
}

export interface MissionRequestDomain {
  id: string
  scheduleId: string
  dayOfWeek: number
  locationId: string | null
  destinationLocationId: string | null
  destinationAddress: string | null
  destinationLatitude: number | null
  destinationLongitude: number | null
  requestedTime: string
  timeRangeEnd: string | null
  minorName: string | null
  missionText: string
  missionType: 'accompagnement' | 'recuperation' | 'both'
  accompanimentType: 'scolaire' | 'medical' | 'loisir' | 'famille' | 'autre'
  priorityScore: string
  priorityOverride: string | null
  isPriorityFlagged: boolean
  observations: string | null
  status: 'pending' | 'assigned' | 'cancelled'
}

export interface TourStopDomain {
  id: string
  tourId: string
  sequenceOrder: number
  locationId: string | null
  missionRequestId: string | null
  scheduledTime: string
  travelTimeMinutes: number
  parkingExtraMinutes: number
  accompanimentExtraMinutes: number
  isOptional: boolean
  isManualTask: boolean
  manualTaskText: string | null
  notes: string | null
}

export interface TourWithStops {
  id: string
  scheduleId: string
  driverAvailabilityId: string
  status: 'generated' | 'modified' | 'confirmed'
  totalTravelMinutes: number | null
  totalDistanceMeters: number | null
  stops: TourStopDomain[]
}

// ─── Enriched tour view types (Lot 5) ────────────────────────────────────────

export interface TourStopWithRelations extends TourStopDomain {
  locationName: string | null
  locationLatitude: number | null
  locationLongitude: number | null
  missionText: string | null
  minorName: string | null
  missionType: 'accompagnement' | 'recuperation' | 'both' | null
  accompanimentType: 'scolaire' | 'medical' | 'loisir' | 'famille' | 'autre' | null
}

export interface TourViewData {
  id: string
  scheduleId: string
  status: 'generated' | 'modified' | 'confirmed'
  totalTravelMinutes: number | null
  totalDistanceMeters: number | null
  driverName: string
  vehicleName: string | null
  vehiclePlate: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
  stops: TourStopWithRelations[]
}

export interface UnassignedMission {
  id: string
  dayOfWeek: number
  minorName: string | null
  missionText: string
  requestedTime: string
  locationName: string | null
  reason: string
}

export interface ToursPageData {
  tours: TourViewData[]
  unassigned: UnassignedMission[]
  summary: GenerationSummary
}

// ─── Tour editing types (Lot: tour-manual-editing) ───────────────────────────

export type { TourEditAction, TourEditPayload } from '@/lib/validators/tour-edits'
