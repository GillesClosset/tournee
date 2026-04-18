// ─── Mission Expander ────────────────────────────────────────────────────────

import { PARKING_EXTRA_MINUTES, ACCOMPANIMENT_EXTRA_MINUTES, timeToMinutes } from './constants'
import type { ExpandedStop } from './types'

/** Minimal mission shape needed for expansion */
export interface MissionForExpansion {
  id: string
  dayOfWeek: number
  locationId: string | null
  locationLatitude: number | null
  locationLongitude: number | null
  locationName: string | null
  locationParkingDifficulty: boolean
  destinationLocationId: string | null
  destinationLatitude: number | null
  destinationLongitude: number | null
  destinationName: string | null
  destinationParkingDifficulty: boolean
  requestedTime: string
  timeRangeEnd: string | null
  missionType: 'accompagnement' | 'recuperation' | 'both'
  priorityScore: number
  missionText: string
}

let stopIdCounter = 0

function nextStopId(): string {
  return `stop-${++stopIdCounter}`
}

/** Reset counter (for tests) */
export function resetStopIdCounter(): void {
  stopIdCounter = 0
}

/**
 * Expand missions into individual stops based on mission type.
 * - accompagnement: villa → destination (2 stops)
 * - recuperation: destination → villa (2 stops)
 * - both: villa → destination → destination → villa (4 stops, but simplified to 2 round-trip pairs)
 *
 * Pure function (except for counter).
 */
export function expandMissions(missions: MissionForExpansion[]): ExpandedStop[] {
  const stops: ExpandedStop[] = []

  for (const m of missions) {
    if (!m.locationId || m.locationLatitude === null || m.locationLongitude === null) {
      continue // skip missions without valid villa location
    }
    if (m.destinationLatitude === null || m.destinationLongitude === null) {
      continue // skip missions without valid destination
    }

    const villa: Omit<ExpandedStop, 'id' | 'missionSequence' | 'label'> = {
      missionRequestId: m.id,
      locationId: m.locationId,
      latitude: m.locationLatitude,
      longitude: m.locationLongitude,
      requestedTimeMinutes: timeToMinutes(m.requestedTime),
      timeRangeEndMinutes: m.timeRangeEnd ? timeToMinutes(m.timeRangeEnd) : null,
      dayOfWeek: m.dayOfWeek,
      priorityScore: m.priorityScore,
      parkingDifficulty: m.locationParkingDifficulty,
      isAccompaniment: true,
    }

    const dest: Omit<ExpandedStop, 'id' | 'missionSequence' | 'label'> = {
      missionRequestId: m.id,
      locationId: m.destinationLocationId ?? `dest-${m.id}`,
      latitude: m.destinationLatitude,
      longitude: m.destinationLongitude,
      requestedTimeMinutes: timeToMinutes(m.requestedTime),
      timeRangeEndMinutes: m.timeRangeEnd ? timeToMinutes(m.timeRangeEnd) : null,
      dayOfWeek: m.dayOfWeek,
      priorityScore: m.priorityScore,
      parkingDifficulty: m.destinationParkingDifficulty,
      isAccompaniment: false,
    }

    switch (m.missionType) {
      case 'accompagnement':
        // Villa → Destination
        stops.push({
          ...villa,
          id: nextStopId(),
          missionSequence: 0,
          label: `${m.missionText} (pickup @ ${m.locationName ?? 'villa'})`,
        })
        stops.push({
          ...dest,
          id: nextStopId(),
          missionSequence: 1,
          label: `${m.missionText} (dropoff @ ${m.destinationName ?? 'destination'})`,
        })
        break

      case 'recuperation':
        // Destination → Villa
        stops.push({
          ...dest,
          id: nextStopId(),
          missionSequence: 0,
          label: `${m.missionText} (pickup @ ${m.destinationName ?? 'destination'})`,
        })
        stops.push({
          ...villa,
          id: nextStopId(),
          missionSequence: 1,
          label: `${m.missionText} (dropoff @ ${m.locationName ?? 'villa'})`,
        })
        break

      case 'both':
        // Outbound: Villa → Destination
        stops.push({
          ...villa,
          id: nextStopId(),
          missionSequence: 0,
          label: `${m.missionText} (outbound pickup @ ${m.locationName ?? 'villa'})`,
        })
        stops.push({
          ...dest,
          id: nextStopId(),
          missionSequence: 1,
          label: `${m.missionText} (outbound dropoff @ ${m.destinationName ?? 'destination'})`,
        })
        // Return: Destination → Villa
        stops.push({
          ...dest,
          id: nextStopId(),
          missionSequence: 2,
          label: `${m.missionText} (return pickup @ ${m.destinationName ?? 'destination'})`,
        })
        stops.push({
          ...villa,
          id: nextStopId(),
          missionSequence: 3,
          label: `${m.missionText} (return dropoff @ ${m.locationName ?? 'villa'})`,
        })
        break
    }
  }

  return stops
}

/**
 * Get the extra minutes for a stop (parking + accompaniment).
 */
export function getStopExtraMinutes(stop: ExpandedStop): {
  parkingExtra: number
  accompanimentExtra: number
} {
  return {
    parkingExtra: stop.parkingDifficulty ? PARKING_EXTRA_MINUTES : 0,
    accompanimentExtra: stop.isAccompaniment ? ACCOMPANIMENT_EXTRA_MINUTES : 0,
  }
}
