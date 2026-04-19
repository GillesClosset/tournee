import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST, PATCH } from '@/app/api/drivers/route'
import { mockAuthenticated, mockUnauthenticated } from '../../helpers/mock-auth'

vi.mock('@/lib/db', async () => {
  const { mockDb } = await import('../../helpers/mock-db')
  return { db: mockDb }
})
vi.mock('@/auth')

import { auth } from '@/auth'
import { makeChain, mockDb, resetDbMocks } from '../../helpers/mock-db'

const FAKE_DRIVER = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Alice',
  notes: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => {
  resetDbMocks()
  mockAuthenticated(vi.mocked(auth))
})

describe('GET /api/drivers', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 200 with array shape when authenticated', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([FAKE_DRIVER]))
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data[0]).toMatchObject({ id: '550e8400-e29b-41d4-a716-446655440001', name: 'Alice' })
  })
})

describe('POST /api/drivers', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const req = new Request('http://localhost/api/drivers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bob' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(401)
  })

  it('returns 201 with created driver on valid body', async () => {
    mockDb.insert.mockReturnValueOnce(makeChain([FAKE_DRIVER]))
    const req = new Request('http://localhost/api/drivers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Alice' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toMatchObject({ name: 'Alice' })
  })

  it('returns 400 when name is missing', async () => {
    const req = new Request('http://localhost/api/drivers', {
      method: 'POST',
      body: JSON.stringify({ notes: 'no name' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/drivers', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const req = new Request('http://localhost/api/drivers', {
      method: 'PATCH',
      body: JSON.stringify({ id: '550e8400-e29b-41d4-a716-446655440001', name: 'Alice Updated' }),
    })
    const res = await PATCH(req as never)
    expect(res.status).toBe(401)
  })

  it('returns 200 with updated driver', async () => {
    mockDb.update.mockReturnValueOnce(makeChain([{ ...FAKE_DRIVER, name: 'Alice Updated' }]))
    const req = new Request('http://localhost/api/drivers', {
      method: 'PATCH',
      body: JSON.stringify({ id: '550e8400-e29b-41d4-a716-446655440001', name: 'Alice Updated' }),
    })
    const res = await PATCH(req as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.name).toBe('Alice Updated')
  })

  it('returns 404 when driver not found', async () => {
    mockDb.update.mockReturnValueOnce(makeChain([]))
    const req = new Request('http://localhost/api/drivers', {
      method: 'PATCH',
      body: JSON.stringify({ id: '550e8400-e29b-41d4-a716-446655440001', name: 'Ghost' }),
    })
    const res = await PATCH(req as never)
    expect(res.status).toBe(404)
  })
})
