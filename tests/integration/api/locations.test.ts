import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST, PATCH } from '@/app/api/locations/route'
import { mockAuthenticated, mockUnauthenticated } from '../../helpers/mock-auth'

vi.mock('@/lib/db', async () => {
  const { mockDb } = await import('../../helpers/mock-db')
  return { db: mockDb }
})
vi.mock('@/auth')
vi.mock('@/lib/routing/ors-client', () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ latitude: 43.7, longitude: 7.2 }),
}))

import { auth } from '@/auth'
import { makeChain, mockDb, resetDbMocks } from '../../helpers/mock-db'

const FAKE_LOCATION = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  name: 'Villa Béluga',
  address: '1 Rue de la Mer, Nice',
  locationType: 'villa',
  parkingDifficulty: false,
  notes: null,
  latitude: '43.7',
  longitude: '7.2',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => {
  resetDbMocks()
  mockAuthenticated(vi.mocked(auth))
})

describe('GET /api/locations', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 200 with array shape', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([FAKE_LOCATION]))
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data[0]).toMatchObject({ name: 'Villa Béluga', locationType: 'villa' })
  })
})

describe('POST /api/locations', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const req = new Request('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Villa Béluga',
        address: '1 Rue de la Mer',
        location_type: 'villa',
      }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(401)
  })

  it('returns 201 on valid body', async () => {
    mockDb.insert.mockReturnValueOnce(makeChain([FAKE_LOCATION]))
    const req = new Request('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Villa Béluga',
        address: '1 Rue de la Mer, Nice',
        location_type: 'villa',
      }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toMatchObject({ name: 'Villa Béluga' })
  })

  it('returns 400 when location_type is invalid enum value', async () => {
    const req = new Request('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', address: '1 Rue Test', location_type: 'unknown_type' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when required fields are missing', async () => {
    const req = new Request('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Missing address' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/locations', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const req = new Request('http://localhost/api/locations', {
      method: 'PATCH',
      body: JSON.stringify({ id: '550e8400-e29b-41d4-a716-446655440003', name: 'Updated' }),
    })
    const res = await PATCH(req as never)
    expect(res.status).toBe(401)
  })

  it('returns 200 with updated location', async () => {
    mockDb.update.mockReturnValueOnce(makeChain([{ ...FAKE_LOCATION, name: 'Updated' }]))
    const req = new Request('http://localhost/api/locations', {
      method: 'PATCH',
      body: JSON.stringify({ id: '550e8400-e29b-41d4-a716-446655440003', name: 'Updated' }),
    })
    const res = await PATCH(req as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.name).toBe('Updated')
  })

  it('returns 404 when location not found', async () => {
    mockDb.update.mockReturnValueOnce(makeChain([]))
    const req = new Request('http://localhost/api/locations', {
      method: 'PATCH',
      body: JSON.stringify({ id: '550e8400-e29b-41d4-a716-446655440003', name: 'Ghost' }),
    })
    const res = await PATCH(req as never)
    expect(res.status).toBe(404)
  })
})
