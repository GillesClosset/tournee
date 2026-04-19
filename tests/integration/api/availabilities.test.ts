import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PUT } from '@/app/api/schedules/[scheduleId]/availabilities/route'
import { mockAuthenticated, mockUnauthenticated } from '../../helpers/mock-auth'

vi.mock('@/lib/db', async () => {
  const { mockDb } = await import('../../helpers/mock-db')
  return { db: mockDb }
})
vi.mock('@/auth')

import { auth } from '@/auth'
import { makeChain, mockDb, resetDbMocks } from '../../helpers/mock-db'

const SCHEDULE_ID = 'uuid-sched-1'
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440004'

const FAKE_AVAILABILITY = {
  id: 'uuid-avail-1',
  scheduleId: SCHEDULE_ID,
  driverId: DRIVER_ID,
  vehicleId: null,
  dayOfWeek: 1,
  startTime: '08:00',
  endTime: '17:00',
  isAvailable: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  driverName: 'Alice',
  vehicleName: null,
  vehiclePlate: null,
}

function makeParams(scheduleId: string) {
  return { params: Promise.resolve({ scheduleId }) }
}

const VALID_AVAILABILITY_ITEM = {
  driver_id: DRIVER_ID,
  vehicle_id: null,
  day_of_week: 1,
  start_time: '08:00',
  end_time: '17:00',
  is_available: true,
}

beforeEach(() => {
  resetDbMocks()
  mockAuthenticated(vi.mocked(auth))
})

describe('GET /api/schedules/[scheduleId]/availabilities', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}/availabilities`)
    const res = await GET(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(401)
  })

  it('returns 200 with array scoped to scheduleId', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([FAKE_AVAILABILITY]))
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}/availabilities`)
    const res = await GET(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data[0].scheduleId).toBe(SCHEDULE_ID)
  })
})

describe('PUT /api/schedules/[scheduleId]/availabilities', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}/availabilities`, {
      method: 'PUT',
      body: JSON.stringify([VALID_AVAILABILITY_ITEM]),
    })
    const res = await PUT(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(401)
  })

  it('returns 200 and upserts availabilities when schedule exists', async () => {
    const FAKE_SCHEDULE = { id: SCHEDULE_ID, status: 'draft' }
    mockDb.select.mockReturnValueOnce(makeChain([FAKE_SCHEDULE]))
    mockDb.transaction.mockImplementation(async (fn: (tx: typeof mockDb) => unknown) => {
      mockDb.delete.mockReturnValueOnce(makeChain(undefined))
      mockDb.insert.mockReturnValueOnce(makeChain([FAKE_AVAILABILITY]))
      mockDb.update.mockReturnValueOnce(makeChain([]))
      return fn(mockDb)
    })
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}/availabilities`, {
      method: 'PUT',
      body: JSON.stringify([VALID_AVAILABILITY_ITEM]),
    })
    const res = await PUT(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(200)
  })

  it('returns 404 when schedule does not exist', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([]))
    const req = new Request('http://localhost/api/schedules/nonexistent/availabilities', {
      method: 'PUT',
      body: JSON.stringify([VALID_AVAILABILITY_ITEM]),
    })
    const res = await PUT(req as never, makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 400 on invalid payload', async () => {
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}/availabilities`, {
      method: 'PUT',
      body: JSON.stringify([{ bad: 'data' }]),
    })
    const res = await PUT(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(400)
  })
})
