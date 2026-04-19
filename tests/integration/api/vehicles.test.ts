import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST, PATCH } from '@/app/api/vehicles/route'
import { mockAuthenticated, mockUnauthenticated } from '../../helpers/mock-auth'

vi.mock('@/lib/db', async () => {
  const { mockDb } = await import('../../helpers/mock-db')
  return { db: mockDb }
})
vi.mock('@/auth')

import { auth } from '@/auth'
import { makeChain, mockDb, resetDbMocks } from '../../helpers/mock-db'

const FAKE_VEHICLE = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  name: 'Transit',
  licensePlate: 'AB-123-CD',
  notes: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => {
  resetDbMocks()
  mockAuthenticated(vi.mocked(auth))
})

describe('GET /api/vehicles', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 200 with array shape', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([FAKE_VEHICLE]))
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data[0]).toMatchObject({ name: 'Transit', licensePlate: 'AB-123-CD' })
  })
})

describe('POST /api/vehicles', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const req = new Request('http://localhost/api/vehicles', {
      method: 'POST',
      body: JSON.stringify({ name: 'Transit', license_plate: 'AB-123-CD' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(401)
  })

  it('returns 201 with created vehicle on valid body', async () => {
    mockDb.insert.mockReturnValueOnce(makeChain([FAKE_VEHICLE]))
    const req = new Request('http://localhost/api/vehicles', {
      method: 'POST',
      body: JSON.stringify({ name: 'Transit', license_plate: 'AB-123-CD' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toMatchObject({ name: 'Transit' })
  })

  it('returns 400 when name is missing', async () => {
    const req = new Request('http://localhost/api/vehicles', {
      method: 'POST',
      body: JSON.stringify({ license_plate: 'AB-123-CD' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when license_plate format is invalid', async () => {
    const req = new Request('http://localhost/api/vehicles', {
      method: 'POST',
      body: JSON.stringify({ name: 'Transit', license_plate: 'INVALID' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/vehicles', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const req = new Request('http://localhost/api/vehicles', {
      method: 'PATCH',
      body: JSON.stringify({ id: '550e8400-e29b-41d4-a716-446655440002', name: 'Updated' }),
    })
    const res = await PATCH(req as never)
    expect(res.status).toBe(401)
  })

  it('returns 200 with updated vehicle', async () => {
    mockDb.update.mockReturnValueOnce(makeChain([{ ...FAKE_VEHICLE, name: 'Updated' }]))
    const req = new Request('http://localhost/api/vehicles', {
      method: 'PATCH',
      body: JSON.stringify({ id: '550e8400-e29b-41d4-a716-446655440002', name: 'Updated' }),
    })
    const res = await PATCH(req as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.name).toBe('Updated')
  })

  it('returns 404 when vehicle not found', async () => {
    mockDb.update.mockReturnValueOnce(makeChain([]))
    const req = new Request('http://localhost/api/vehicles', {
      method: 'PATCH',
      body: JSON.stringify({ id: '550e8400-e29b-41d4-a716-446655440002', name: 'Ghost' }),
    })
    const res = await PATCH(req as never)
    expect(res.status).toBe(404)
  })
})
