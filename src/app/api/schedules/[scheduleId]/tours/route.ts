import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { weeklySchedules } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { fetchToursWithRelations } from '@/lib/db/queries/tours'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { scheduleId } = await params

    // Verify schedule exists
    const [schedule] = await db
      .select()
      .from(weeklySchedules)
      .where(eq(weeklySchedules.id, scheduleId))
      .limit(1)

    if (!schedule) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const data = await fetchToursWithRelations(scheduleId)
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
