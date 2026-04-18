import { describe, test, expect } from 'vitest'
import {
  createScheduleSchema,
  updateScheduleSchema,
  bulkUpsertAvailabilitiesSchema,
} from '@/lib/validators/schedule.schema'

describe('createScheduleSchema', () => {
  test('valid Monday date passes', () => {
    const result = createScheduleSchema.safeParse({ week_start_date: '2025-01-06' }) // Monday
    expect(result.success).toBe(true)
  })

  test('non-Monday date fails', () => {
    const result = createScheduleSchema.safeParse({ week_start_date: '2025-01-07' }) // Tuesday
    expect(result.success).toBe(false)
  })

  test('invalid date format fails', () => {
    const result = createScheduleSchema.safeParse({ week_start_date: '06/01/2025' })
    expect(result.success).toBe(false)
  })

  test('missing week_start_date fails', () => {
    const result = createScheduleSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('updateScheduleSchema', () => {
  test('valid status update passes', () => {
    const result = updateScheduleSchema.safeParse({ status: 'configured' })
    expect(result.success).toBe(true)
  })

  test('invalid status fails', () => {
    const result = updateScheduleSchema.safeParse({ status: 'invalid' })
    expect(result.success).toBe(false)
  })

  test('notes update passes', () => {
    const result = updateScheduleSchema.safeParse({ notes: 'Some note' })
    expect(result.success).toBe(true)
  })
})

describe('bulkUpsertAvailabilitiesSchema', () => {
  const validItem = {
    driver_id: '123e4567-e89b-42d3-a456-426614174000',
    vehicle_id: '223e4567-e89b-42d3-a456-426614174000',
    day_of_week: 1,
    start_time: '08:00',
    end_time: '18:00',
    is_available: true,
  }

  test('valid availability array passes', () => {
    const result = bulkUpsertAvailabilitiesSchema.safeParse([validItem])
    expect(result.success).toBe(true)
  })

  test('empty array passes', () => {
    const result = bulkUpsertAvailabilitiesSchema.safeParse([])
    expect(result.success).toBe(true)
  })

  test('end_time <= start_time fails', () => {
    const result = bulkUpsertAvailabilitiesSchema.safeParse([
      { ...validItem, start_time: '18:00', end_time: '08:00' },
    ])
    expect(result.success).toBe(false)
  })

  test('equal start_time and end_time fails', () => {
    const result = bulkUpsertAvailabilitiesSchema.safeParse([
      { ...validItem, start_time: '08:00', end_time: '08:00' },
    ])
    expect(result.success).toBe(false)
  })

  test('invalid day_of_week (0) fails', () => {
    const result = bulkUpsertAvailabilitiesSchema.safeParse([{ ...validItem, day_of_week: 0 }])
    expect(result.success).toBe(false)
  })

  test('invalid day_of_week (8) fails', () => {
    const result = bulkUpsertAvailabilitiesSchema.safeParse([{ ...validItem, day_of_week: 8 }])
    expect(result.success).toBe(false)
  })

  test('overlapping vehicle assignments on same day fails', () => {
    const item1 = { ...validItem, driver_id: '123e4567-e89b-42d3-a456-426614174000' }
    const item2 = {
      ...validItem,
      driver_id: '323e4567-e89b-42d3-a456-426614174000',
      start_time: '10:00',
      end_time: '20:00',
    }
    const result = bulkUpsertAvailabilitiesSchema.safeParse([item1, item2])
    expect(result.success).toBe(false)
  })

  test('same vehicle on different days passes', () => {
    const item1 = { ...validItem, day_of_week: 1 }
    const item2 = {
      ...validItem,
      driver_id: '323e4567-e89b-42d3-a456-426614174000',
      day_of_week: 2,
    }
    const result = bulkUpsertAvailabilitiesSchema.safeParse([item1, item2])
    expect(result.success).toBe(true)
  })

  test('non-overlapping times with same vehicle on same day passes', () => {
    const item1 = { ...validItem, start_time: '08:00', end_time: '12:00' }
    const item2 = {
      ...validItem,
      driver_id: '323e4567-e89b-42d3-a456-426614174000',
      start_time: '12:00',
      end_time: '18:00',
    }
    const result = bulkUpsertAvailabilitiesSchema.safeParse([item1, item2])
    expect(result.success).toBe(true)
  })

  test('null vehicle_id does not trigger conflict', () => {
    const item1 = { ...validItem, vehicle_id: null }
    const item2 = {
      ...validItem,
      driver_id: '323e4567-e89b-42d3-a456-426614174000',
      vehicle_id: null,
    }
    const result = bulkUpsertAvailabilitiesSchema.safeParse([item1, item2])
    expect(result.success).toBe(true)
  })
})
