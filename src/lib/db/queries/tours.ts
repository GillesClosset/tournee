import { db } from '@/lib/db'
import {
  tours,
  tourStops,
  missionRequests,
  locations,
  driverAvailabilities,
  drivers,
  vehicles,
} from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import type {
  TourViewData,
  TourStopWithRelations,
  UnassignedMission,
  ToursPageData,
  GenerationSummary,
} from '@/types/domain'

export async function fetchToursWithRelations(scheduleId: string): Promise<ToursPageData> {
  // 1. Fetch all tours for this schedule with driver availability + driver + vehicle
  const tourRows = await db
    .select({
      tourId: tours.id,
      scheduleId: tours.scheduleId,
      status: tours.status,
      totalTravelMinutes: tours.totalTravelMinutes,
      totalDistanceMeters: tours.totalDistanceMeters,
      driverAvailabilityId: tours.driverAvailabilityId,
      driverName: drivers.name,
      vehicleName: vehicles.name,
      vehiclePlate: vehicles.licensePlate,
      dayOfWeek: driverAvailabilities.dayOfWeek,
      startTime: driverAvailabilities.startTime,
      endTime: driverAvailabilities.endTime,
    })
    .from(tours)
    .innerJoin(driverAvailabilities, eq(tours.driverAvailabilityId, driverAvailabilities.id))
    .innerJoin(drivers, eq(driverAvailabilities.driverId, drivers.id))
    .leftJoin(vehicles, eq(driverAvailabilities.vehicleId, vehicles.id))
    .where(eq(tours.scheduleId, scheduleId))
    .orderBy(asc(driverAvailabilities.dayOfWeek), asc(driverAvailabilities.startTime))

  // 2. Fetch all stops for these tours with location + mission details
  const tourIds = tourRows.map((t) => t.tourId)

  let allStops: {
    stopId: string
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
    locationName: string | null
    missionText: string | null
    minorName: string | null
    missionType: 'accompagnement' | 'recuperation' | 'both' | null
    accompanimentType: 'scolaire' | 'medical' | 'loisir' | 'famille' | 'autre' | null
  }[] = []

  if (tourIds.length > 0) {
    // Fetch stops for each tour (drizzle doesn't support IN with empty array well)
    for (const tourId of tourIds) {
      const stops = await db
        .select({
          stopId: tourStops.id,
          tourId: tourStops.tourId,
          sequenceOrder: tourStops.sequenceOrder,
          locationId: tourStops.locationId,
          missionRequestId: tourStops.missionRequestId,
          scheduledTime: tourStops.scheduledTime,
          travelTimeMinutes: tourStops.travelTimeMinutes,
          parkingExtraMinutes: tourStops.parkingExtraMinutes,
          accompanimentExtraMinutes: tourStops.accompanimentExtraMinutes,
          isOptional: tourStops.isOptional,
          isManualTask: tourStops.isManualTask,
          manualTaskText: tourStops.manualTaskText,
          notes: tourStops.notes,
          locationName: locations.name,
          missionText: missionRequests.missionText,
          minorName: missionRequests.minorName,
          missionType: missionRequests.missionType,
          accompanimentType: missionRequests.accompanimentType,
        })
        .from(tourStops)
        .leftJoin(locations, eq(tourStops.locationId, locations.id))
        .leftJoin(missionRequests, eq(tourStops.missionRequestId, missionRequests.id))
        .where(eq(tourStops.tourId, tourId))
        .orderBy(asc(tourStops.sequenceOrder))

      allStops = allStops.concat(stops)
    }
  }

  // 3. Group stops by tourId
  const stopsByTourId = new Map<string, TourStopWithRelations[]>()
  for (const stop of allStops) {
    const enriched: TourStopWithRelations = {
      id: stop.stopId,
      tourId: stop.tourId,
      sequenceOrder: stop.sequenceOrder,
      locationId: stop.locationId,
      missionRequestId: stop.missionRequestId,
      scheduledTime: stop.scheduledTime,
      travelTimeMinutes: stop.travelTimeMinutes,
      parkingExtraMinutes: stop.parkingExtraMinutes,
      accompanimentExtraMinutes: stop.accompanimentExtraMinutes,
      isOptional: stop.isOptional,
      isManualTask: stop.isManualTask,
      manualTaskText: stop.manualTaskText,
      notes: stop.notes,
      locationName: stop.locationName,
      missionText: stop.missionText,
      minorName: stop.minorName,
      missionType: stop.missionType,
      accompanimentType: stop.accompanimentType,
    }
    const existing = stopsByTourId.get(stop.tourId) ?? []
    existing.push(enriched)
    stopsByTourId.set(stop.tourId, existing)
  }

  // 4. Assemble TourViewData[]
  const tourViewData: TourViewData[] = tourRows.map((row) => ({
    id: row.tourId,
    scheduleId: row.scheduleId,
    status: row.status,
    totalTravelMinutes: row.totalTravelMinutes,
    totalDistanceMeters: row.totalDistanceMeters,
    driverName: row.driverName,
    vehicleName: row.vehicleName,
    vehiclePlate: row.vehiclePlate,
    dayOfWeek: row.dayOfWeek,
    startTime: row.startTime,
    endTime: row.endTime,
    stops: stopsByTourId.get(row.tourId) ?? [],
  }))

  // 5. Fetch unassigned missions
  const unassignedRows = await db
    .select({
      id: missionRequests.id,
      dayOfWeek: missionRequests.dayOfWeek,
      minorName: missionRequests.minorName,
      missionText: missionRequests.missionText,
      requestedTime: missionRequests.requestedTime,
      locationName: locations.name,
    })
    .from(missionRequests)
    .leftJoin(locations, eq(missionRequests.locationId, locations.id))
    .where(and(eq(missionRequests.scheduleId, scheduleId), eq(missionRequests.status, 'pending')))
    .orderBy(asc(missionRequests.dayOfWeek), asc(missionRequests.requestedTime))

  const unassigned: UnassignedMission[] = unassignedRows.map((row) => ({
    id: row.id,
    dayOfWeek: row.dayOfWeek,
    minorName: row.minorName,
    missionText: row.missionText,
    requestedTime: row.requestedTime,
    locationName: row.locationName,
    reason: 'Non assignée lors de la génération',
  }))

  // 6. Build summary
  const totalStops = tourViewData.reduce((sum, t) => sum + t.stops.length, 0)
  const totalTravelMinutes = tourViewData.reduce((sum, t) => sum + (t.totalTravelMinutes ?? 0), 0)

  const summary: GenerationSummary = {
    totalTours: tourViewData.length,
    totalStops,
    totalUnassigned: unassigned.length,
    totalTravelMinutes,
    warnings: [],
  }

  return { tours: tourViewData, unassigned, summary }
}
