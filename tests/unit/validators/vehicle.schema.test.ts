import { describe, test, expect } from 'vitest'
import { createVehicleSchema, updateVehicleSchema } from '@/lib/validators/vehicle.schema'

describe('createVehicleSchema', () => {
  test('valid input passes', () => {
    const result = createVehicleSchema.safeParse({
      name: 'Renault Kangoo',
      license_plate: 'AB-123-CD',
    })
    expect(result.success).toBe(true)
  })

  test('valid with notes passes', () => {
    const result = createVehicleSchema.safeParse({
      name: 'Peugeot Partner',
      license_plate: 'ZZ-999-ZZ',
      notes: 'Véhicule adapté PMR',
    })
    expect(result.success).toBe(true)
  })

  test('missing name fails', () => {
    const result = createVehicleSchema.safeParse({ license_plate: 'AB-123-CD' })
    expect(result.success).toBe(false)
  })

  test('missing license_plate fails', () => {
    const result = createVehicleSchema.safeParse({ name: 'Kangoo' })
    expect(result.success).toBe(false)
  })

  test('invalid license plate format fails', () => {
    const result = createVehicleSchema.safeParse({ name: 'Kangoo', license_plate: '1234-AB-56' })
    expect(result.success).toBe(false)
  })

  test('lowercase license plate fails', () => {
    const result = createVehicleSchema.safeParse({ name: 'Kangoo', license_plate: 'ab-123-cd' })
    expect(result.success).toBe(false)
  })
})

describe('updateVehicleSchema', () => {
  test('valid update passes', () => {
    const result = updateVehicleSchema.safeParse({
      id: '123e4567-e89b-42d3-a456-426614174000',
      name: 'New Name',
    })
    expect(result.success).toBe(true)
  })

  test('missing id fails', () => {
    const result = updateVehicleSchema.safeParse({ name: 'New Name' })
    expect(result.success).toBe(false)
  })

  test('invalid license plate in update fails', () => {
    const result = updateVehicleSchema.safeParse({
      id: '123e4567-e89b-42d3-a456-426614174000',
      license_plate: 'bad-plate',
    })
    expect(result.success).toBe(false)
  })
})
