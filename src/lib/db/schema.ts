import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  smallint,
  time,
  doublePrecision,
  numeric,
  jsonb,
  integer,
  index,
  unique,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const locationTypeEnum = pgEnum('location_type', ['villa', 'rdv'])

export const scheduleStatusEnum = pgEnum('schedule_status', [
  'draft',
  'configured',
  'imported',
  'generated',
  'modified',
  'confirmed',
])

export const missionTypeEnum = pgEnum('mission_type', ['accompagnement', 'recuperation', 'both'])

export const accompanimentTypeEnum = pgEnum('accompaniment_type', [
  'scolaire',
  'medical',
  'loisir',
  'famille',
  'autre',
])

export const missionStatusEnum = pgEnum('mission_status', ['pending', 'assigned', 'cancelled'])

export const tourStatusEnum = pgEnum('tour_status', ['generated', 'modified', 'confirmed'])

// ─── Tables ──────────────────────────────────────────────────────────────────

export const drivers = pgTable('drivers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const vehicles = pgTable('vehicles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  licensePlate: text('license_plate').notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const locations = pgTable(
  'locations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    address: text('address').notNull(),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    parkingDifficulty: boolean('parking_difficulty').notNull().default(false),
    locationType: locationTypeEnum('location_type').notNull().default('villa'),
    isActive: boolean('is_active').notNull().default(true),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('locations_name_trgm_idx').using('gin', sql`${table.name} gin_trgm_ops`)],
)

export const weeklySchedules = pgTable('weekly_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  weekStartDate: date('week_start_date').notNull().unique(),
  status: scheduleStatusEnum('status').notNull().default('draft'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const driverAvailabilities = pgTable(
  'driver_availabilities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => weeklySchedules.id, { onDelete: 'cascade' }),
    driverId: uuid('driver_id')
      .notNull()
      .references(() => drivers.id),
    vehicleId: uuid('vehicle_id').references(() => vehicles.id),
    dayOfWeek: smallint('day_of_week').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    isAvailable: boolean('is_available').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('driver_avail_unique').on(table.scheduleId, table.driverId, table.dayOfWeek),
    index('driver_avail_schedule_day_idx').on(table.scheduleId, table.dayOfWeek),
    check('day_of_week_check', sql`${table.dayOfWeek} BETWEEN 1 AND 7`),
    check('end_after_start', sql`${table.endTime} > ${table.startTime}`),
  ],
)

export const missionRequests = pgTable(
  'mission_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => weeklySchedules.id, { onDelete: 'cascade' }),
    dayOfWeek: smallint('day_of_week').notNull(),
    locationId: uuid('location_id').references(() => locations.id),
    destinationLocationId: uuid('destination_location_id').references(() => locations.id),
    destinationAddress: text('destination_address'),
    destinationLatitude: doublePrecision('destination_latitude'),
    destinationLongitude: doublePrecision('destination_longitude'),
    requestedTime: time('requested_time').notNull(),
    timeRangeEnd: time('time_range_end'),
    minorName: text('minor_name'),
    missionText: text('mission_text').notNull(),
    missionType: missionTypeEnum('mission_type').notNull().default('accompagnement'),
    accompanimentType: accompanimentTypeEnum('accompaniment_type').notNull().default('autre'),
    priorityScore: numeric('priority_score', { precision: 5, scale: 2 }).notNull().default('0'),
    priorityOverride: numeric('priority_override', { precision: 5, scale: 2 }),
    isPriorityFlagged: boolean('is_priority_flagged').notNull().default(false),
    observations: text('observations'),
    rawRowData: jsonb('raw_row_data'),
    status: missionStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('mission_requests_schedule_day_idx').on(table.scheduleId, table.dayOfWeek),
    index('mission_requests_status_idx').on(table.status),
    check('mission_day_check', sql`${table.dayOfWeek} BETWEEN 1 AND 7`),
  ],
)

export const tours = pgTable(
  'tours',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => weeklySchedules.id, { onDelete: 'cascade' }),
    driverAvailabilityId: uuid('driver_availability_id')
      .notNull()
      .references(() => driverAvailabilities.id),
    status: tourStatusEnum('status').notNull().default('generated'),
    totalTravelMinutes: integer('total_travel_minutes'),
    totalDistanceMeters: integer('total_distance_meters'),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('tours_schedule_idx').on(table.scheduleId)],
)

export const tourStops = pgTable(
  'tour_stops',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tourId: uuid('tour_id')
      .notNull()
      .references(() => tours.id, { onDelete: 'cascade' }),
    sequenceOrder: smallint('sequence_order').notNull(),
    locationId: uuid('location_id').references(() => locations.id),
    missionRequestId: uuid('mission_request_id').references(() => missionRequests.id),
    scheduledTime: time('scheduled_time').notNull(),
    travelTimeMinutes: integer('travel_time_minutes').notNull().default(0),
    parkingExtraMinutes: integer('parking_extra_minutes').notNull().default(0),
    accompanimentExtraMinutes: integer('accompaniment_extra_minutes').notNull().default(0),
    isOptional: boolean('is_optional').notNull().default(false),
    isManualTask: boolean('is_manual_task').notNull().default(false),
    manualTaskText: text('manual_task_text'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('tour_stops_unique').on(table.tourId, table.sequenceOrder),
    index('tour_stops_tour_idx').on(table.tourId),
    index('tour_stops_mission_idx').on(table.missionRequestId),
  ],
)

export const travelTimeCache = pgTable(
  'travel_time_cache',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    originLocationId: uuid('origin_location_id').references(() => locations.id, {
      onDelete: 'cascade',
    }),
    destLocationId: uuid('dest_location_id').references(() => locations.id, {
      onDelete: 'cascade',
    }),
    originLat: doublePrecision('origin_lat').notNull(),
    originLng: doublePrecision('origin_lng').notNull(),
    destLat: doublePrecision('dest_lat').notNull(),
    destLng: doublePrecision('dest_lng').notNull(),
    durationSeconds: integer('duration_seconds').notNull(),
    distanceMeters: integer('distance_meters').notNull(),
    cachedAt: timestamp('cached_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('travel_cache_unique').on(table.originLocationId, table.destLocationId),
    index('travel_cache_origin_dest_idx').on(table.originLocationId, table.destLocationId),
  ],
)

// ─── Inferred Types ──────────────────────────────────────────────────────────

export type Driver = typeof drivers.$inferSelect
export type InsertDriver = typeof drivers.$inferInsert

export type Vehicle = typeof vehicles.$inferSelect
export type InsertVehicle = typeof vehicles.$inferInsert

export type Location = typeof locations.$inferSelect
export type InsertLocation = typeof locations.$inferInsert

export type WeeklySchedule = typeof weeklySchedules.$inferSelect
export type InsertWeeklySchedule = typeof weeklySchedules.$inferInsert

export type DriverAvailability = typeof driverAvailabilities.$inferSelect
export type InsertDriverAvailability = typeof driverAvailabilities.$inferInsert

export type MissionRequest = typeof missionRequests.$inferSelect
export type InsertMissionRequest = typeof missionRequests.$inferInsert

export type Tour = typeof tours.$inferSelect
export type InsertTour = typeof tours.$inferInsert

export type TourStop = typeof tourStops.$inferSelect
export type InsertTourStop = typeof tourStops.$inferInsert

export type TravelTimeCache = typeof travelTimeCache.$inferSelect
export type InsertTravelTimeCache = typeof travelTimeCache.$inferInsert
