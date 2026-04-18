import { describe, test, expect } from 'vitest'
import { createLocationSchema, updateLocationSchema } from '@/lib/validators/location.schema'

describe('createLocationSchema', () => {
  test('valid villa location passes', () => {
    const result = createLocationSchema.safeParse({
      name: 'Villa les Pins',
      address: '12 rue des Pins, 06000 Nice',
      location_type: 'villa',
      parking_difficulty: false,
    })
    expect(result.success).toBe(true)
  })

  test('valid rdv location with notes passes', () => {
    const result = createLocationSchema.safeParse({
      name: 'Collège Emile Roux',
      address: 'Collège Emile Roux, Nice',
      location_type: 'rdv',
      parking_difficulty: true,
      notes: 'Entrée côté rue principale',
    })
    expect(result.success).toBe(true)
  })

  test('missing name fails', () => {
    const result = createLocationSchema.safeParse({
      address: '12 rue des Pins',
      location_type: 'villa',
      parking_difficulty: false,
    })
    expect(result.success).toBe(false)
  })

  test('missing address fails', () => {
    const result = createLocationSchema.safeParse({
      name: 'Villa',
      location_type: 'villa',
      parking_difficulty: false,
    })
    expect(result.success).toBe(false)
  })

  test('invalid location_type fails', () => {
    const result = createLocationSchema.safeParse({
      name: 'Villa',
      address: '12 rue des Pins',
      location_type: 'hotel',
      parking_difficulty: false,
    })
    expect(result.success).toBe(false)
  })
})

describe('updateLocationSchema', () => {
  test('valid update with id passes', () => {
    const result = updateLocationSchema.safeParse({
      id: '123e4567-e89b-42d3-a456-426614174000',
      name: 'New Name',
    })
    expect(result.success).toBe(true)
  })

  test('missing id fails', () => {
    const result = updateLocationSchema.safeParse({ name: 'New Name' })
    expect(result.success).toBe(false)
  })

  test('is_active toggle passes', () => {
    const result = updateLocationSchema.safeParse({
      id: '123e4567-e89b-42d3-a456-426614174000',
      is_active: false,
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.is_active).toBe(false)
  })
})
