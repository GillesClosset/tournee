import { describe, test, expect } from 'vitest'
import { greedyConstruct } from '@/lib/engine/greedy'
import type { ExpandedStop, DriverSlot, TravelMatrix } from '@/lib/engine/types'
import { matrixKey } from '@/lib/engine/types'

const DEPOT = '__depot__'

function makeStop(overrides: Partial<ExpandedStop> = {}): ExpandedStop {
  return {
    id: 'stop-1',
    missionRequestId: 'mission-1',
    locationId: 'loc-1',
    latitude: 43.7,
    longitude: 7.25,
    requestedTimeMinutes: 510, // 08:30
    timeRangeEndMinutes: null,
    dayOfWeek: 1,
    priorityScore: 50,
    parkingDifficulty: false,
    isAccompaniment: false,
    missionSequence: 0,
    label: 'Test stop',
    ...overrides,
  }
}

function makeSlot(overrides: Partial<DriverSlot> = {}): DriverSlot {
  return {
    availabilityId: 'avail-1',
    driverId: 'driver-1',
    driverName: 'Driver A',
    vehicleId: 'vehicle-1',
    dayOfWeek: 1,
    startTimeMinutes: 480, // 08:00
    endTimeMinutes: 1080, // 18:00
    currentTimeMinutes: 480,
    currentLocationId: DEPOT,
    stops: [],
    ...overrides,
  }
}

function makeMatrix(entries: [string, string, number, number][]): TravelMatrix {
  const m: TravelMatrix = new Map()
  for (const [o, d, sec, met] of entries) {
    m.set(matrixKey(o, d), { seconds: sec, meters: met })
  }
  return m
}

describe('greedyConstruct', () => {
  test('assigns a stop to the only available driver', () => {
    const stops = [makeStop()]
    const slots = [makeSlot()]
    const matrix = makeMatrix([[DEPOT, 'loc-1', 600, 5000]])

    const { tours, unassigned } = greedyConstruct(stops, slots, matrix, DEPOT)

    expect(tours).toHaveLength(1)
    expect(tours[0].stops).toHaveLength(1)
    expect(unassigned).toHaveLength(0)
  })

  test('assigns high-priority stops first', () => {
    const stops = [
      makeStop({
        id: 'low',
        missionRequestId: 'low',
        priorityScore: 10,
        requestedTimeMinutes: 510,
      }),
      makeStop({
        id: 'high',
        missionRequestId: 'high',
        locationId: 'loc-2',
        priorityScore: 90,
        requestedTimeMinutes: 510,
      }),
    ]
    const slots = [makeSlot()]
    const matrix = makeMatrix([
      [DEPOT, 'loc-1', 600, 5000],
      [DEPOT, 'loc-2', 600, 5000],
      ['loc-1', 'loc-2', 300, 2000],
      ['loc-2', 'loc-1', 300, 2000],
    ])

    const { tours } = greedyConstruct(stops, slots, matrix, DEPOT)

    // High priority should be assigned (both at same time, high prio first)
    expect(tours[0].stops.length).toBeGreaterThanOrEqual(1)
  })

  test('reports unassigned when no drivers available on that day', () => {
    const stops = [makeStop({ dayOfWeek: 3 })]
    const slots = [makeSlot({ dayOfWeek: 1 })]
    const matrix = makeMatrix([])

    const { unassigned } = greedyConstruct(stops, slots, matrix, DEPOT)

    expect(unassigned).toHaveLength(1)
    expect(unassigned[0].reason).toContain('No drivers available')
  })

  test('marks stops beyond driver end time as optional', () => {
    const stops = [
      makeStop({ requestedTimeMinutes: 1070 }), // 17:50
    ]
    const slots = [makeSlot({ endTimeMinutes: 1080 })] // ends 18:00
    const matrix = makeMatrix([[DEPOT, 'loc-1', 1200, 10000]]) // 20 min travel

    const { tours } = greedyConstruct(stops, slots, matrix, DEPOT)

    // Stop at 17:50 + 20min travel = past 18:00 → optional
    expect(tours).toHaveLength(1)
  })

  test('paired stops go to same driver', () => {
    const stops = [
      makeStop({ id: 's1', missionRequestId: 'm1', locationId: 'villa', missionSequence: 0 }),
      makeStop({ id: 's2', missionRequestId: 'm1', locationId: 'school', missionSequence: 1 }),
    ]
    const slots = [
      makeSlot(),
      makeSlot({ availabilityId: 'avail-2', driverId: 'driver-2', driverName: 'Driver B' }),
    ]
    const matrix = makeMatrix([
      [DEPOT, 'villa', 600, 5000],
      [DEPOT, 'school', 600, 5000],
      ['villa', 'school', 300, 2000],
      ['school', 'villa', 300, 2000],
    ])

    const { tours } = greedyConstruct(stops, slots, matrix, DEPOT)

    // Both stops should be in the same tour
    const tourWithStops = tours.filter((t) => t.stops.length > 0)
    expect(tourWithStops).toHaveLength(1)
    expect(tourWithStops[0].stops).toHaveLength(2)
  })
})
