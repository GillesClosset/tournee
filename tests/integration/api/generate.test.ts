import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/schedules/[scheduleId]/generate/route'
import { mockAuthenticated, mockUnauthenticated } from '../../helpers/mock-auth'

vi.mock('@/lib/db', async () => {
  const { mockDb } = await import('../../helpers/mock-db')
  return { db: mockDb }
})
vi.mock('@/auth')
vi.mock('@/lib/engine/generate', () => ({
  generateTours: vi.fn().mockResolvedValue({
    stats: { totalTours: 3, totalStops: 12, unassignedCount: 0 },
    warnings: [],
    unassigned: [],
  }),
}))

import { auth } from '@/auth'
import { generateTours } from '@/lib/engine/generate'
import { makeChain, mockDb, resetDbMocks } from '../../helpers/mock-db'

const SCHEDULE_ID = 'uuid-sched-1'
const FAKE_SCHEDULE_IMPORTED = { id: SCHEDULE_ID, status: 'imported', weekStartDate: '2025-01-06' }

function makeParams(scheduleId: string) {
  return { params: Promise.resolve({ scheduleId }) }
}

beforeEach(() => {
  resetDbMocks()
  mockAuthenticated(vi.mocked(auth))
  vi.mocked(generateTours).mockResolvedValue({
    stats: { totalTours: 3, totalStops: 12, unassignedCount: 0 },
    warnings: [],
    unassigned: [],
  } as never)
})

describe('POST /api/schedules/[scheduleId]/generate', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}/generate`, {
      method: 'POST',
    })
    const res = await POST(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(401)
  })

  it('returns 404 when schedule does not exist', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([]))
    const req = new Request('http://localhost/api/schedules/nonexistent/generate', {
      method: 'POST',
    })
    const res = await POST(req as never, makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 400 when schedule status is not generatable', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([{ ...FAKE_SCHEDULE_IMPORTED, status: 'draft' }]))
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}/generate`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(400)
  })

  it('returns 200 with tour summary on success', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([FAKE_SCHEDULE_IMPORTED]))
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}/generate`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveProperty('summary')
    expect(body.data.summary).toHaveProperty('totalTours')
  })

  it('calls generateTours with the scheduleId (no real DB/network calls)', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([FAKE_SCHEDULE_IMPORTED]))
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}/generate`, {
      method: 'POST',
    })
    await POST(req as never, makeParams(SCHEDULE_ID))
    expect(generateTours).toHaveBeenCalledWith(SCHEDULE_ID)
  })
})
