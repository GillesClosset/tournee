import { describe, test, expect } from 'vitest'
import { generateRequestSchema, GENERATABLE_STATUSES } from '@/lib/validators/generate.schema'

describe('generateRequestSchema', () => {
  test('empty object passes with defaults', () => {
    const result = generateRequestSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.force).toBe(false)
    }
  })

  test('force: true passes', () => {
    const result = generateRequestSchema.safeParse({ force: true })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.force).toBe(true)
    }
  })

  test('force: false passes', () => {
    const result = generateRequestSchema.safeParse({ force: false })
    expect(result.success).toBe(true)
  })

  test('invalid force type fails', () => {
    const result = generateRequestSchema.safeParse({ force: 'yes' })
    expect(result.success).toBe(false)
  })
})

describe('GENERATABLE_STATUSES', () => {
  test('includes configured and imported', () => {
    expect(GENERATABLE_STATUSES).toContain('configured')
    expect(GENERATABLE_STATUSES).toContain('imported')
  })

  test('does not include draft or generated', () => {
    expect(GENERATABLE_STATUSES).not.toContain('draft')
    expect(GENERATABLE_STATUSES).not.toContain('generated')
  })
})
