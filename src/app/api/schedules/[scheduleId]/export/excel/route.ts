import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { weeklySchedules } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { fetchToursWithRelations } from '@/lib/db/queries/tours'
import { buildExcelBuffer } from '@/lib/export/excel'
import type { ScheduleStatus } from '@/types/domain'

const EXPORTABLE_STATUSES: ScheduleStatus[] = ['generated', 'modified', 'confirmed']

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> },
) {
  const session = await auth()
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { scheduleId } = await params

  const [schedule] = await db
    .select()
    .from(weeklySchedules)
    .where(eq(weeklySchedules.id, scheduleId))
    .limit(1)

  if (!schedule) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!EXPORTABLE_STATUSES.includes(schedule.status as ScheduleStatus)) {
    return new Response(JSON.stringify({ error: 'Schedule not yet generated' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const data = await fetchToursWithRelations(scheduleId)
  const buffer = buildExcelBuffer(data, schedule.weekStartDate)
  const filename = `planning-${schedule.weekStartDate}.xlsx`

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
