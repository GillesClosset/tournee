import { describe, it, expect } from 'vitest'
import { normalizeTime } from '@/lib/import/time-normalizer'

describe('normalizeTime', () => {
  it('parses "8h" → 08:00', () => {
    expect(normalizeTime('8h')).toEqual({ time: '08:00', timeRangeEnd: null })
  })

  it('parses "08h30" → 08:30', () => {
    expect(normalizeTime('08h30')).toEqual({ time: '08:30', timeRangeEnd: null })
  })

  it('parses "9H30" (uppercase H)', () => {
    expect(normalizeTime('9H30')).toEqual({ time: '09:30', timeRangeEnd: null })
  })

  it('parses "15h-16h" as range', () => {
    expect(normalizeTime('15h-16h')).toEqual({ time: '15:00', timeRangeEnd: '16:00' })
  })

  it('parses "17h30-19h00" as range', () => {
    expect(normalizeTime('17h30-19h00')).toEqual({ time: '17:30', timeRangeEnd: '19:00' })
  })

  it('handles whitespace', () => {
    expect(normalizeTime('  8h  ')).toEqual({ time: '08:00', timeRangeEnd: null })
  })

  it('returns null for empty string', () => {
    expect(normalizeTime('')).toBeNull()
  })

  it('returns null for garbage input', () => {
    expect(normalizeTime('abc')).toBeNull()
  })

  it('parses "0h" (midnight)', () => {
    expect(normalizeTime('0h')).toEqual({ time: '00:00', timeRangeEnd: null })
  })

  it('returns null for invalid hours', () => {
    expect(normalizeTime('25h')).toBeNull()
  })

  it('returns null for invalid minutes', () => {
    expect(normalizeTime('8h75')).toBeNull()
  })
})
