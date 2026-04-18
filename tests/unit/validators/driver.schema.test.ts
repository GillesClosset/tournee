import { describe, test, expect } from 'vitest'
import { createDriverSchema, updateDriverSchema } from '@/lib/validators/driver.schema'

describe('createDriverSchema', () => {
  test('valid input passes', () => {
    const result = createDriverSchema.safeParse({ name: 'Alice Martin', notes: 'Expérimentée' })
    expect(result.success).toBe(true)
  })

  test('valid input without notes passes', () => {
    const result = createDriverSchema.safeParse({ name: 'Bob Dupont' })
    expect(result.success).toBe(true)
  })

  test('missing name fails', () => {
    const result = createDriverSchema.safeParse({ notes: 'Some note' })
    expect(result.success).toBe(false)
  })

  test('empty name fails', () => {
    const result = createDriverSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  test('notes exceeding 500 chars fails', () => {
    const result = createDriverSchema.safeParse({ name: 'Alice', notes: 'x'.repeat(501) })
    expect(result.success).toBe(false)
  })
})

describe('updateDriverSchema', () => {
  test('valid update with id passes', () => {
    const result = updateDriverSchema.safeParse({
      id: '123e4567-e89b-42d3-a456-426614174000',
      name: 'Alice Updated',
    })
    expect(result.success).toBe(true)
  })

  test('missing id fails', () => {
    const result = updateDriverSchema.safeParse({ name: 'Alice' })
    expect(result.success).toBe(false)
  })

  test('invalid uuid fails', () => {
    const result = updateDriverSchema.safeParse({ id: 'not-a-uuid', name: 'Alice' })
    expect(result.success).toBe(false)
  })

  test('is_active boolean toggles', () => {
    const result = updateDriverSchema.safeParse({
      id: '123e4567-e89b-42d3-a456-426614174000',
      is_active: false,
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.is_active).toBe(false)
  })
})
