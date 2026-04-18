import { describe, it, expect } from 'vitest'
import { parseDayOfWeek } from '@/lib/import/day-parser'

describe('parseDayOfWeek', () => {
  it('parses "Lundi 16-Mars" → 1', () => {
    expect(parseDayOfWeek('Lundi 16-Mars')).toBe(1)
  })

  it('parses "mercredi 18 mars" → 3', () => {
    expect(parseDayOfWeek('mercredi 18 mars')).toBe(3)
  })

  it('parses "JEUDI" → 4', () => {
    expect(parseDayOfWeek('JEUDI')).toBe(4)
  })

  it('parses "vendredi" → 5', () => {
    expect(parseDayOfWeek('vendredi')).toBe(5)
  })

  it('parses "Samedi 21 mars" → 6', () => {
    expect(parseDayOfWeek('Samedi 21 mars')).toBe(6)
  })

  it('parses "dimanche" → 7', () => {
    expect(parseDayOfWeek('dimanche')).toBe(7)
  })

  it('returns null for empty string', () => {
    expect(parseDayOfWeek('')).toBeNull()
  })

  it('returns null for garbage', () => {
    expect(parseDayOfWeek('xyz123')).toBeNull()
  })

  it('is case-insensitive', () => {
    expect(parseDayOfWeek('MARDI')).toBe(2)
  })
})
