import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH } from '@/app/api/schedules/[scheduleId]/tours/route'
import { mockAuthenticated, mockUnauthenticated } from '../../helpers/mock-auth'

vi.mock('@/lib/db', async () => {
  const { mockDb } = await import('../../helpers/mock-db')
  return { db: mockDb }
})
vi.mock('@/auth')
vi.mock('@/lib/db/queries/tours', () => ({
  fetchToursWithRelations: vi.fn().mockResolvedValue({ tours: [], unassigned: [], summary: null }),
}))
vi.mock('@/lib/db/queries/tour-edits', () => ({
  applyTourEdits: vi.fn().mockResolvedValue(undefined),
}))

import { auth } from '@/auth'
import { fetchToursWithRelations } from '@/lib/db/queries/tours'
import { makeChain, mockDb, resetDbMocks } from '../../helpers/mock-db'

const SCHEDULE_ID = 'uuid-sched-1'
const FAKE_SCHEDULE = { id: SCHEDULE_ID, status: 'generated', weekStartDate: '2025-01-06' }
const TOUR_UUID = '550e8400-e29b-41d4-a716-446655440010'
const STOP_UUID = '550e8400-e29b-41d4-a716-446655440011'

// A valid tour edit action (reorder requires at least 1 stopId)
const VALID_TOUR_ACTION = {
  type: 'reorder',
  tourId: TOUR_UUID,
  stopIds: [STOP_UUID],
}

function makeParams(scheduleId: string) {
  return { params: Promise.resolve({ scheduleId }) }
}

beforeEach(() => {
  resetDbMocks()
  mockAuthenticated(vi.mocked(auth))
  vi.mocked(fetchToursWithRelations).mockResolvedValue({
    tours: [],
    unassigned: [],
    summary: null,
  } as never)
})

describe('GET /api/schedules/[scheduleId]/tours', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}/tours`)
    const res = await GET(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(401)
  })

  it('returns 200 with tours data when schedule exists', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([FAKE_SCHEDULE]))
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}/tours`)
    const res = await GET(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('data')
  })

  it('returns 404 when schedule not found', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([]))
    const req = new Request('http://localhost/api/schedules/nonexistent/tours')
    const res = await GET(req as never, makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/schedules/[scheduleId]/tours', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}/tours`, {
      method: 'PATCH',
      body: JSON.stringify({ actions: [VALID_TOUR_ACTION] }),
    })
    const res = await PATCH(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(401)
  })

  it('returns 200 after applying tour edits', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([FAKE_SCHEDULE]))
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}/tours`, {
      method: 'PATCH',
      body: JSON.stringify({ actions: [VALID_TOUR_ACTION] }),
    })
    const res = await PATCH(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(200)
  })

  it('returns 404 when schedule not found', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([]))
    const req = new Request('http://localhost/api/schedules/nonexistent/tours', {
      method: 'PATCH',
      body: JSON.stringify({ actions: [VALID_TOUR_ACTION] }),
    })
    const res = await PATCH(req as never, makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })
})
