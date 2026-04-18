import { describe, test, expect } from 'vitest'
import {
  computePriorityScore,
  type MissionForPriority,
  type WeeklyStats,
} from '@/lib/engine/priority'

const defaultStats: WeeklyStats = {
  villaRequestCounts: new Map(),
  totalMissions: 10,
  totalDriverSlots: 5,
}

function makeMission(overrides: Partial<MissionForPriority> = {}): MissionForPriority {
  return {
    accompanimentType: 'autre',
    isPriorityFlagged: false,
    priorityOverride: null,
    latitude: null,
    longitude: null,
    locationId: null,
    ...overrides,
  }
}

describe('computePriorityScore', () => {
  test('medical > scolaire > famille > loisir', () => {
    const medical = computePriorityScore(
      makeMission({ accompanimentType: 'medical' }),
      defaultStats,
    )
    const scolaire = computePriorityScore(
      makeMission({ accompanimentType: 'scolaire' }),
      defaultStats,
    )
    const famille = computePriorityScore(
      makeMission({ accompanimentType: 'famille' }),
      defaultStats,
    )
    const loisir = computePriorityScore(makeMission({ accompanimentType: 'loisir' }), defaultStats)

    expect(medical).toBeGreaterThan(scolaire)
    expect(scolaire).toBeGreaterThan(famille)
    expect(famille).toBeGreaterThan(loisir)
  })

  test('priority flag boosts score', () => {
    const unflagged = computePriorityScore(makeMission({ isPriorityFlagged: false }), defaultStats)
    const flagged = computePriorityScore(makeMission({ isPriorityFlagged: true }), defaultStats)

    expect(flagged).toBeGreaterThan(unflagged)
  })

  test('override takes precedence', () => {
    const score = computePriorityScore(
      makeMission({ priorityOverride: '75', accompanimentType: 'loisir' }),
      defaultStats,
    )
    expect(score).toBe(75)
  })

  test('override is clamped to 0-100', () => {
    expect(computePriorityScore(makeMission({ priorityOverride: '150' }), defaultStats)).toBe(100)
    expect(computePriorityScore(makeMission({ priorityOverride: '-10' }), defaultStats)).toBe(0)
  })

  test('score is between 0 and 100', () => {
    const score = computePriorityScore(makeMission(), defaultStats)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  test('distance from depot affects score', () => {
    // Close to depot
    const close = computePriorityScore(
      makeMission({ latitude: 43.673, longitude: 7.211 }),
      defaultStats,
    )
    // Far from depot
    const far = computePriorityScore(makeMission({ latitude: 44.0, longitude: 7.5 }), defaultStats)

    expect(far).toBeGreaterThan(close)
  })

  test('villa scarcity: fewer requests = higher priority', () => {
    const scarce = computePriorityScore(makeMission({ locationId: 'villa-rare' }), {
      ...defaultStats,
      villaRequestCounts: new Map([['villa-rare', 1]]),
    })
    const common = computePriorityScore(makeMission({ locationId: 'villa-common' }), {
      ...defaultStats,
      villaRequestCounts: new Map([['villa-common', 5]]),
    })

    expect(scarce).toBeGreaterThan(common)
  })
})
