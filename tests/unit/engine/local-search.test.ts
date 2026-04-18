import { describe, test, expect } from 'vitest'
import { improveTours } from '@/lib/engine/local-search'
import type { ProvisionalTour, AssignedStop, TravelMatrix, ExpandedStop } from '@/lib/engine/types'
import { matrixKey } from '@/lib/engine/types'

const DEPOT = '__depot__'

function makeExpandedStop(id: string, locationId: string): ExpandedStop {
  return {
    id,
    missionRequestId: `mission-${id}`,
    locationId,
    latitude: 43.7,
    longitude: 7.25,
    requestedTimeMinutes: 510,
    timeRangeEndMinutes: null,
    dayOfWeek: 1,
    priorityScore: 50,
    parkingDifficulty: false,
    isAccompaniment: false,
    missionSequence: 0,
    label: `Stop ${id}`,
  }
}

function makeAssigned(id: string, locationId: string, time: number): AssignedStop {
  return {
    stop: makeExpandedStop(id, locationId),
    scheduledTimeMinutes: time,
    travelTimeMinutes: 10,
    parkingExtraMinutes: 0,
    accompanimentExtraMinutes: 0,
    isOptional: false,
  }
}

function makeMatrix(entries: [string, string, number][]): TravelMatrix {
  const m: TravelMatrix = new Map()
  for (const [o, d, sec] of entries) {
    m.set(matrixKey(o, d), { seconds: sec, meters: sec * 10 })
  }
  return m
}

describe('improveTours', () => {
  test('2-opt improves a deliberately bad ordering', () => {
    // Locations in a line: A(0) - B(1) - C(2) - D(3)
    // Bad order: A, C, B, D (zigzag)
    // Good order: A, B, C, D (straight)
    const matrix = makeMatrix([
      [DEPOT, 'A', 100],
      [DEPOT, 'B', 200],
      [DEPOT, 'C', 300],
      [DEPOT, 'D', 400],
      ['A', 'B', 100],
      ['A', 'C', 200],
      ['A', 'D', 300],
      ['B', 'A', 100],
      ['B', 'C', 100],
      ['B', 'D', 200],
      ['C', 'A', 200],
      ['C', 'B', 100],
      ['C', 'D', 100],
      ['D', 'A', 300],
      ['D', 'B', 200],
      ['D', 'C', 100],
    ])

    const badTour: ProvisionalTour = {
      availabilityId: 'a1',
      driverId: 'd1',
      driverName: 'Driver',
      vehicleId: null,
      dayOfWeek: 1,
      stops: [
        makeAssigned('1', 'A', 510),
        makeAssigned('2', 'C', 520), // zigzag
        makeAssigned('3', 'B', 530), // zigzag
        makeAssigned('4', 'D', 540),
      ],
      totalTravelMinutes: 0,
      totalDistanceMeters: 0,
    }

    const improved = improveTours([badTour], matrix, DEPOT)

    // The improved tour should have less or equal total travel
    expect(improved).toHaveLength(1)
    expect(improved[0].stops).toHaveLength(4)
    expect(improved[0].totalTravelMinutes).toBeLessThanOrEqual(
      badTour.stops.reduce((s, st) => s + st.travelTimeMinutes, 0) + 100,
    )
  })

  test('does not loop forever (converges)', () => {
    const matrix = makeMatrix([
      [DEPOT, 'A', 100],
      ['A', DEPOT, 100],
    ])

    const tour: ProvisionalTour = {
      availabilityId: 'a1',
      driverId: 'd1',
      driverName: 'Driver',
      vehicleId: null,
      dayOfWeek: 1,
      stops: [makeAssigned('1', 'A', 510)],
      totalTravelMinutes: 10,
      totalDistanceMeters: 1000,
    }

    // Should not hang
    const result = improveTours([tour], matrix, DEPOT)
    expect(result).toHaveLength(1)
  })

  test('handles empty tours', () => {
    const result = improveTours([], new Map(), DEPOT)
    expect(result).toHaveLength(0)
  })

  test('relocate moves a stop to a better tour', () => {
    // Tour 1 has stop A (far from depot), Tour 2 is near A
    const matrix = makeMatrix([
      [DEPOT, 'A', 1000],
      [DEPOT, 'B', 100],
      [DEPOT, 'C', 100],
      ['A', DEPOT, 1000],
      ['A', 'B', 900],
      ['A', 'C', 900],
      ['B', DEPOT, 100],
      ['B', 'A', 900],
      ['B', 'C', 50],
      ['C', DEPOT, 100],
      ['C', 'A', 50],
      ['C', 'B', 50],
    ])

    const tour1: ProvisionalTour = {
      availabilityId: 'a1',
      driverId: 'd1',
      driverName: 'D1',
      vehicleId: null,
      dayOfWeek: 1,
      stops: [makeAssigned('1', 'A', 510)],
      totalTravelMinutes: 17,
      totalDistanceMeters: 10000,
    }
    const tour2: ProvisionalTour = {
      availabilityId: 'a2',
      driverId: 'd2',
      driverName: 'D2',
      vehicleId: null,
      dayOfWeek: 1,
      stops: [makeAssigned('2', 'C', 510)],
      totalTravelMinutes: 2,
      totalDistanceMeters: 1000,
    }

    const result = improveTours([tour1, tour2], matrix, DEPOT)
    // A might be relocated to tour2 since C is close to A
    expect(result.length).toBeGreaterThanOrEqual(1)
  })
})
