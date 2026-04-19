import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/schedules/[scheduleId]/import/route'
import { mockAuthenticated, mockUnauthenticated } from '../../helpers/mock-auth'
import * as XLSX from 'xlsx'

vi.mock('@/lib/db', async () => {
  const { mockDb } = await import('../../helpers/mock-db')
  return { db: mockDb }
})
vi.mock('@/auth')
vi.mock('@/lib/import/import-pipeline', () => ({
  runImportPipeline: vi.fn().mockReturnValue({
    rows: [
      {
        dayOfWeek: 1,
        locationId: 'loc-1',
        requestedTime: '08:30',
        timeRangeEnd: null,
        minorName: 'Jean',
        missionText: 'Accompagnement école',
        missionType: null,
        accompanimentType: null,
        isPriorityFlagged: false,
        observations: null,
        rawRowData: {},
      },
    ],
    warnings: [],
    errors: [],
  }),
}))

import { auth } from '@/auth'
import { makeChain, mockDb, resetDbMocks } from '../../helpers/mock-db'

const SCHEDULE_ID = 'uuid-sched-1'
const FAKE_SCHEDULE_CONFIGURED = {
  id: SCHEDULE_ID,
  status: 'configured',
  weekStartDate: '2025-01-06',
}

function makeParams(scheduleId: string) {
  return { params: Promise.resolve({ scheduleId }) }
}

function makeXlsxFile(name = 'missions.xlsx'): File {
  const ws = XLSX.utils.aoa_to_sheet([['Lundi 06-Jan', 'Test loc', '8h30', 'Jean', 'École', '']])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Feuil1')
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new File([new Uint8Array(buffer)], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

beforeEach(() => {
  resetDbMocks()
  mockAuthenticated(vi.mocked(auth))
})

describe('POST /api/schedules/[scheduleId]/import', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticated(vi.mocked(auth))
    const formData = new FormData()
    formData.append('file', makeXlsxFile())
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}/import`, {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(401)
  })

  it('returns 404 when schedule does not exist', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([]))
    const formData = new FormData()
    formData.append('file', makeXlsxFile())
    const req = new Request('http://localhost/api/schedules/nonexistent/import', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req as never, makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 400 when schedule status is draft (not configured)', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([{ ...FAKE_SCHEDULE_CONFIGURED, status: 'draft' }]))
    const formData = new FormData()
    formData.append('file', makeXlsxFile())
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}/import`, {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(400)
  })

  it('returns 400 when no file is provided', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([FAKE_SCHEDULE_CONFIGURED]))
    const formData = new FormData()
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}/import`, {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(400)
  })

  it('returns 400 when file is not .xlsx', async () => {
    mockDb.select.mockReturnValueOnce(makeChain([FAKE_SCHEDULE_CONFIGURED]))
    const textFile = new File(['hello'], 'missions.csv', { type: 'text/csv' })
    const formData = new FormData()
    formData.append('file', textFile)
    const req = new Request(`http://localhost/api/schedules/${SCHEDULE_ID}/import`, {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(400)
  })

  it('returns 200 with import summary on success', async () => {
    mockDb.select
      .mockReturnValueOnce(makeChain([FAKE_SCHEDULE_CONFIGURED]))
      .mockReturnValueOnce(makeChain([{ id: 'loc-1', name: 'Test loc' }]))
    mockDb.transaction.mockImplementation(async (fn: (tx: typeof mockDb) => unknown) => {
      mockDb.delete.mockReturnValueOnce(makeChain(undefined))
      mockDb.insert.mockReturnValueOnce(makeChain([]))
      mockDb.update.mockReturnValueOnce(makeChain([]))
      return fn(mockDb)
    })

    // Use a mock request with an explicit formData() to avoid jsdom File/Blob
    // serialization issues in multipart parsing.
    const xlsxFile = makeXlsxFile()
    const mockFormData = new FormData()
    mockFormData.append('file', xlsxFile)
    const req = {
      formData: vi.fn().mockResolvedValue(mockFormData),
    }
    const res = await POST(req as never, makeParams(SCHEDULE_ID))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('imported')
    expect(typeof body.imported).toBe('number')
  })
})
