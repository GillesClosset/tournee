import { describe, test, expect, beforeEach } from 'vitest'
import { expandMissions, resetStopIdCounter, type MissionForExpansion } from '@/lib/engine/expander'

function makeMission(overrides: Partial<MissionForExpansion> = {}): MissionForExpansion {
  return {
    id: 'mission-1',
    dayOfWeek: 1,
    locationId: 'villa-1',
    locationLatitude: 43.67,
    locationLongitude: 7.21,
    locationName: 'Villa A',
    locationParkingDifficulty: false,
    destinationLocationId: 'dest-1',
    destinationLatitude: 43.7,
    destinationLongitude: 7.25,
    destinationName: 'School B',
    destinationParkingDifficulty: false,
    requestedTime: '08:30',
    timeRangeEnd: null,
    missionType: 'accompagnement',
    priorityScore: 50,
    missionText: 'Test mission',
    ...overrides,
  }
}

describe('expandMissions', () => {
  beforeEach(() => resetStopIdCounter())

  test('accompagnement → 2 stops (villa first, then destination)', () => {
    const stops = expandMissions([makeMission({ missionType: 'accompagnement' })])
    expect(stops).toHaveLength(2)
    expect(stops[0].locationId).toBe('villa-1')
    expect(stops[0].missionSequence).toBe(0)
    expect(stops[1].locationId).toBe('dest-1')
    expect(stops[1].missionSequence).toBe(1)
  })

  test('recuperation → 2 stops (destination first, then villa)', () => {
    const stops = expandMissions([makeMission({ missionType: 'recuperation' })])
    expect(stops).toHaveLength(2)
    expect(stops[0].locationId).toBe('dest-1')
    expect(stops[0].missionSequence).toBe(0)
    expect(stops[1].locationId).toBe('villa-1')
    expect(stops[1].missionSequence).toBe(1)
  })

  test('both → 4 stops (outbound + return)', () => {
    const stops = expandMissions([makeMission({ missionType: 'both' })])
    expect(stops).toHaveLength(4)
    expect(stops[0].locationId).toBe('villa-1') // outbound pickup
    expect(stops[1].locationId).toBe('dest-1') // outbound dropoff
    expect(stops[2].locationId).toBe('dest-1') // return pickup
    expect(stops[3].locationId).toBe('villa-1') // return dropoff
  })

  test('skips missions without valid villa location', () => {
    const stops = expandMissions([makeMission({ locationId: null })])
    expect(stops).toHaveLength(0)
  })

  test('skips missions without destination coordinates', () => {
    const stops = expandMissions([makeMission({ destinationLatitude: null })])
    expect(stops).toHaveLength(0)
  })

  test('parking difficulty flag is set on villa stop', () => {
    const stops = expandMissions([makeMission({ locationParkingDifficulty: true })])
    expect(stops[0].parkingDifficulty).toBe(true)
    expect(stops[1].parkingDifficulty).toBe(false) // destination
  })

  test('villa stop is marked as accompaniment', () => {
    const stops = expandMissions([makeMission()])
    expect(stops[0].isAccompaniment).toBe(true) // villa = accompaniment
    expect(stops[1].isAccompaniment).toBe(false) // destination = not
  })
})
