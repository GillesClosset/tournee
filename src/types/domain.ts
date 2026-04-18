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
