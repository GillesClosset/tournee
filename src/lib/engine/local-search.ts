// ─── Local Search Optimizer ──────────────────────────────────────────────────

import type { ProvisionalTour, AssignedStop, TravelMatrix } from './types'
import { matrixKey } from './types'
import { LOCAL_SEARCH_MAX_ITERATIONS } from './constants'
import { getStopExtraMinutes } from './expander'

/**
 * Improve tours using local search:
 * (a) 2-opt intra-tour: reverse segments to reduce travel time
 * (b) Relocate inter-tour: move a stop to another tour if it reduces total time
 *
 * Pure function — returns new tour array.
 */
export function improveTours(
  tours: ProvisionalTour[],
  matrix: TravelMatrix,
  depotId: string,
): ProvisionalTour[] {
  let current = tours.map((t) => ({
    ...t,
    stops: [...t.stops],
  }))

  for (let iter = 0; iter < LOCAL_SEARCH_MAX_ITERATIONS; iter++) {
    let improved = false

    // (a) 2-opt intra-tour
    for (const tour of current) {
      if (tour.stops.length < 3) continue
      const result = twoOptImprove(tour, matrix, depotId)
      if (result.improved) {
        tour.stops = result.stops
        improved = true
      }
    }

    // (b) Relocate inter-tour
    if (current.length >= 2) {
      const result = relocateImprove(current, matrix, depotId)
      if (result.improved) {
        current = result.tours
        improved = true
      }
    }

    if (!improved) break
  }

  // Recalculate totals and scheduled times
  return current.map((tour) => recalcTour(tour, matrix, depotId))
}

/**
 * 2-opt: try reversing every segment [i..j] and keep if travel cost improves.
 */
function twoOptImprove(
  tour: ProvisionalTour,
  matrix: TravelMatrix,
  depotId: string,
): { stops: AssignedStop[]; improved: boolean } {
  const stops = [...tour.stops]
  let improved = false
  const n = stops.length

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      // Check if reversing [i..j] improves travel
      const currentCost = segmentTravelCost(stops, i, j, matrix, depotId)
      const reversed = [...stops]
      const segment = reversed.splice(i, j - i + 1)
      segment.reverse()
      reversed.splice(i, 0, ...segment)

      const newCost = segmentTravelCost(reversed, i, j, matrix, depotId)
      if (newCost < currentCost - 0.01) {
        stops.splice(0, stops.length, ...reversed)
        improved = true
      }
    }
  }

  return { stops, improved }
}

/**
 * Calculate travel cost for segment [i..j] including connections to neighbors.
 */
function segmentTravelCost(
  stops: AssignedStop[],
  i: number,
  j: number,
  matrix: TravelMatrix,
  depotId: string,
): number {
  let cost = 0

  // Connection from previous to i
  const prevId = i === 0 ? depotId : stops[i - 1].stop.locationId
  const toPrev = matrix.get(matrixKey(prevId, stops[i].stop.locationId))
  cost += toPrev ? toPrev.seconds : 0

  // Internal connections
  for (let k = i; k < j; k++) {
    const t = matrix.get(matrixKey(stops[k].stop.locationId, stops[k + 1].stop.locationId))
    cost += t ? t.seconds : 0
  }

  // Connection from j to next
  if (j < stops.length - 1) {
    const toNext = matrix.get(matrixKey(stops[j].stop.locationId, stops[j + 1].stop.locationId))
    cost += toNext ? toNext.seconds : 0
  }

  return cost
}

/**
 * Try moving each stop from one tour to a better position in another tour.
 */
function relocateImprove(
  tours: ProvisionalTour[],
  matrix: TravelMatrix,
  depotId: string,
): { tours: ProvisionalTour[]; improved: boolean } {
  const result = tours.map((t) => ({ ...t, stops: [...t.stops] }))
  let improved = false

  for (let ti = 0; ti < result.length; ti++) {
    for (let si = result[ti].stops.length - 1; si >= 0; si--) {
      const stop = result[ti].stops[si]

      // Don't relocate stops that are part of a paired mission
      // (check if there are other stops from same mission in this tour)
      const sameMission = result[ti].stops.filter(
        (s) => s.stop.missionRequestId === stop.stop.missionRequestId,
      )
      if (sameMission.length > 1) continue

      const currentTourCost = tourTravelCost(result[ti], matrix, depotId)

      // Try inserting into other tours
      for (let tj = 0; tj < result.length; tj++) {
        if (ti === tj) continue
        if (result[ti].dayOfWeek !== result[tj].dayOfWeek) continue

        const otherCost = tourTravelCost(result[tj], matrix, depotId)

        // Try each insertion position
        for (let pos = 0; pos <= result[tj].stops.length; pos++) {
          const newSourceStops = [...result[ti].stops]
          newSourceStops.splice(si, 1)

          const newDestStops = [...result[tj].stops]
          newDestStops.splice(pos, 0, stop)

          const newSourceCost = tourTravelCostFromStops(newSourceStops, matrix, depotId)
          const newDestCost = tourTravelCostFromStops(newDestStops, matrix, depotId)

          if (newSourceCost + newDestCost < currentTourCost + otherCost - 0.01) {
            result[ti].stops = newSourceStops
            result[tj].stops = newDestStops
            improved = true
            break
          }
        }
        if (improved) break
      }
      if (improved) break
    }
    if (improved) break
  }

  return { tours: result.filter((t) => t.stops.length > 0), improved }
}

function tourTravelCost(tour: ProvisionalTour, matrix: TravelMatrix, depotId: string): number {
  return tourTravelCostFromStops(tour.stops, matrix, depotId)
}

function tourTravelCostFromStops(
  stops: AssignedStop[],
  matrix: TravelMatrix,
  depotId: string,
): number {
  if (stops.length === 0) return 0
  let cost = 0
  let prevId = depotId
  for (const s of stops) {
    const t = matrix.get(matrixKey(prevId, s.stop.locationId))
    cost += t ? t.seconds : 0
    prevId = s.stop.locationId
  }
  return cost
}

/**
 * Recalculate scheduled times and totals for a tour.
 */
function recalcTour(tour: ProvisionalTour, matrix: TravelMatrix, depotId: string): ProvisionalTour {
  let currentTime = tour.stops.length > 0 ? tour.stops[0].scheduledTimeMinutes : 0
  let prevLocationId = depotId
  let totalTravel = 0
  let totalDistance = 0

  // Find the driver's start time from the first stop's original scheduling
  // We use the tour's start from the first assigned stop minus its travel
  if (tour.stops.length > 0) {
    const firstStop = tour.stops[0]
    currentTime =
      firstStop.scheduledTimeMinutes -
      firstStop.travelTimeMinutes -
      firstStop.parkingExtraMinutes -
      firstStop.accompanimentExtraMinutes
  }

  const newStops: AssignedStop[] = []
  for (const s of tour.stops) {
    const travelEntry = matrix.get(matrixKey(prevLocationId, s.stop.locationId))
    const travelMinutes = travelEntry ? Math.round(travelEntry.seconds / 60) : 0
    const extras = getStopExtraMinutes(s.stop)

    currentTime += travelMinutes + extras.parkingExtra + extras.accompanimentExtra
    const scheduledTime = Math.max(currentTime, s.stop.requestedTimeMinutes)

    totalTravel += travelMinutes
    if (travelEntry) totalDistance += travelEntry.meters

    newStops.push({
      ...s,
      scheduledTimeMinutes: scheduledTime,
      travelTimeMinutes: travelMinutes,
      parkingExtraMinutes: extras.parkingExtra,
      accompanimentExtraMinutes: extras.accompanimentExtra,
    })

    currentTime = scheduledTime
    prevLocationId = s.stop.locationId
  }

  return {
    ...tour,
    stops: newStops,
    totalTravelMinutes: totalTravel,
    totalDistanceMeters: Math.round(totalDistance),
  }
}
