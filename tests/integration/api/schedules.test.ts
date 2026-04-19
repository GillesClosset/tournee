import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as listSchedules, POST as createSchedule } from '@/app/api/schedules/route'
import { GET as getSchedule, PATCH as patchSchedule } from '@/app/api/schedules/[scheduleId]/route'
import { mockAuthenticated, mockUnauthenticated } from '../../helpers/mock-auth'

vi.mock('@/lib/db', async () => {
  const { mockDb } = await import('../../helpers/mock-db')
  return { db: mockDb }
})
vi.mock('@/auth')

import { auth } from '@/auth'
import { makeChain, mockDb, resetDbMocks } from '../../helpers/mock-db'

const SCHEDULE_ID = 'uuid-sched-1'
const FAKE_SCHEDULE = {
  id: SCHEDULE_ID,
  weekStartDate: '2025-01-06',
  status: 'draft',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  availabilityCount: 0,
}

function makeParams(scheduleId: string) {
  return { params: Promise.resolve({ scheduleId }) }
}

beforeEach(() => {
  resetDbMocks()
  mockAuthenticated(vi.mocked(auth))
})

describe('GET /api/schedules', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const res = await listSchedules()
    expect(res.status).toBe(401)
  })

  it('returns 200 with array shape', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([FAKE_SCHEDULE]))
    const res = await listSchedules()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.data)).toBe(true)
  })
})

describe('POST /api/schedules', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const req = new Request('http://localhost/api/schedules', {
      method: 'POST',
      body: JSON.stringify({ week_start_date: '2025-01-06' }),
    })
    const res = await createSchedule(req as never)
    expect(res.status).toBe(401)
  })

  it('returns 201 on valid body (new week)', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([]))
    mockDb.insert.mockReturnValueOnce(makeChain([FAKE_SCHEDULE]))
    const req = new Request('http://localhost/api/schedules', {
      method: 'POST',
      body: JSON.stringify({ week_start_date: '2025-01-06' }),
    })
    const res = await createSchedule(req as never)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toMatchObject({ weekStartDate: '2025-01-06' })
  })

  it('returns 409 when schedule already exists for the week', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([{ id: SCHEDULE_ID }]))
    const req = new Request('http://localhost/api/schedules', {
      method: 'POST',
      body: JSON.stringify({ week_start_date: '2025-01-06' }),
    })
    const res = await createSchedule(req as never)
    expect(res.status).toBe(409)
  })

  it('returns 400 on invalid date format', async () => {
    const req = new Request('http://localhost/api/schedules', {
      method: 'POST',
      body: JSON.stringify({ week_start_date: '06/01/2025' }),
    })
    const res = await createSchedule(req as never)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/schedules/[scheduleId]', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}`)
    const res = await getSchedule(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(401)
  })

  it('returns 200 with schedule data', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([FAKE_SCHEDULE]))
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}`)
    const res = await getSchedule(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toMatchObject({ id: SCHEDULE_ID })
  })

  it('returns 404 when scheduleId not found', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([]))
    const req = new Request('http://localhost/api/schedules/nonexistent')
    const res = await getSchedule(req as never, makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/schedules/[scheduleId]', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'configured' }),
    })
    const res = await patchSchedule(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(401)
  })

  it('returns 200 with updated schedule', async () => {
    mockDb.update.mockReturnValueOnce(makeChain([{ ...FAKE_SCHEDULE, status: 'configured' }]))
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'configured' }),
    })
    const res = await patchSchedule(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('configured')
  })

  it('returns 404 when schedule not found', async () => {
    mockDb.update.mockReturnValueOnce(makeChain([]))
    const req = new Request('http://localhost/api/schedules/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'configured' }),
    })
    const res = await patchSchedule(req as never, makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })
})
