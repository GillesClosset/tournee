import { describe, it, expect } from 'vitest'
import { matchLocation } from '@/lib/import/location-matcher'

const locations = [
  { id: '1', name: 'Béluga' },
  { id: '2', name: 'Les Palmiers' },
  { id: '3', name: 'Foyer Central' },
  { id: '4', name: 'Villa Rose' },
]

describe('matchLocation', () => {
  it('exact match', () => {
    expect(matchLocation('Béluga', locations)).toEqual({ locationId: '1', confidence: 1.0 })
  })

  it('case-insensitive match', () => {
    expect(matchLocation('béluga', locations)).toEqual({ locationId: '1', confidence: 1.0 })
  })

  it('accent-stripped match', () => {
    expect(matchLocation('Beluga', locations)).toEqual({ locationId: '1', confidence: 1.0 })
  })

  it('includes match', () => {
    expect(matchLocation('Palmiers', locations)).toEqual({ locationId: '2', confidence: 0.9 })
  })

  it('fuzzy match with small edit distance', () => {
    const result = matchLocation('Villa Ros', locations)
    expect(result).not.toBeNull()
    expect(result!.locationId).toBe('4')
    expect(result!.confidence).toBeGreaterThanOrEqual(0.6)
  })

  it('returns null for no match', () => {
    expect(matchLocation('Totalement Inconnu XYZ', locations)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(matchLocation('', locations)).toBeNull()
  })

  it('returns null for empty locations list', () => {
    expect(matchLocation('Béluga', [])).toBeNull()
  })
})
