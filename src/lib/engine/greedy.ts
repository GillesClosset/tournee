// ─── Greedy Construction ─────────────────────────────────────────────────────

import type {
  ExpandedStop,
  DriverSlot,
  AssignedStop,
  ProvisionalTour,
  UnassignedMission,
  TravelMatrix,
} from './types'
import { matrixKey } from './types'
import { getStopExtraMinutes } from './expander'

/**
 * Greedy construction: assign stops to drivers in priority order.
 *
 * Algorithm:
 * 1. Group stops by mission (paired stops must go to same driver)
 * 2. Sort mission groups by requested time, then priority (desc)
 * 3. For each group, find best driver (closest + has capacity)
 * 4. Assign all stops in the group to that driver
 *
 * Pure function.
 */
export function greedyConstruct(
  stops: ExpandedStop[],
  driverSlots: DriverSlot[],
  matrix: TravelMatrix,
  depotId: string,
): { tours: ProvisionalTour[]; unassigned: UnassignedMission[] } {
  const unassigned: UnassignedMission[] = []

  // Group stops by missionRequestId, preserving sequence order
  const missionGroups = new Map<string, ExpandedStop[]>()
  for (const stop of stops) {
    const group = missionGroups.get(stop.missionRequestId) ?? []
    group.push(stop)
    missionGroups.set(stop.missionRequestId, group)
  }

  // Sort each group by missionSequence
  for (const group of missionGroups.values()) {
    group.sort((a, b) => a.missionSequence - b.missionSequence)
  }

  // Sort mission groups: by requested time, then priority (desc)
  const sortedGroups = [...missionGroups.entries()].sort((a, b) => {
    const aTime = a[1][0].requestedTimeMinutes
    const bTime = b[1][0].requestedTimeMinutes
    if (aTime !== bTime) return aTime - bTime
    return b[1][0].priorityScore - a[1][0].priorityScore
  })

  // Initialize driver slots
  const slots = driverSlots.map((s) => ({ ...s, stops: [...s.stops] }))

  // Assign each mission group
  for (const [missionId, group] of sortedGroups) {
    const dayOfWeek = group[0].dayOfWeek

    // Filter drivers available on this day
    const daySlots = slots.filter((s) => s.dayOfWeek === dayOfWeek)
    if (daySlots.length === 0) {
      unassigned.push({ missionRequestId: missionId, reason: 'No drivers available on this day' })
      continue
    }

    // Find best driver: one whose current position minimizes travel to first stop
    let bestSlot: (typeof slots)[0] | null = null
    let bestTravelMinutes = Infinity

    for (const slot of daySlots) {
      const travelKey = matrixKey(slot.currentLocationId, group[0].locationId)
      const travel = matrix.get(travelKey)
      const travelMinutes = travel ? travel.seconds / 60 : Infinity

      // Check if driver can fit the first stop
      const extras = getStopExtraMinutes(group[0])
      const arrivalTime =
        slot.currentTimeMinutes + travelMinutes + extras.parkingExtra + extras.accompanimentExtra

      if (arrivalTime <= slot.endTimeMinutes && travelMinutes < bestTravelMinutes) {
        bestTravelMinutes = travelMinutes
        bestSlot = slot
      }
    }

    if (!bestSlot) {
      // Try any driver even if stop would be optional
      for (const slot of daySlots) {
        const travelKey = matrixKey(slot.currentLocationId, group[0].locationId)
        const travel = matrix.get(travelKey)
        const travelMinutes = travel ? travel.seconds / 60 : Infinity

        if (travelMinutes < bestTravelMinutes) {
          bestTravelMinutes = travelMinutes
          bestSlot = slot
        }
      }
    }

    if (!bestSlot) {
      unassigned.push({ missionRequestId: missionId, reason: 'No reachable driver found' })
      continue
    }

    // Assign all stops in the group to this driver
    for (const stop of group) {
      const travelKey = matrixKey(bestSlot.currentLocationId, stop.locationId)
      const travel = matrix.get(travelKey)
      const travelMinutes = travel ? Math.round(travel.seconds / 60) : 0
      const extras = getStopExtraMinutes(stop)

      const scheduledTime =
        bestSlot.currentTimeMinutes +
        travelMinutes +
        extras.parkingExtra +
        extras.accompanimentExtra
      const isOptional = scheduledTime > bestSlot.endTimeMinutes

      const assigned: AssignedStop = {
        stop,
        scheduledTimeMinutes: Math.max(scheduledTime, stop.requestedTimeMinutes),
        travelTimeMinutes: travelMinutes,
        parkingExtraMinutes: extras.parkingExtra,
        accompanimentExtraMinutes: extras.accompanimentExtra,
        isOptional,
      }

      bestSlot.stops.push(assigned)
      bestSlot.currentTimeMinutes = assigned.scheduledTimeMinutes
      bestSlot.currentLocationId = stop.locationId
    }
  }

  // Build provisional tours
  const tours: ProvisionalTour[] = []
  for (const slot of slots) {
    if (slot.stops.length === 0) continue

    let totalTravel = 0
    let totalDistance = 0
    for (const s of slot.stops) {
      totalTravel += s.travelTimeMinutes
      const key = matrixKey(
        slot.stops.indexOf(s) === 0
          ? depotId
          : slot.stops[slot.stops.indexOf(s) - 1].stop.locationId,
        s.stop.locationId,
      )
      const travel = matrix.get(key)
      if (travel) totalDistance += travel.meters
    }

    tours.push({
      availabilityId: slot.availabilityId,
      driverId: slot.driverId,
      driverName: slot.driverName,
      vehicleId: slot.vehicleId,
      dayOfWeek: slot.dayOfWeek,
      stops: slot.stops,
      totalTravelMinutes: totalTravel,
      totalDistanceMeters: totalDistance,
    })
  }

  return { tours, unassigned }
}
