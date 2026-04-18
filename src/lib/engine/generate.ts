// ─── Tour Generation Orchestrator ────────────────────────────────────────────

import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  weeklySchedules,
  missionRequests,
  driverAvailabilities,
  drivers,
  locations,
  tours,
  tourStops,
} from '@/lib/db/schema'
import type { GenerationResult, DriverSlot } from './types'
import { buildTravelMatrix, DEPOT_LOCATION_ID } from './travel-matrix'
import { computePriorityScore, type WeeklyStats } from './priority'
import { expandMissions, resetStopIdCounter, type MissionForExpansion } from './expander'
import { greedyConstruct } from './greedy'
import { improveTours } from './local-search'
import { timeToMinutes, minutesToTime } from './constants'

/**
 * Orchestrate the full tour generation pipeline for a schedule.
 *
 * Steps:
 * 1. Load missions + availabilities from DB
 * 2. Build travel matrix
 * 3. Compute priorities
 * 4. Expand missions into stops
 * 5. Greedy construct initial tours
 * 6. Local search optimization
 * 7. Mark optional stops
 * 8. Persist tours + tour_stops to DB
 * 9. Update schedule status → 'generated'
 */
export async function generateTours(scheduleId: string): Promise<GenerationResult> {
  const warnings: string[] = []
  resetStopIdCounter()

  // 1. Load schedule
  const [schedule] = await db
    .select()
    .from(weeklySchedules)
    .where(eq(weeklySchedules.id, scheduleId))
    .limit(1)

  if (!schedule) {
    throw new Error(`Schedule not found: ${scheduleId}`)
  }

  // 2. Load missions (pending only)
  const dbMissions = await db
    .select({
      mission: missionRequests,
      location: locations,
    })
    .from(missionRequests)
    .leftJoin(locations, eq(missionRequests.locationId, locations.id))
    .where(and(eq(missionRequests.scheduleId, scheduleId), eq(missionRequests.status, 'pending')))

  if (dbMissions.length === 0) {
    warnings.push('No pending missions found for this schedule')
    return {
      tours: [],
      unassigned: [],
      warnings,
      stats: { totalTours: 0, totalStops: 0, totalUnassigned: 0, totalTravelMinutes: 0 },
    }
  }

  // Load destination locations
  const destLocationIds = [
    ...new Set(
      dbMissions
        .map((m) => m.mission.destinationLocationId)
        .filter((id): id is string => id !== null),
    ),
  ]
  const destLocations = new Map<string, typeof locations.$inferSelect>()
  if (destLocationIds.length > 0) {
    for (const id of destLocationIds) {
      const [loc] = await db.select().from(locations).where(eq(locations.id, id)).limit(1)
      if (loc) destLocations.set(loc.id, loc)
    }
  }

  // 3. Load driver availabilities
  const dbAvailabilities = await db
    .select({
      availability: driverAvailabilities,
      driver: drivers,
    })
    .from(driverAvailabilities)
    .innerJoin(drivers, eq(driverAvailabilities.driverId, drivers.id))
    .where(
      and(
        eq(driverAvailabilities.scheduleId, scheduleId),
        eq(driverAvailabilities.isAvailable, true),
      ),
    )

  if (dbAvailabilities.length === 0) {
    warnings.push('No driver availabilities found for this schedule')
    return {
      tours: [],
      unassigned: dbMissions.map((m) => ({
        missionRequestId: m.mission.id,
        reason: 'No drivers available',
      })),
      warnings,
      stats: {
        totalTours: 0,
        totalStops: 0,
        totalUnassigned: dbMissions.length,
        totalTravelMinutes: 0,
      },
    }
  }

  // 4. Compute weekly stats for priority scoring
  const villaRequestCounts = new Map<string, number>()
  for (const m of dbMissions) {
    if (m.mission.locationId) {
      villaRequestCounts.set(
        m.mission.locationId,
        (villaRequestCounts.get(m.mission.locationId) ?? 0) + 1,
      )
    }
  }
  const weeklyStats: WeeklyStats = {
    villaRequestCounts,
    totalMissions: dbMissions.length,
    totalDriverSlots: dbAvailabilities.length,
  }

  // 5. Prepare missions for expansion with computed priorities
  const missionsForExpansion: MissionForExpansion[] = dbMissions.map((m) => {
    const loc = m.location
    const destLoc = m.mission.destinationLocationId
      ? destLocations.get(m.mission.destinationLocationId)
      : null

    const priorityScore = computePriorityScore(
      {
        accompanimentType: m.mission.accompanimentType,
        isPriorityFlagged: m.mission.isPriorityFlagged,
        priorityOverride: m.mission.priorityOverride,
        latitude: loc?.latitude ?? null,
        longitude: loc?.longitude ?? null,
        locationId: m.mission.locationId,
      },
      weeklyStats,
    )

    return {
      id: m.mission.id,
      dayOfWeek: m.mission.dayOfWeek,
      locationId: m.mission.locationId,
      locationLatitude: loc?.latitude ?? null,
      locationLongitude: loc?.longitude ?? null,
      locationName: loc?.name ?? null,
      locationParkingDifficulty: loc?.parkingDifficulty ?? false,
      destinationLocationId: m.mission.destinationLocationId,
      destinationLatitude: destLoc?.latitude ?? m.mission.destinationLatitude ?? null,
      destinationLongitude: destLoc?.longitude ?? m.mission.destinationLongitude ?? null,
      destinationName: destLoc?.name ?? m.mission.destinationAddress ?? null,
      destinationParkingDifficulty: destLoc?.parkingDifficulty ?? false,
      requestedTime: m.mission.requestedTime,
      timeRangeEnd: m.mission.timeRangeEnd,
      missionType: m.mission.missionType,
      priorityScore,
      missionText: m.mission.missionText,
    }
  })

  // 6. Collect all location IDs for matrix
  const allLocationIds = new Set<string>()
  for (const m of missionsForExpansion) {
    if (m.locationId) allLocationIds.add(m.locationId)
    if (m.destinationLocationId) allLocationIds.add(m.destinationLocationId)
  }

  // 7. Build travel matrix
  const travelMatrix = await buildTravelMatrix([...allLocationIds], db)

  // 8. Expand missions into stops
  const expandedStops = expandMissions(missionsForExpansion)

  if (expandedStops.length === 0) {
    warnings.push('No valid stops could be expanded from missions (missing coordinates?)')
    return {
      tours: [],
      unassigned: dbMissions.map((m) => ({
        missionRequestId: m.mission.id,
        reason: 'Missing location coordinates',
      })),
      warnings,
      stats: {
        totalTours: 0,
        totalStops: 0,
        totalUnassigned: dbMissions.length,
        totalTravelMinutes: 0,
      },
    }
  }

  // 9. Prepare driver slots
  const driverSlots: DriverSlot[] = dbAvailabilities.map((a) => ({
    availabilityId: a.availability.id,
    driverId: a.availability.driverId,
    driverName: a.driver.name,
    vehicleId: a.availability.vehicleId,
    dayOfWeek: a.availability.dayOfWeek,
    startTimeMinutes: timeToMinutes(a.availability.startTime),
    endTimeMinutes: timeToMinutes(a.availability.endTime),
    currentTimeMinutes: timeToMinutes(a.availability.startTime),
    currentLocationId: DEPOT_LOCATION_ID,
    stops: [],
  }))

  // 10. Greedy construction
  const { tours: initialTours, unassigned } = greedyConstruct(
    expandedStops,
    driverSlots,
    travelMatrix,
    DEPOT_LOCATION_ID,
  )

  // 11. Local search optimization
  const optimizedTours = improveTours(initialTours, travelMatrix, DEPOT_LOCATION_ID)

  // 12. Delete existing tours for this schedule (for force regeneration)
  await db.delete(tours).where(eq(tours.scheduleId, scheduleId))

  // 13. Persist tours + tour_stops
  for (const tour of optimizedTours) {
    const [insertedTour] = await db
      .insert(tours)
      .values({
        scheduleId,
        driverAvailabilityId: tour.availabilityId,
        totalTravelMinutes: tour.totalTravelMinutes,
        totalDistanceMeters: tour.totalDistanceMeters,
      })
      .returning()

    for (let i = 0; i < tour.stops.length; i++) {
      const stop = tour.stops[i]
      await db.insert(tourStops).values({
        tourId: insertedTour.id,
        sequenceOrder: i + 1,
        locationId: stop.stop.locationId.startsWith('dest-') ? null : stop.stop.locationId,
        missionRequestId: stop.stop.missionRequestId,
        scheduledTime: minutesToTime(stop.scheduledTimeMinutes),
        travelTimeMinutes: stop.travelTimeMinutes,
        parkingExtraMinutes: stop.parkingExtraMinutes,
        accompanimentExtraMinutes: stop.accompanimentExtraMinutes,
        isOptional: stop.isOptional,
      })
    }
  }

  // 14. Update mission statuses to 'assigned'
  const assignedMissionIds = new Set<string>()
  for (const tour of optimizedTours) {
    for (const stop of tour.stops) {
      assignedMissionIds.add(stop.stop.missionRequestId)
    }
  }
  for (const missionId of assignedMissionIds) {
    await db
      .update(missionRequests)
      .set({ status: 'assigned', updatedAt: new Date() })
      .where(eq(missionRequests.id, missionId))
  }

  // 15. Update schedule status
  await db
    .update(weeklySchedules)
    .set({ status: 'generated', updatedAt: new Date() })
    .where(eq(weeklySchedules.id, scheduleId))

  // 16. Build result
  const totalTravelMinutes = optimizedTours.reduce((sum, t) => sum + t.totalTravelMinutes, 0)
  const totalStops = optimizedTours.reduce((sum, t) => sum + t.stops.length, 0)

  return {
    tours: optimizedTours,
    unassigned,
    warnings,
    stats: {
      totalTours: optimizedTours.length,
      totalStops,
      totalUnassigned: unassigned.length,
      totalTravelMinutes,
    },
  }
}
